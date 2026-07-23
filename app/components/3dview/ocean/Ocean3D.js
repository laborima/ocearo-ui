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

// Module-level constants reused across frames to avoid per-frame allocations
const DAY_WATER_COLOR = new THREE.Color(0x004466);
const NIGHT_WATER_COLOR = new THREE.Color(0x000205);
// Lite (chart/meteo) water must match the dimmed OSM sea tone so the plane
// beyond the map edge reads as a continuation of the chart, not a dark band.
const LITE_DAY_WATER_COLOR = new THREE.Color(0xb4cbd1);
const _scratchWaterColor = new THREE.Color();

// The astronomical sun position and sky atmosphere barely change over a second.
// Recompute them at a low frequency (RPi5-friendly) while keeping the wave
// animation running every frame for smoothness.
const SKY_UPDATE_INTERVAL = 1.0; // seconds

const CLOUD_COUNT = 16;
const RAIN_COUNT = 1200;
const RAIN_BOX = 240;    // horizontal half-extent around the boat
const RAIN_HEIGHT = 220; // drops fall from this height
const _scratchCloudColor = new THREE.Color();

function Ocean3D({ lite = false }) {
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
  // Accumulator that throttles the heavy sky/sun recomputation
  const skyAccumRef = useRef(SKY_UPDATE_INTERVAL);
  
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

  // Dense enough for geometric swell near the boat (GPU vertex displacement)
  const geom = useMemo(() => new THREE.PlaneGeometry(4000, 4000, 144, 144), []);

  // Lite mode (chart/meteo): flat tinted water, no mirror pass — the Water
  // reflection renders the whole scene twice and is the main RPi5 cost.
  const liteWaterMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xb4cbd1 }), []);

  // Uniforms driving the swell displacement, shared with the patched shader
  const waveUniformsRef = useRef({ waveAmp: { value: 0 }, waveTime: { value: 0 } });

  // ── Weather visuals: drifting cloud sprites + rain particles ───────────────
  const cloudGroupRef = useRef();
  const rainRef = useRef();
  const rainActiveRef = useRef(false);

  // Soft radial puff texture generated locally (works offline)
  const cloudTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  const cloudSprites = useMemo(() => {
    const sprites = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const angle = (i / CLOUD_COUNT) * Math.PI * 2 + Math.random() * 0.6;
      const radius = 500 + Math.random() * 1200;
      sprites.push({
        position: [Math.cos(angle) * radius, 260 + Math.random() * 180, Math.sin(angle) * radius],
        scale: [420 + Math.random() * 380, 150 + Math.random() * 120, 1],
      });
    }
    return sprites;
  }, []);

  const cloudMaterial = useMemo(() => new THREE.SpriteMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    color: 0xffffff,
  }), [cloudTexture]);

  const rainGeometry = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * RAIN_BOX;
      positions[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * RAIN_BOX;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const rainMaterial = useMemo(() => new THREE.PointsMaterial({
    color: 0x9fc4d8,
    size: 1.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  // Initial water configuration
  const config = useMemo(() => ({
    // 256² reflection target: the Water mirror pass renders the whole scene again
    // each frame, so this is the single biggest GPU cost. 256 keeps it smooth on a RPi5.
    textureWidth: 256,
    textureHeight: 256,
    waterNormals,
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
    format: gl.outputColorSpace,
  }), [waterNormals, gl.outputColorSpace, scene.fog]);

  // Water mesh built imperatively so the shader can be patched before first
  // compile: vertices are displaced by a wind-driven swell (GPU-side).
  const water = useMemo(() => {
    if (lite) return null;
    const w = new Water(geom, config);
    const uniforms = waveUniformsRef.current;
    w.material.onBeforeCompile = (shader) => {
      shader.uniforms.waveAmp = uniforms.waveAmp;
      shader.uniforms.waveTime = uniforms.waveTime;
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', `
          uniform float waveAmp;
          uniform float waveTime;
          vec3 swellDisplace(vec3 p) {
            float fade = 1.0 - smoothstep(1500.0, 1900.0, max(abs(p.x), abs(p.y)));
            float w1 = sin(p.x * 0.076 + p.y * 0.048 + waveTime * 1.15);
            float w2 = sin(p.x * 0.041 - p.y * 0.052 + waveTime * 0.85);
            float w3 = sin(-p.x * 0.022 + p.y * 0.030 + waveTime * 0.55);
            p.z += waveAmp * fade * (0.55 * w1 + 0.30 * w2 + 0.15 * w3);
            return p;
          }
          void main() {
            vec3 wavePos = swellDisplace(position);
        `)
        .replace(/vec4\( position, 1.0 \)/g, 'vec4( wavePos, 1.0 )');
    };
    return w;
  }, [geom, config, lite]);

  // Main simulation loop
  useFrame((state, delta) => {
    // --- Cheap per-frame work: keep the waves animating smoothly ---
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
    }
    waveUniformsRef.current.waveTime.value += delta;

    // Cloud drift + falling rain (cheap per-frame updates)
    if (cloudGroupRef.current && cloudGroupRef.current.visible) {
      cloudGroupRef.current.rotation.y += delta * 0.004;
    }
    if (rainRef.current && rainActiveRef.current) {
      const attr = rainRef.current.geometry.attributes.position;
      const arr = attr.array;
      const fall = delta * 160;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= fall;
        if (arr[i] < 0) arr[i] += RAIN_HEIGHT;
      }
      attr.needsUpdate = true;
    }

    // --- Throttle the expensive astronomical / sky / color computation ---
    skyAccumRef.current += delta;
    if (skyAccumRef.current < SKY_UPDATE_INTERVAL) return;
    const elapsed = skyAccumRef.current;
    skyAccumRef.current = 0;

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

      // Smooth the wind speed change (elapsed = time since last sky update)
      smoothedWindSpeedRef.current += (windSpeed - smoothedWindSpeedRef.current) * Math.min(elapsed * 0.5, 1);

      // Calculate dynamic parameters
      // Distortion: 0 (calm) to ~8 (storm). Cap at 8.
      const targetDistortion = Math.min(Math.max(smoothedWindSpeedRef.current * 0.5, 0), 8);

      // Update Uniforms
      const waterUniforms = ref.current.material.uniforms;
      waterUniforms.distortionScale.value = targetDistortion;
      waterUniforms.sunDirection.value.copy(sun).normalize();

      // Geometric swell: significant wave height for a fully developed sea
      // Hs ≈ 0.21·U²/g, capped at 6 m; amplitude = Hs/2 in scene units
      const sceneScale = configService.get('aisLengthScalingFactor') || 0.7;
      const hs = Math.min((0.21 * smoothedWindSpeedRef.current ** 2) / 9.81, 6);
      waveUniformsRef.current.waveAmp.value = (hs / 2) * sceneScale;

      // Adjust water color based on night factor (reuse module-level colors, no per-frame alloc)
      // Day: Technical Deep Teal, Night: Ultra Dark Blue/Black
      _scratchWaterColor.copy(DAY_WATER_COLOR).lerp(NIGHT_WATER_COLOR, nightFactor);
      waterUniforms.sunColor.value.setHex(isNightSky ? 0x4488ff : 0xffffff); // More blueish moonlight
      waterUniforms.waterColor.value.copy(_scratchWaterColor);
    }

    if (lite) {
      _scratchWaterColor.copy(LITE_DAY_WATER_COLOR).lerp(NIGHT_WATER_COLOR, nightFactor);
      liteWaterMaterial.color.copy(_scratchWaterColor);
    }

    // Weather snapshot (forecast fallback handled by WeatherContext)
    const weather = getCurrentWeather();
    const cloudCover = Math.min(Math.max(weather?.cloudCover ?? 0, 0), 1);
    const rainMm = Math.max(weather?.rain ?? 0, 0);
    const isRaining = rainMm > 0.05;

    // Clouds: opacity and tint follow cover, night and rain
    if (cloudGroupRef.current) {
      cloudGroupRef.current.visible = cloudCover > 0.08;
      const brightness = (1 - 0.7 * nightFactor) * (isRaining ? 0.55 : 1);
      _scratchCloudColor.setScalar(brightness);
      cloudMaterial.color.copy(_scratchCloudColor);
      cloudMaterial.opacity = 0.15 + 0.55 * cloudCover;
    }

    // Rain: visible when the forecast reports precipitation
    rainActiveRef.current = isRaining;
    if (rainRef.current) {
      rainRef.current.visible = isRaining;
      rainMaterial.opacity = Math.min(0.3 + rainMm * 0.15, 0.75);
    }

    // 5. Update Sky - Dynamic Atmosphere
    if (skyRef.current) {
      const uniforms = skyRef.current.material.uniforms;

      // Weather influence: humidity haze + cloud cover whiten/darken the sky.
      // Lite (chart/meteo) caps the haze: those cameras look mostly at the
      // horizon band, which full turbidity washes to plain white.
      const humidity = weather?.humidity ?? 0.6;
      const rawTurbidity = 0.5 + (humidity * 0.5) + cloudCover * 9 + (isRaining ? 4 : 0);
      const baseTurbidity = lite ? Math.min(rawTurbidity, 2.5) : rawTurbidity;

      const dayParams = {
        turbidity: baseTurbidity,
        rayleigh: 1.2 * (1 - 0.5 * cloudCover), // Flatter light under overcast
        mieCoefficient: 0.005 + cloudCover * 0.02,
        mieDirectionalG: 0.8,
      };

      const nightParams = {
        turbidity: 0.05, 
        rayleigh: 0.1,
        mieCoefficient: 0.0005,
        mieDirectionalG: 0.95,
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
    const fogColor = nightMode ? new THREE.Color(0x000205) : new THREE.Color(0x001a26);
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(fogColor, 0.00035); // Slightly denser fog for depth
    gl.outputColorSpace = THREE.SRGBColorSpace;
    
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, nightMode, gl]);

  return (
    <>
      {nightMode && (
        <Stars radius={5000} depth={50} count={1500} factor={4} saturation={0} fade speed={1} />
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
      
      {/* Cloud layer — sprites drifting slowly, opacity driven by cloud cover */}
      <group ref={cloudGroupRef} visible={false}>
        {cloudSprites.map((c, i) => (
          <sprite key={i} position={c.position} scale={c.scale} material={cloudMaterial} />
        ))}
      </group>

      {/* Rain particles around the boat, visible when forecast reports rain */}
      <points ref={rainRef} geometry={rainGeometry} material={rainMaterial} visible={false} />

      {lite ? (
        <mesh
          geometry={geom}
          material={liteWaterMaterial}
          rotation-x={-Math.PI / 2}
          position={[0, -0.3, 0]}
        />
      ) : (
        <primitive
          ref={ref}
          object={water}
          rotation-x={-Math.PI / 2}
          position={[0, -0.3, 0]}
        />
      )}
    </>
  );
}

export default Ocean3D;
