import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { ShaderMaterial, BoxBufferGeometry, Vector3, BackSide, Mesh } from 'three';
import { UniformsUtils } from 'three';
import { Sky as SkyShaderModule } from './three.module.js'; // Import your SkyShaderModule

// React component to integrate the Sky shader
const SeeSky3D = () => {
  const { scene } = useThree(); // Access the Three.js scene

  const skyRef = useRef(); // Create a ref to hold the Sky object

  useEffect(() => {
    // Create the Sky shader
    const shader = SkyShaderModule.SkyShader;

    // Create the shader material
    const material = new ShaderMaterial({
      name: 'SkyShader',
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: UniformsUtils.clone(shader.uniforms), // Clone the shader uniforms
      side: BackSide,
      depthWrite: false,
    });

    // Create the mesh with the BoxBufferGeometry
    const skyMesh = new Mesh(new BoxBufferGeometry(1, 1, 1), material);

    // Set the sun position (you can update this dynamically)
    material.uniforms.sunPosition.value = new Vector3(0, 1, 0);

    // Add the skyMesh to the scene
    scene.add(skyMesh);

    // Store the mesh in the ref for future reference (if needed)
    skyRef.current = skyMesh;

    // Clean up the Sky object when the component is unmounted
    return () => {
      scene.remove(skyMesh);
      skyMesh.geometry.dispose();
      skyMesh.material.dispose();
    };
  }, [scene]);

  return null; // This component doesn't render any JSX itself
};

export default SeeSky3D;
