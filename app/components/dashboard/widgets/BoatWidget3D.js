'use client';
import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useOcearoContext, toDegrees } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShip, faCompass, faWater } from '@fortawesome/free-solid-svg-icons';
import SailBoat3D from '../../3dview/SailBoat3D';
import ThreeDCompassView from '../../3dview/ThreeDCompassView';

const BoatLighting = () => (
  <>
    <ambientLight intensity={0.6} />
    <directionalLight
      position={[10, 10, 5]}
      intensity={1.0}
      castShadow
    />
    <pointLight position={[-10, -10, -5]} intensity={0.3} />
  </>
);

export default function BoatWidget3D() {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const [isLoading, setIsLoading] = useState(true);
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  // Get boat data for display with reduced precision for performance
  const boatData = useMemo(() => {
    const heading = Math.round(toDegrees(getSignalKValue('navigation.headingTrue')) || 0);
    const speed = Math.round((getSignalKValue('navigation.speedOverGround') || 0) * 10) / 10;
    const windSpeed = Math.round((getSignalKValue('environment.wind.speedApparent') || 0) * 10) / 10;
    const windAngle = Math.round(toDegrees(getSignalKValue('environment.wind.angleApparent')) || 0);
    const heel = Math.round(toDegrees(getSignalKValue('navigation.attitude.heel')) || 0);
    const pitch = Math.round(toDegrees(getSignalKValue('navigation.attitude.pitch')) || 0);
    
    return {
      heading,
      speed,
      windSpeed,
      windAngle,
      heel,
      pitch
    };
  }, [getSignalKValue]);
  
  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faShip} className={accentIconClass} />
          <span className={`${primaryTextClass} font-medium`}>3D Boat View</span>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <FontAwesomeIcon icon={faCompass} className="text-oYellow text-xs" />
            <span className={primaryTextClass}>{Math.round(boatData.heading)}°</span>
          </div>
          <div className="flex items-center space-x-1">
            <FontAwesomeIcon icon={faWater} className={`${accentIconClass} text-xs`} />
            <span className={primaryTextClass}>{(boatData.speed * 1.94384).toFixed(1)} kts</span>
          </div>
        </div>
      </div>
      
      {/* 3D Canvas */}
      <div className="flex-1 relative rounded-lg overflow-hidden ">
        <Canvas
          camera={{ position: [2, 2, 1], fov: 50}}
          className="w-full h-full"
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          frameloop="demand"
          onCreated={() => setIsLoading(false)}
        >
          <Suspense fallback={null}>
            <Environment
              files="./assets/ocearo_env.hdr"
              background={false}
              intensity={0.6}
              resolution={128}
            />
            
            {/* Simplified lighting for performance */}
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={0.6} />
            
            
            <group rotation={[0, -0.5, 0.7]} position={[0, -1, 0]} scale={[0.25, 0.25, 0.25]}>
              <SailBoat3D 
                position={[0, 0, 0.7]} 
                scale={[0.7, 0.7, 0.7]} 
                showSail={true}
                heel={boatData.heel}
                pitch={boatData.pitch}
              />
              
              <ThreeDCompassView 
                visible={true} 
                position={[3, 1, -1]}
                scale={[0.3, 0.3, 0.3]}
              />
            </group>
          </Suspense>
        </Canvas>
        
        {/* Overlay data */}
        <div className={`absolute top-2 left-2 bg-black bg-opacity-50 rounded p-2 text-xs ${primaryTextClass}`}>
          <div>Heel: {Math.round(boatData.heel)}°</div>
          <div>Pitch: {Math.round(boatData.pitch)}°</div>
        </div>
        
        <div className={`absolute top-2 right-2 bg-black bg-opacity-50 rounded p-2 text-xs ${primaryTextClass}`}>
          <div>Wind: {Math.round(boatData.windSpeed * 1.94384)} kts</div>
          <div>Angle: {Math.round(boatData.windAngle)}°</div>
        </div>
        
        {/* Loading fallback */}
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-oGray2 bg-opacity-90 ${primaryTextClass} text-sm`}>
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faShip} className={`animate-pulse ${accentIconClass}`} />
              <span>Loading 3D View...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom info bar */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <div className="flex items-center space-x-4">
          <div className={secondaryTextClass}>
            <span className={`${primaryTextClass} font-medium`}>{Math.round(boatData.heading)}°</span> HDG
          </div>
          <div className={secondaryTextClass}>
            <span className={`${primaryTextClass} font-medium`}>{(boatData.speed * 1.94384).toFixed(1)}</span> kts
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 ${secondaryTextClass}`}>
          <FontAwesomeIcon icon={faShip} className={accentIconClass} />
          <span className="text-xs">Real-time 3D</span>
        </div>
      </div>
    </div>
  );
}
