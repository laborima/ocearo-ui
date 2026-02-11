'use client';
import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { toDegrees, MS_TO_KNOTS, oBlue, oYellow, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShip, faCompass, faWater } from '@fortawesome/free-solid-svg-icons';
import SailBoat3D from '../../3dview/SailBoat3D';
import ThreeDCompassView from '../../3dview/ThreeDCompassView';

export default function BoatWidget3D() {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
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
      title={t('widgets.boatView3D')}
      icon={faShip}
      hasData={true}
    >
      {/* Quick stats overlay in header area */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faCompass} className={`${nightMode ? 'text-oNight' : 'text-oYellow'} text-xs opacity-50`} />
          <span className="text-hud-main text-xs font-black uppercase tracking-widest gliding-value">{Math.round(boatData.heading)}°</span>
        </div>
        <div className="flex items-center space-x-2 border-l border-hud pl-4">
          <FontAwesomeIcon icon={faWater} className={`${nightMode ? 'text-oNight' : 'text-oBlue'} text-xs opacity-50`} />
          <span className="text-hud-main text-xs font-black uppercase tracking-widest gliding-value">{(boatData.speed * MS_TO_KNOTS).toFixed(1)} kts</span>
        </div>
      </div>
      
      {/* 3D Canvas */}
      <div className="flex-1 relative rounded-sm overflow-hidden bg-hud-bg shadow-inner mt-2">
        <Canvas
          camera={{ position: [3, 2, 3], fov: 45 }}
          className="w-full h-full"
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          onCreated={() => setIsLoading(false)}
        >
          <Suspense fallback={null}>
            <OrbitControls 
              enablePan={false}
              minDistance={2}
              maxDistance={8}
              maxPolarAngle={Math.PI / 2}
              target={[0, 0, 0]}
            />
            <Environment
              files="./assets/ocearo_env.hdr"
              background={false}
              intensity={0.6}
              resolution={128}
            />
            
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={0.6} />
            
            <group position={[0, -0.5, 0]} scale={[0.3, 0.3, 0.3]}>
              <SailBoat3D 
                position={[0, 0, 0]} 
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
        <div className="absolute top-2 left-2 flex flex-col space-y-1.5">
          <div className="bg-hud-bg backdrop-blur-md border border-hud rounded-sm px-2 py-1 text-xs font-black uppercase text-hud-main tracking-widest shadow-soft">
            <span className={`${nightMode ? 'text-oNight' : 'text-oRed'} mr-2 opacity-60`}>HEEL:</span>
            <span className="gliding-value">{Math.round(boatData.heel)}°</span>
          </div>
          <div className="bg-hud-bg backdrop-blur-md border border-hud rounded-sm px-2 py-1 text-xs font-black uppercase text-hud-main tracking-widest shadow-soft">
            <span className={`${nightMode ? 'text-oNight' : 'text-oBlue'} mr-2 opacity-60`}>PITCH:</span>
            <span className="gliding-value">{Math.round(boatData.pitch)}°</span>
          </div>
        </div>
        
        <div className="absolute top-2 right-2 flex flex-col space-y-1.5 items-end">
          <div className="bg-hud-bg backdrop-blur-md border border-hud rounded-sm px-2 py-1 text-xs font-black uppercase text-hud-main tracking-widest shadow-soft">
            <span className={`${nightMode ? 'text-oNight' : 'text-oYellow'} mr-2 opacity-60`}>WIND:</span>
            <span className="gliding-value">{Math.round(boatData.windSpeed * MS_TO_KNOTS)} kts</span>
          </div>
          <div className="bg-hud-bg backdrop-blur-md border border-hud rounded-sm px-2 py-1 text-xs font-black uppercase text-hud-main tracking-widest shadow-soft">
            <span className="text-hud-muted mr-2 opacity-60">ANGLE:</span>
            <span className="gliding-value">{Math.round(boatData.windAngle)}°</span>
          </div>
        </div>
        
        {/* Loading fallback */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-hud-bg text-hud-main backdrop-blur-xl">
            <div className="flex flex-col items-center space-y-4">
              <FontAwesomeIcon icon={faShip} className="text-3xl text-oBlue animate-soft-pulse" />
              <span className="font-black uppercase tracking-[0.4em] text-xs text-hud-muted">{t('widgets.initializingNode')}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom info bar */}
      <div className="flex justify-between items-center mt-2 shrink-0">
        <div className="flex items-center space-x-3 text-xs font-black uppercase tracking-widest">
          <span className="text-hud-main gliding-value">{Math.round(boatData.heading)}° <span className="text-hud-secondary">HDG</span></span>
          <span className="text-hud-main gliding-value">{(boatData.speed * MS_TO_KNOTS).toFixed(1)} <span className="text-hud-secondary">KTS</span></span>
        </div>
        <div className={`flex items-center space-x-1 ${nightMode ? 'text-oNight' : 'text-oBlue'}`}>
          <div className={`w-1 h-1 rounded-full ${nightMode ? 'bg-oNight' : 'bg-oBlue'} animate-soft-pulse`}></div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">{t('widgets.telemetryLive')}</span>
        </div>
      </div>
    </BaseWidget>
  );
}
