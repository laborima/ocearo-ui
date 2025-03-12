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
      
      {/* Main directional light - coming straight from the top */}
      <directionalLight
        position={[0, 50, 0]}
        intensity={mainLightIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
        color={mainLightColor}
      />
      
      {/* Secondary fill light - also from top but slightly offset for subtle dimension */}
      <directionalLight
        position={[0, 40, 5]}
        intensity={fillLightIntensity}
        castShadow={false}
      />
      
      {/* Point light directly above the boat */}
      <pointLight 
        position={[0, 30, 0]} 
        intensity={fillLightIntensity * 1.5} 
        distance={60}
        decay={2}
      />
    </>
  );
};

export default BoatLighting;