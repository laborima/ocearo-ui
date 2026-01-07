import React, { useRef, useMemo, useEffect, useState } from "react";
import { extend, useThree, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { useOcearoContext } from "../../context/OcearoContext";
import { useWeather } from "../../context/WeatherContext";
import { useSignalKPath } from "../../hooks/useSignalK";
import { useTexture, Stars } from "@react-three/drei";
import configService from "../../settings/ConfigService";

// Extend the Water and Sky components for use in JSX
extend({ Water, Sky });

function Ocean3D() {
  const { nightMode, setNightMode } = useOcearoContext();
  const { getWindData, getCurrentWeather } = useWeather();
  
  const ref = useRef();
  const skyRef = useRef();
  const moonRef = useRef();
  const sunMeshRef = useRef();
  const debugStartTimeRef = useRef(null);
  
  // Use subscription for position to avoid getSignalKValue overhead in useFrame
  const position = useSignalKPath('navigation.position');
  const positionRef = useRef(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Refs for smoothing values
  const smoothedWindSpeedRef = useRef(0);
  
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

  // Memoize plane geometry
  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000, 32, 32), []); 

  // Initial water configuration
  const config = useMemo(() => ({
    textureWidth: 512, // Increased for better quality
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
    format: gl.outputColorSpace,
  }), [waterNormals, gl.outputColorSpace, scene.fog]);
  
  // Main simulation loop
  useFrame((state, delta) => {
    // 1. Get Time and Position from refs for maximum performance
    const currentPosition = positionRef.current;

    const latitude = currentPosition && typeof currentPosition.latitude === "number" ? currentPosition.latitude : 46.15;
    const longitude = currentPosition && typeof currentPosition.longitude === "number" ? currentPosition.longitude : -1.15;

    const now = new Date();
    const debugMode = configService.get("debugMode");
    let timeSource = now;

    if (debugMode) {
      if (debugStartTimeRef.current === null) {
        debugStartTimeRef.current = Date.now();
      }
      const elapsedMs = Date.now() - debugStartTimeRef.current;
      // Faster time simulation: 1 real second = 12 minutes (720x speed)
      const simulatedDaySeconds = (elapsedMs / 1000 * 720) % 86400; 
      const simulatedHour = Math.floor(simulatedDaySeconds / 3600);
      const simulatedMinute = Math.floor((simulatedDaySeconds % 3600) / 60);

      const simulatedNow = new Date(now.getTime());
      simulatedNow.setHours(simulatedHour, simulatedMinute, 0, 0);
      timeSource = simulatedNow;
    }

    // 2. Calculate Sun Position (NOAA Algorithm)
    const startOfYear = new Date(timeSource.getFullYear(), 0, 0);
    const diff = timeSource - startOfYear + (startOfYear.getTimezoneOffset() - timeSource.getTimezoneOffset()) * 60000;
    const dayOfYear = diff / 86400000;

    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    const hour = timeSource.getHours();
    const minute = timeSource.getMinutes();
    const gamma = 2 * Math.PI / 365 * (dayOfYear - 1 + (hour - 12) / 24);

    const eqTime = 229.18 * (
      0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
    );

    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
      - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
      - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

    const tzOffsetMinutes = -timeSource.getTimezoneOffset();
    const timeOffset = eqTime + 4 * longitude - tzOffsetMinutes;
    const trueSolarTimeMinutes = ((hour * 60 + minute) + timeOffset + 1440) % 1440;

    const hourAngleDeg = trueSolarTimeMinutes / 4 - 180;
    const hourAngleRad = hourAngleDeg * rad;
    const latRad = latitude * rad;

    const cosZenith = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngleRad);
    const zenithRad = Math.acos(Math.min(Math.max(cosZenith, -1), 1));
    const elevationDeg = 90 - zenithRad * deg;

    const sinAzimuth = Math.sin(hourAngleRad);
    const cosAzimuth = Math.cos(hourAngleRad) * Math.sin(latRad) - Math.tan(decl) * Math.cos(latRad);
    const azimuthDeg = (Math.atan2(sinAzimuth, cosAzimuth) * deg + 360) % 360;

    // Twilight band for smoother transition (degrees above/below horizon)
    const twilightStart = -10; // fully night below this
    const twilightEnd = 5;     // fully day above this

    // Delay full "day" until the sun is a bit higher, extend darkness
    const isPhysicalNight = elevationDeg <= -5;

    // Night factor for smooth blending (0 = full day, 1 = full night)
    let nightFactor = 0;
    if (elevationDeg <= twilightStart) {
      nightFactor = 1;
    } else if (elevationDeg >= twilightEnd) {
      nightFactor = 0;
    } else {
      nightFactor = (twilightEnd - elevationDeg) / (twilightEnd - twilightStart);
    }

    // Effective night flag for 3D scene rendering
    // We use physical night (sun position) OR manual night mode to determine scene appearance
    const isNightSky = nightMode || isPhysicalNight;

    // Clamp elevation so sun/moon are always above horizon when visible
    const elevation = isNightSky ? Math.max(elevationDeg, 20) : Math.max(elevationDeg, 5);
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuthDeg);
    sun.setFromSphericalCoords(1, phi, theta);

    // 4. Update Water - Dynamic Waves based on Wind
    if (ref.current) {
      // Get wind speed in m/s (default to 5 m/s if unavailable)
      const windSpeed = getWindData()?.speed ?? 5;
      
      // Smooth the wind speed change
      smoothedWindSpeedRef.current += (windSpeed - smoothedWindSpeedRef.current) * delta * 0.5;
      
      // Calculate dynamic parameters
      // Distortion: 0 (calm) to ~8 (storm). Cap at 8.
      const targetDistortion = Math.min(Math.max(smoothedWindSpeedRef.current * 0.5, 0), 8);
      
      // Update Uniforms
      const waterUniforms = ref.current.material.uniforms;
      waterUniforms.distortionScale.value = targetDistortion;
      waterUniforms.sunDirection.value.copy(sun).normalize();
      
      // Adjust water color based on night factor
      // Day: 0x001e0f (Deep Teal), Night: 0x000510 (Dark Blue/Black)
      const dayColor = new THREE.Color(0x0077be);
      const nightColor = new THREE.Color(0x000a12);
      const currentColor = dayColor.clone().lerp(nightColor, nightFactor);
      waterUniforms.sunColor.value.setHex(isNightSky ? 0x88aaee : 0xffffff); // Moonlight vs Sunlight
      waterUniforms.waterColor.value.copy(currentColor);
      
      // Animate waves
      waterUniforms.time.value += delta * 0.5;
    }

    // 5. Update Sky - Dynamic Atmosphere
    if (skyRef.current) {
      const uniforms = skyRef.current.material.uniforms;
      
      // Weather influence (e.g., from humidity/pressure if available)
      const weather = getCurrentWeather();
      // Simple heuristic: higher humidity = higher turbidity (hazier)
      // Normal range: 0.2 (clear) to 1.0 (hazy)
      const humidity = weather?.humidity ?? 0.6; 
      const baseTurbidity = 0.5 + (humidity * 0.5); 

      const dayParams = {
        turbidity: baseTurbidity,
        rayleigh: 1.5,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
      };

      const nightParams = {
        turbidity: 0.1, // Clearer at night usually
        rayleigh: 0.3,
        mieCoefficient: 0.001,
        mieDirectionalG: 0.9,
      };

      const lerpParam = (key) => dayParams[key] + (nightParams[key] - dayParams[key]) * nightFactor;

      uniforms.turbidity.value = lerpParam('turbidity');
      uniforms.rayleigh.value = lerpParam('rayleigh');
      uniforms.mieCoefficient.value = lerpParam('mieCoefficient');
      uniforms.mieDirectionalG.value = lerpParam('mieDirectionalG');
      uniforms.sunPosition.value.copy(sun);
    }

    // Update Mesh Positions
    if (sunMeshRef.current) {
      sunMeshRef.current.position.copy(sun).multiplyScalar(4000);
      sunMeshRef.current.visible = !isNightSky;
    }
    if (moonRef.current) {
      moonRef.current.position.copy(sun).multiplyScalar(4000);
      moonRef.current.visible = isNightSky;
      moonRef.current.lookAt(0, 0, 0); // Moon faces earth
    }
  });
  
  // Set background and fog
  useEffect(() => {
    const fogColor = nightMode ? new THREE.Color(0x000a12) : new THREE.Color(0x87CEEB);
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(fogColor, 0.00025);
    gl.outputColorSpace = THREE.SRGBColorSpace;
    
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, nightMode, gl]);

  return (
    <>
      {nightMode && (
        <Stars radius={5000} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      )}

      <sky ref={skyRef} scale={450000} />
      
      {nightMode && (
        <mesh ref={moonRef} position={[600, 200, -1500]}>
          <sphereGeometry args={[80, 32, 32]} />
          <meshStandardMaterial map={moonTexture} emissive={0xffffff} emissiveIntensity={0.8} />
        </mesh>
      )}

      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      
      <water
        ref={ref}
        args={[geom, config]}
        rotation-x={-Math.PI / 2}
        position={[0, -0.3, 0]}
      />
    </>
  );
}

export default Ocean3D;
