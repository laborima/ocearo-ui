import { Canvas, useThree } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import { useOcearoContext } from '../context/OcearoContext';
import * as THREE from 'three';
import { useEffect, useState } from 'react';

// Basic UI components loaded synchronously
import ThreeDBoatToolbar from './ThreeDBoatToolbar';
import ThreeDBoatThanksIndicator from './ThreeDBoatThanksIndicator';

// Heavy 3D components loaded dynamically
const ThreeDBoatView = dynamic(() => import('./ThreeDBoatView'), { ssr: false });
const ThreeDParkAssistBoat = dynamic(() => import('./parkassist/ThreeDParkAssistBoat'), { ssr: false });
const ThreeDAnchoredBoat = dynamic(() => import('./anchored/ThreeDAnchoredBoat'), { ssr: false });

// Secondary UI components loaded dynamically
const ThreeDBoatSpeedIndicator = dynamic(() => import('./ThreeDBoatSpeedIndicator'));
const ThreeDBoatRudderIndicator = dynamic(() => import('./ThreeDBoatRudderIndicator'));
const ThreeDBoatTideLevelIndicator = dynamic(() => import('./ThreeDBoatTideLevelIndicator'));
const ThreeDBoatPositionDateIndicator = dynamic(() => import('./ThreeDBoatPositionDateIndicator'));
const ThreeDBoatSeaLevelIndicator = dynamic(() => import('./ThreeDBoatSeaLevelIndicator'));
const InfoPanel = dynamic(() => import('./InfoPanel'));

// Component to expose Three.js renderer and info for performance monitoring
const RendererExposer = () => {
  const { gl, scene } = useThree();
  
  useEffect(() => {
    // Expose the renderer to the window for performance monitoring
    if (window && gl) {
      window.__OCEARO_RENDERER = gl;
      
      // Setup info tracking interval
      const trackInfoInterval = setInterval(() => {
        if (gl && gl.info) {
          window.__OCEARO_RENDER_INFO = gl.info;
        }
      }, 1000);
      
      return () => {
        // Cleanup
        delete window.__OCEARO_RENDERER;
        delete window.__OCEARO_RENDER_INFO;
        clearInterval(trackInfoInterval);
      };
    }
  }, [gl, scene]);
  
  return null;
};

const ThreeDMainView = () => {
    const { states } = useOcearoContext(); // Access global context, including nightMode
    const [infoPanelContent, setInfoPanelContent] = useState(null);

    return (
        <div className="w-full h-full relative ">

            <div className="absolute top-2 left-2 z-10 space-y-0">
                {/* Toolbar with buttons for Autopilot, Anchor Watch, MOB, and Night Mode */}
                <ThreeDBoatToolbar />

                {/* Speed Indicator (top-left) */}
                {!states.anchorWatch && <ThreeDBoatSpeedIndicator />}
                {states.anchorWatch && <ThreeDBoatPositionDateIndicator/> }
            </div>

           

            {/* InfoPanel positioned above Thanks indicators */}
            <div className="absolute top-2 right-2 z-20 flex flex-col items-end">
                <div className="mb-2">
                    <InfoPanel content={infoPanelContent} />
                </div>
                <ThreeDBoatThanksIndicator />
            </div>

            {/* See Level Indicator (left-side) */}
            <div className="absolute left-2 bottom-2 z-20 flex flex-col items-center">
                <ThreeDBoatSeaLevelIndicator />
            </div>
            <div className="absolute right-2 bottom-2 z-20 flex flex-col items-center">
                <ThreeDBoatTideLevelIndicator />
            </div>


            {/* Rudder Angle / Heel Indicator (bottom-center slider) */}
            {!states.anchorWatch && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
                    <ThreeDBoatRudderIndicator />
                </div>
            )}

            {/* 3D Wind Component */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-full h-full">
                <Canvas style={{ width: '100%', height: '100%' }} shadows={false} dpr={[1, 1]} gl={{
                    antialias: true,
                    physicallyCorrectLights: false,
                    toneMapping: THREE.LinearToneMapping,
                    toneMappingExposure: 1
                }}>
                    <RendererExposer />
                    {states.parkingMode ? (
                        <ThreeDParkAssistBoat onUpdateInfoPanel={setInfoPanelContent} />
                    ) : states.anchorWatch ? (
                        <ThreeDAnchoredBoat onUpdateInfoPanel={setInfoPanelContent} />
                    ) : (
                        <ThreeDBoatView onUpdateInfoPanel={setInfoPanelContent} />
                    )}
                </Canvas>
            </div>
            {/* InfoPanel moved above Thanks indicators */}

        </div>
    );
};

export default ThreeDMainView;
