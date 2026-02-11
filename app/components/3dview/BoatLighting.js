import React from 'react';
import * as THREE from 'three';
import { useOcearoContext } from '../context/OcearoContext';

const BoatLighting = () => {
  const { states, nightMode } = useOcearoContext();
  
  // Adjust lighting based on night mode
  const ambientIntensity = nightMode ? 0.2 : 0.4;
  const mainLightIntensity = nightMode ? 0.6 : 1.2;
  const fillLightIntensity = nightMode ? 0.3 : 0.5;
  
  // Color adjustments for night mode
  const mainLightColor = nightMode ? "#b0d8ff" : "#ffffff"; 
  const rimLightColor = nightMode ? "#4080ff" : "#ffffff";
  
  return (
    <>
      {/* Ambient light - general scene illumination */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Main directional light - coming from behind the scene */}
      <directionalLight
        position={[0, 70, -100]}
        intensity={mainLightIntensity}
        castShadow={false} // Performance optimization as per Tesla-UI focus on smoothness
        color={mainLightColor}
      />
      
      {/* Rim light for silhouette definition - critical for high-contrast HUD look */}
      <spotLight
        position={[0, 50, 100]}
        intensity={fillLightIntensity * 2}
        angle={0.6}
        penumbra={1}
        color={rimLightColor}
      />
      
      {/* Point light from behind for backlighting effect */}
      <pointLight 
        position={[0, 40, -80]} 
        intensity={fillLightIntensity * 2.5} 
        distance={150}
        decay={2}
      />
      
      {/* Soft fill light from the front */}
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