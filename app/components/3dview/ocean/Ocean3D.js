import React, { useRef, useMemo, useEffect } from "react";
import { extend, useThree, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { useOcearoContext } from "../../context/OcearoContext";
import { useTexture, Stars } from "@react-three/drei";
import configService from "../../settings/ConfigService";

// Extend the Water and Sky components for use in JSX
extend({ Water, Sky });

function Ocean3D() {
  const { nightMode, setNightMode, getSignalKValue } = useOcearoContext();
  const ref = useRef();
  const skyRef = useRef();
  const moonRef = useRef();
  const sunMeshRef = useRef();
  const debugStartTimeRef = useRef(null);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const sun = useMemo(() => new THREE.Vector3(), []);
  
  // Load moon texture
  const moonTexture = useTexture("assets/moon.jpg");
  
  // Load and memoize waterNormals texture
  const waterNormals = useLoader(THREE.TextureLoader, "assets/waternormals.jpg");
  useMemo(() => {
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [waterNormals]);

  // Memoize plane geometry and water configuration to avoid unnecessary re-creations
  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000, 32, 32), []); // Increased plane size to hide borders
  const config = useMemo(() => ({
    textureWidth: 256,
    textureHeight: 256,
    waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: nightMode ? 0xc0e8ff : 0xffffff, // Cooler color for night mode (moonlight)
    waterColor: nightMode ? 0x001a2e : 0x0077cc, // Darker blue water at night
    distortionScale: 2.0, // Lower distortion for clearer water
    format: gl.outputColorSpace, // Updated from encoding to outputColorSpace
    reflectivity: 0, // No reflections
  }), [waterNormals, gl.outputColorSpace, nightMode]);
  
  // Setup sky and sun/moon using real sun position based on time and boat position
  useFrame(() => {
    // Get current position from SignalK (latitude/longitude in degrees)
    const position = getSignalKValue
      ? getSignalKValue("navigation.position")
      : null;

    // Fallback to a default position if none is available
    const latitude = position && typeof position.latitude === "number" ? position.latitude : 46.15; // Approx. La Rochelle
    const longitude = position && typeof position.longitude === "number" ? position.longitude : -1.15;

    const now = new Date();

    const debugMode = configService.get("debugMode");
    let timeSource = now;

    if (debugMode) {
      if (debugStartTimeRef.current === null) {
        debugStartTimeRef.current = Date.now();
      }

      const elapsedMs = Date.now() - debugStartTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;

      const simulatedDaySeconds = (elapsedSeconds * (86400 / 120)) % 86400;
      const simulatedHour = Math.floor(simulatedDaySeconds / 3600);
      const simulatedMinute = Math.floor((simulatedDaySeconds % 3600) / 60);

      const simulatedNow = new Date(now.getTime());
      simulatedNow.setHours(simulatedHour, simulatedMinute, 0, 0);
      timeSource = simulatedNow;
    }

    // Calculate day of year
    const startOfYear = new Date(timeSource.getFullYear(), 0, 0);
    const diff = timeSource - startOfYear + (startOfYear.getTimezoneOffset() - timeSource.getTimezoneOffset()) * 60000;
    const dayOfYear = diff / 86400000;

    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    // Fractional year (gamma) in radians, NOAA formula
    const hour = timeSource.getHours();
    const minute = timeSource.getMinutes();
    const gamma = 2 * Math.PI / 365 * (dayOfYear - 1 + (hour - 12) / 24);

    // Equation of time (minutes) and solar declination (radians)
    const eqTime = 229.18 * (
      0.000075
      + 0.001868 * Math.cos(gamma)
      - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma)
      - 0.040849 * Math.sin(2 * gamma)
    );

    const decl =
      0.006918
      - 0.399912 * Math.cos(gamma)
      + 0.070257 * Math.sin(gamma)
      - 0.006758 * Math.cos(2 * gamma)
      + 0.000907 * Math.sin(2 * gamma)
      - 0.002697 * Math.cos(3 * gamma)
      + 0.00148 * Math.sin(3 * gamma);

    // Time zone offset in minutes (positive east of UTC)
    const tzOffsetMinutes = -timeSource.getTimezoneOffset();

    // True solar time (minutes)
    const timeOffset = eqTime + 4 * longitude - tzOffsetMinutes;
    const trueSolarTimeMinutes = ((hour * 60 + minute) + timeOffset + 1440) % 1440;

    // Hour angle in degrees
    const hourAngleDeg = trueSolarTimeMinutes / 4 - 180;
    const hourAngleRad = hourAngleDeg * rad;

    const latRad = latitude * rad;

    // Solar zenith angle
    const cosZenith =
      Math.sin(latRad) * Math.sin(decl)
      + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngleRad);
    const zenithRad = Math.acos(Math.min(Math.max(cosZenith, -1), 1));

    const elevationDeg = 90 - zenithRad * deg;

    // Solar azimuth angle (0° = North, clockwise)
    const sinAzimuth = Math.sin(hourAngleRad);
    const cosAzimuth =
      Math.cos(hourAngleRad) * Math.sin(latRad)
      - Math.tan(decl) * Math.cos(latRad);
    let azimuthDeg = Math.atan2(sinAzimuth, cosAzimuth) * deg;
    azimuthDeg = (azimuthDeg + 360) % 360;

    // Twilight band for smoother transition (degrees above/below horizon)
    const twilightStart = -10; // fully night below this
    const twilightEnd = 5;     // fully day above this

    // Delay full "day" until the sun is a bit higher, extend darkness
    const isPhysicalNight = elevationDeg <= -5;

    // Synchronize global nightMode with physical night (with small hysteresis)
    if (isPhysicalNight && !nightMode) {
      setNightMode(true);
    } else if (!isPhysicalNight && nightMode && elevationDeg > 2) {
      // Only leave night mode once the sun is clearly above the horizon
      setNightMode(false);
    }

    // Night factor for smooth blending (0 = full day, 1 = full night)
    let nightFactor = 0;
    if (elevationDeg <= twilightStart) {
      nightFactor = 1;
    } else if (elevationDeg >= twilightEnd) {
      nightFactor = 0;
    } else {
      nightFactor = (twilightEnd - elevationDeg) / (twilightEnd - twilightStart);
    }

    // Effective night flag (after sync)
    const isNightSky = nightMode || isPhysicalNight;

    // Clamp elevation so sun/moon are always above horizon when visible
    const elevation = isNightSky
      ? Math.max(elevationDeg, 20) // Moon high enough at night
      : Math.max(elevationDeg, 10); // Keep sun at least 10° above horizon in day
    const azimuth = azimuthDeg;

    if (skyRef.current) {
      const uniforms = skyRef.current.material.uniforms;

      // Base parameters for day and night
      const dayParams = {
        turbidity: 1,
        rayleigh: 1,
        mieCoefficient: 0.003,
        mieDirectionalG: 0.5,
      };

      const nightParams = {
        turbidity: 0.2,
        rayleigh: 0.5,
        mieCoefficient: 0.01,
        mieDirectionalG: 0.8,
      };

      // Blend sky parameters based on nightFactor for smooth transition
      const turbidity = dayParams.turbidity + (nightParams.turbidity - dayParams.turbidity) * nightFactor;
      const rayleigh = dayParams.rayleigh + (nightParams.rayleigh - dayParams.rayleigh) * nightFactor;
      const mieCoefficient = dayParams.mieCoefficient + (nightParams.mieCoefficient - dayParams.mieCoefficient) * nightFactor;
      const mieDirectionalG = dayParams.mieDirectionalG + (nightParams.mieDirectionalG - dayParams.mieDirectionalG) * nightFactor;

      uniforms["turbidity"].value = turbidity;
      uniforms["rayleigh"].value = rayleigh;
      uniforms["mieCoefficient"].value = mieCoefficient;
      uniforms["mieDirectionalG"].value = mieDirectionalG;

      // Calculate sun position vector from elevation/azimuth
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      sun.setFromSphericalCoords(1, phi, theta);

      // Update sky and water uniforms
      uniforms["sunPosition"].value.copy(sun);
      if (ref.current) {
        ref.current.material.uniforms["sunDirection"].value.copy(sun).normalize();
      }

      // Update visible sun mesh position/visibility
      if (sunMeshRef.current) {
        sunMeshRef.current.position.copy(sun).multiplyScalar(2000);
        sunMeshRef.current.visible = !isNightSky;
      }

      // Update moon mesh position/visibility so it follows the sky path at night
      if (moonRef.current) {
        moonRef.current.position.copy(sun).multiplyScalar(2000);
        moonRef.current.visible = isNightSky;
      }
    }
  });
  
  // Set up scene background and fog
  useEffect(() => {
    // Set background color based on night mode
    if (nightMode) {
      // Dark blue/black background for night mode
      scene.background = new THREE.Color(0x000814);
    } else {
      // Bright blue sky color for day mode
      scene.background = new THREE.Color(0x87ceeb);
    }
    
    // Add fog to hide the water edges
    const fogColor = nightMode ? new THREE.Color(0x001220) : new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(fogColor, 0.00015);
    
    // Configure modern Three.js rendering
    gl.outputColorSpace = THREE.SRGBColorSpace; // Updated from sRGBEncoding
    
    return () => {
      // Cleanup when component unmounts
      scene.background = null;
      scene.environment = null;
      scene.fog = null;
    };
  }, [scene, nightMode, gl]);

  // Throttled water animation frame update
  let elapsedTime = 0;
  useFrame((state, delta) => {
    elapsedTime += delta;
    if (elapsedTime > 0.1) { // Update every 0.1 seconds for better performance
      if (ref.current) {
        ref.current.material.uniforms.time.value += elapsedTime * 0.5; // Slower wave animation
      }
      elapsedTime = 0;
    }
  });

  return (
    <>
      {/* Stars only in night mode */}
      {nightMode && (
        <Stars
          radius={6000}
          depth={100}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      )}

      {/* Sky only in day mode */}
      {!nightMode && (
        <sky
          ref={skyRef}
          scale={450000}
        />
      )}
      
      {/* Moon only in night mode */}
      {nightMode && (
        <mesh
          ref={moonRef}
          position={[600, 200, -1500]}
        >
          <sphereGeometry args={[80, 32, 32]} />
          <meshStandardMaterial 
            map={moonTexture}
            emissive={0xffffff}
            emissiveIntensity={0.8}
          />
        </mesh>
      )}

      {/* Visible sun mesh in day mode */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[60, 32, 32]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      
      <water
        ref={ref}
        args={[geom, config]}
        rotation-x={-Math.PI / 2}
        position={[0, -0.3, 0]} // Slightly lower position to better hide edges
      />
    </>
  );
}

export default Ocean3D;
