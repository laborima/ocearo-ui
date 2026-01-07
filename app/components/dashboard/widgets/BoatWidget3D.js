'use client';
import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { toDegrees, MS_TO_KNOTS } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShip, faCompass, faWater } from '@fortawesome/free-solid-svg-icons';
import SailBoat3D from '../../3dview/SailBoat3D';
import ThreeDCompassView from '../../3dview/ThreeDCompassView';

export default function BoatWidget3D() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Use specialized hooks for better performance and targeted subscriptions
  const headingTrue = useSignalKPath('navigation.headingTrue');
  const sog = useSignalKPath('navigation.speedOverGround');
  const windSpeedApparent = useSignalKPath('environment.wind.speedApparent');
  const windAngleApparent = useSignalKPath('environment.wind.angleApparent');
  const heelRad = useSignalKPath('navigation.attitude.heel');
  const pitchRad = useSignalKPath('navigation.attitude.pitch');

  // Process data with reduced precision for performance
  const boatData = useMemo(() => {
    return {
      heading: Math.round(toDegrees(headingTrue) || 0),
      speed: sog !== null ? sog : 0,
      windSpeed: windSpeedApparent !== null ? windSpeedApparent : 0,
      windAngle: Math.round(toDegrees(windAngleApparent) || 0),
      heel: Math.round(toDegrees(heelRad) || 0),
      pitch: Math.round(toDegrees(pitchRad) || 0)
    };
  }, [headingTrue, sog, windSpeedApparent, windAngleApparent, heelRad, pitchRad]);
  
  return (
    <BaseWidget
      title="3D Boat View"
      icon={faShip}
      hasData={true}
    >
      {/* Quick stats overlay in header area */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4 text-xs font-bold uppercase">
        <div className="flex items-center space-x-1">
          <FontAwesomeIcon icon={faCompass} className="text-oYellow text-[10px]" />
          <span className="text-white font-mono">{Math.round(boatData.heading)}°</span>
        </div>
        <div className="flex items-center space-x-1 border-l border-gray-700 pl-4">
          <FontAwesomeIcon icon={faWater} className="text-oBlue text-[10px]" />
          <span className="text-white font-mono">{(boatData.speed * MS_TO_KNOTS).toFixed(1)} kts</span>
        </div>
      </div>
      
      {/* 3D Canvas */}
      <div className="flex-1 relative rounded-lg overflow-hidden bg-black/20 border border-gray-800 shadow-inner">
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
        
        {/* Overlay data details */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase text-white tracking-tighter">
            <span className="text-oRed mr-1">Heel:</span> {Math.round(boatData.heel)}°
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase text-white tracking-tighter">
            <span className="text-oBlue mr-1">Pitch:</span> {Math.round(boatData.pitch)}°
          </div>
        </div>
        
        <div className="absolute top-2 right-2 flex flex-col space-y-1 items-end">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase text-white tracking-tighter">
            <span className="text-oYellow mr-1">Wind:</span> {Math.round(boatData.windSpeed * MS_TO_KNOTS)} kts
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase text-white tracking-tighter">
            <span className="text-gray-400 mr-1">Angle:</span> {Math.round(boatData.windAngle)}°
          </div>
        </div>
        
        {/* Loading fallback */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-oGray2/90 text-white text-sm">
            <div className="flex flex-col items-center space-y-3">
              <FontAwesomeIcon icon={faShip} className="text-3xl text-oBlue animate-pulse" />
              <span className="font-black uppercase tracking-widest text-[10px]">Initializing 3D Core...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom info bar */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-4">
          <div className="text-gray-500 text-[10px] font-black uppercase">
            <span className="text-white text-sm font-mono mr-1">{Math.round(boatData.heading)}°</span> HDG
          </div>
          <div className="text-gray-500 text-[10px] font-black uppercase border-l border-gray-800 pl-4">
            <span className="text-white text-sm font-mono mr-1">{(boatData.speed * MS_TO_KNOTS).toFixed(1)}</span> KTS
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-oBlue/10 border border-oBlue/20 rounded px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-oBlue animate-pulse"></div>
          <span className="text-[9px] font-black uppercase text-oBlue tracking-widest">Live Engine</span>
        </div>
      </div>
    </BaseWidget>
  );
}
