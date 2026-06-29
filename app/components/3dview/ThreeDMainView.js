import { Canvas, useThree } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import { useOcearoContext } from '../context/OcearoContext';
import * as THREE from 'three';
import { useEffect, useState } from 'react';
import configService from '../settings/ConfigService';

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
const ThreeDBoatAttitudeIndicator = dynamic(() => import('./ThreeDBoatAttitudeIndicator'));
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

// Drives the render loop manually at a capped frame rate to save GPU/power on
// low-end devices (RPi5). The Canvas runs with frameloop="never" and this
// component calls advance() at most `fps` times per second (only while active).
const AdaptiveFrameLoop = ({ active, fps }) => {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    if (!active) return undefined;

    const minDelta = 1000 / fps;
    let rafId;
    let last = performance.now();

    const loop = (now) => {
      rafId = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed >= minDelta) {
        // Keep the cadence steady without drifting past the target interval
        last = now - (elapsed % minDelta);
        advance(now);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [active, fps, advance]);

  return null;
};

const ThreeDMainView = ({ active = true }) => {
    const { states, nightMode } = useOcearoContext(); // Access global context
    const [infoPanelContent, setInfoPanelContent] = useState(null);
    const [showAttitudeIndicator, setShowAttitudeIndicator] = useState(true);
    const [maxFps, setMaxFps] = useState(30);
    const [clock, setClock] = useState(() => new Date());

    // Tick the header clock every 30s (it would otherwise only refresh on unrelated re-renders)
    useEffect(() => {
        const id = setInterval(() => setClock(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    // Get configuration directly using the configService
    useEffect(() => {
        const config = configService.getAll();
        setShowAttitudeIndicator(config.showAttitudeIndicator !== false);
        const fps = Number(config.maxFps);
        setMaxFps(Number.isFinite(fps) && fps > 0 ? fps : 30);
    }, []);

    return (
        <div className="w-full h-full relative ">

            <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between">
                <ThreeDBoatToolbar />
                <div className="flex items-center space-x-4">
                    <span className={`text-lg font-black uppercase tracking-[0.2em] ${nightMode ? 'text-oNight' : 'text-hud-muted'}`}>
                        {clock.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <ThreeDBoatThanksIndicator />
                </div>
            </div>

            <div className="absolute top-14 left-2 z-10">
                {!states.anchorWatch && <ThreeDBoatSpeedIndicator />}
                {states.anchorWatch && <ThreeDBoatPositionDateIndicator/> }
            </div>

            {/* Attitude indicator - top right, below toolbar row */}
            {showAttitudeIndicator && (
                <div className="absolute top-14 right-2 z-20">
                    <ThreeDBoatAttitudeIndicator />
                </div>
            )}

            {/* Floating vessel info panel - top left, below speed indicator */}
            {infoPanelContent && (
                <div className="absolute top-28 left-2 z-30">
                    <InfoPanel content={infoPanelContent} onClose={() => setInfoPanelContent(null)} />
                </div>
            )}

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

            {/* 3D Canvas — always visible; chart/meteo rendered as 3D planes inside the scene */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-full h-full">
                <Canvas
                style={{ width: '100%', height: '100%' }}
                shadows={false}
                frameloop="never"
                dpr={Math.min(window.devicePixelRatio, 1.5)}
                performance={{ min: 0.5 }}
                gl={{
                    antialias: true,
                    powerPreference: 'low-power',
                    physicallyCorrectLights: false,
                    toneMapping: THREE.NoToneMapping,
                    toneMappingExposure: 1,
                    shadowMap: { enabled: false },
                    precision: 'lowp'
                }}>
                    <RendererExposer />
                    <AdaptiveFrameLoop active={active} fps={maxFps} />
                    {states.parkingMode ? (
                        <ThreeDParkAssistBoat onUpdateInfoPanel={setInfoPanelContent} />
                    ) : states.anchorWatch ? (
                        <ThreeDAnchoredBoat onUpdateInfoPanel={setInfoPanelContent} />
                    ) : (
                        <ThreeDBoatView onUpdateInfoPanel={setInfoPanelContent} />
                    )}
                </Canvas>
            </div>

        </div>
    );
};

export default ThreeDMainView;
