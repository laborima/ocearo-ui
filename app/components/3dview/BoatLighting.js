import React from 'react';
import * as THREE from 'three';
import { useOcearoContext } from '../context/OcearoContext';

const BoatLighting = () => {
  const { states, nightMode } = useOcearoContext();
  
  // Adjust lighting based on night mode
  const ambientIntensity = nightMode ? 0.3 : 0.5;
  const mainLightIntensity = nightMode ? 0.8 : 1.4;
  const fillLightIntensity = nightMode ? 0.2 : 0.4;
  
  // Color adjustments for night mode
  const mainLightColor = nightMode ? "#c8e6ff" : "#ffffff"; 
  
  return (
    <>
      {/* Ambient light - general scene illumination */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Main directional light - coming from behind the scene */}
      <directionalLight
        position={[0, 70, -100]}
        intensity={mainLightIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
        color={mainLightColor}
      />
      
      {/* Point light from behind for backlighting effect */}
      <pointLight 
        position={[0, 40, -80]} 
        intensity={fillLightIntensity * 2.5} 
        distance={150}
        decay={2}
      />
      
      {/* Soft fill light from the front to avoid complete darkness */}
      <pointLight 
        position={[0, 30, 100]} 
        intensity={fillLightIntensity * 0.8} 
        distance={120}
        decay={2}
      />
    </>
  );
};

export default BoatLighting;