import React, { useRef, useMemo, useEffect } from "react";
import { extend, useThree, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { useOcearoContext } from "../../context/OcearoContext";
import { useTexture } from "@react-three/drei";

// Extend the Water and Sky components for use in JSX
extend({ Water, Sky });

function Ocean3D() {
  const { nightMode } = useOcearoContext();
  const ref = useRef();
  const skyRef = useRef();
  const moonRef = useRef();
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
  
  // Setup sky and sun/moon
  useFrame(() => {
    // Adjust sun/moon position parameters based on night mode
    const elevation = nightMode ? 45 : 2; // Moon higher in the sky
    const azimuth = nightMode ? 30 : 180; // Moon at different angle than sun
    
    if (skyRef.current) {
      const uniforms = skyRef.current.material.uniforms;
      
      if (nightMode) {
        // Night sky parameters - dark sky with more stars
        uniforms['turbidity'].value = 0.2; // Clear night sky
        uniforms['rayleigh'].value = 0.5; // Reduces blue scattering at night
        uniforms['mieCoefficient'].value = 0.01; // More pronounced light source glow
        uniforms['mieDirectionalG'].value = 0.8; // Sharp moon glow
      } else {
        // Day sky parameters
        uniforms['turbidity'].value = 1; // Clear daytime sky
        uniforms['rayleigh'].value = 1; // Standard blue sky scattering
        uniforms['mieCoefficient'].value = 0.003; // Lower scattering
        uniforms['mieDirectionalG'].value = 0.5; // Sun glow
      }
      
      // Calculate sun position
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      
      // Update sky and water uniforms
      uniforms['sunPosition'].value.copy(sun);
      if (ref.current) {
        ref.current.material.uniforms['sunDirection'].value.copy(sun).normalize();
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
      
      <water
        ref={ref}
        args={[geom, config]}
        rotation-x={-Math.PI / 2}
        position={[0, -1, 0]} // Slightly lower position to better hide edges
      />
    </>
  );
}

export default Ocean3D;
