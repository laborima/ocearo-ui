import { Canvas, useThree } from '@react-three/fiber';
import { getRenderProfile } from '../utils/RenderProfile';
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
const ModeHud = dynamic(() => import('./ModeHud'));
const AdvicePanel = dynamic(() => import('./AdvicePanel'));
const ParkingPanel = dynamic(() => import('./parkassist/ParkingPanel'));
const ReplayBar = dynamic(() => import('../replay/ReplayBar'));
const MeteoBar = dynamic(() => import('./meteo/MeteoBar'));
const GiveWayBanner = dynamic(() => import('./hud/GiveWayBanner'));
import { useReplay } from '../replay/ReplayBar';
import useMediaQuery from '../hooks/useMediaQuery';
// Full-screen HUD panels (translucent, Tesla-style)
const DepthPanel = dynamic(() => import('./hud/DepthPanel'));
const TidePanel = dynamic(() => import('./hud/TidePanel'));
const SkyClock = dynamic(() => import('./hud/SkyClock'));
const SceneLegend = dynamic(() => import('./hud/SceneLegend'));

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

// Caps the frame rate: the canvas runs on demand and this asks for a frame at
// a fixed pace. Interactions (orbit controls) still request frames themselves.
const FrameLimiter = ({ fps }) => {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const timer = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(timer);
  }, [fps, invalidate]);
  return null;
};

const ThreeDMainView = ({ active = true, fullscreen = false }) => {
    // Read once: changing it in settings takes effect on reload
    const [renderProfile] = useState(getRenderProfile);
    const limited = renderProfile.fps < 60;
    const { states, theme } = useOcearoContext(); // Access global context
    const replaying = useReplay().active;
    // The tapped vessel: null, { kind: 'own' } or { kind: 'ais', mmsi }
    const [selection, setSelection] = useState(null);
    const [showAttitudeIndicator, setShowAttitudeIndicator] = useState(true);
    // 'minimal' (FSD-like: speed + four values per mode) or 'classic' gauges
    const [hudStyle] = useState(() => configService.get('hudStyle') || 'minimal');
    const classic = hudStyle === 'classic';
    // Full screen on a tablet or a computer has room for the detailed panels;
    // split view and phones (either way round) keep the compact gauges
    const roomy = useMediaQuery('(min-width: 1024px) and (min-height: 600px)');
    const rich = fullscreen && !classic && roomy;
    // Phone on its side: the HUD values fill the left edge down to the bar
    const short = useMediaQuery('(max-height: 500px)');
    // Phones and the split view: the bottom panels stack in one column, so
    // they can never overlap one another
    const compact = !rich && !classic;
    const showAdvice = !states.anchorWatch && !states.parkingMode && !replaying;

    // Get configuration directly using the configService
    useEffect(() => {
        const config = configService.getAll();
        setShowAttitudeIndicator(config.showAttitudeIndicator !== false);
    }, []);

    // Chart/meteo scenes are light by day only (the dark and night themes draw a
    // dark chart): flip the HUD overlay text to the light-theme palette then
    const isLightScene = theme === 'day' && (states.oceanMode === 'chart' || states.oceanMode === 'depth' || states.oceanMode === 'meteo');

    return (
        <div className="w-full h-full relative overflow-hidden" data-scene={isLightScene ? 'light' : undefined}>

            <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between" data-hud-solid>
                <ThreeDBoatToolbar />
                {/* Phones: the toolbar takes the whole width */}
                <div className="hidden sm:flex items-center space-x-4 min-w-0 shrink-0">
                    {/* Split view: only the time, sun and UV need the full width */}
                    <SkyClock compact={!fullscreen} />
                    <ThreeDBoatThanksIndicator />
                </div>
            </div>

            <div className="absolute top-14 left-2 z-30" data-hud-solid>
                {!states.anchorWatch && <ThreeDBoatSpeedIndicator />}
                {states.anchorWatch && <ThreeDBoatPositionDateIndicator/> }
                {/* Depth lives in its gauge (split view) or its panel (full screen) */}
                {/* Split view: three values, so the depth gauge below stays clear */}
                {!classic && <ModeHud omitDepth maxItems={rich ? 4 : 3} />}
                {/* What the ribbons and colours of the scene mean */}
                {!states.parkingMode && <div className="mt-2"><SceneLegend /></div>}
            </div>

            {/* Attitude indicator - top right, below toolbar row */}
            {classic && showAttitudeIndicator && (
                <div className="absolute top-14 right-2 z-20">
                    <ThreeDBoatAttitudeIndicator />
                </div>
            )}

            {/* Tapped vessel: top right in full screen (classic: under the speed) */}
            {selection && !compact && (
                <div data-hud-solid className={`hud-stack absolute z-30 w-96 max-h-[calc(100%-5rem)] flex flex-col ${classic ? 'top-28 left-2' : 'top-14 right-3'}`}>
                    <InfoPanel content={selection} onClose={() => setSelection(null)} />
                </div>
            )}

            {rich && (
                <div className="absolute left-3 bottom-3 z-20" data-hud-solid>
                    <DepthPanel />
                </div>
            )}
            {rich && (
                <div className="absolute right-3 bottom-3 z-20" data-hud-solid>
                    <TidePanel />
                </div>
            )}

            {/* We must keep clear: unmistakable banner (the hull turns the same colour) */}
            {!replaying && (
                // Phones: on the right, the HUD values fill the left edge
                <div data-hud-solid className="absolute right-2 top-14 z-30 max-w-[calc(100%-10rem)] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[calc(100%-12rem)]">
                    <GiveWayBanner />
                </div>
            )}

            {/* Meteo: forecast hour and wind legend */}
            {states.oceanMode === 'meteo' && (
                <div className="absolute left-1/2 -translate-x-1/2 top-14 z-30 max-w-[calc(100%-12rem)]">
                    <MeteoBar />
                </div>
            )}

            {compact ? (
                // One column from the bottom: tapped vessel, replay / harbour /
                // advice, then the depth and tide cards side by side. On its
                // side the phone keeps it on the right, clear of the HUD values.
                <div data-hud-solid className={`hud-stack absolute bottom-2 z-30 flex flex-col gap-2 min-h-0 max-h-[calc(100%-4.5rem)] pointer-events-none [&>*]:pointer-events-auto
                    ${short ? 'right-2 w-[min(24rem,58%)]' : 'inset-x-2 sm:left-auto sm:w-[26rem]'}`}>
                    {selection && (
                        <div className="min-h-0 flex flex-col">
                            <InfoPanel content={selection} onClose={() => setSelection(null)} />
                        </div>
                    )}
                    {/* On its side the phone has room for the card alone: the
                        rest comes back when it is closed (the banner stays) */}
                    {!(short && selection) && (
                        <>
                            <div className="empty:hidden shrink-0 flex justify-center"><ReplayBar /></div>
                            {states.parkingMode && <div className="empty:hidden shrink-0 tesla-card !p-3 !rounded-2xl"><ParkingPanel /></div>}
                            {showAdvice && <div className="empty:hidden shrink-0 [&>*]:max-w-none"><AdvicePanel /></div>}
                            <div className="shrink-0 flex gap-2">
                                <div className="empty:hidden flex-1 min-w-0"><DepthPanel compact /></div>
                                <div className="empty:hidden flex-1 min-w-0"><TidePanel compact /></div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* Voyage replay controls */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-30 max-w-[calc(100%-1rem)]">
                        <ReplayBar />
                    </div>

                    {/* Harbour: berth type, guidance */}
                    {states.parkingMode && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-20 max-w-[calc(100%-9rem)]">
                            <ParkingPanel />
                        </div>
                    )}

                    {/* Course advice (avoidance / VMG) in the boat view */}
                    {showAdvice && (
                        <div data-hud-solid className={`hud-stack absolute left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-9rem)] ${classic ? 'bottom-24' : 'bottom-3'}`}>
                            <AdvicePanel />
                        </div>
                    )}
                </>
            )}

            {/* Classic HUD: the vertical depth and tide gauges */}
            {classic && (
                <div className="absolute left-2 bottom-2 z-20 flex flex-col items-center">
                    <ThreeDBoatSeaLevelIndicator />
                </div>
            )}
            {classic && (
                <div className="absolute right-2 bottom-2 z-20 flex flex-col items-center">
                    <ThreeDBoatTideLevelIndicator />
                </div>
            )}

            {/* Rudder Angle / Heel Indicator (bottom-center slider) */}
            {classic && !states.anchorWatch && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
                    <ThreeDBoatRudderIndicator />
                </div>
            )}

            {/* 3D Canvas — always visible; chart/meteo rendered as 3D planes inside the scene */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-full h-full">
                <Canvas
                style={{ width: '100%', height: '100%' }}
                shadows={false}
                frameloop={active ? (limited ? 'demand' : 'always') : 'never'}
                dpr={renderProfile.dpr}
                performance={{ min: 0.5 }}
                gl={{
                    antialias: renderProfile.antialias,
                    powerPreference: 'low-power',
                    physicallyCorrectLights: false,
                    toneMapping: THREE.NoToneMapping,
                    toneMappingExposure: 1,
                    shadowMap: { enabled: false },
                    precision: 'lowp'
                }}>
                    <RendererExposer />
                    {active && limited && <FrameLimiter fps={renderProfile.fps} />}
                    {states.parkingMode ? (
                        <ThreeDParkAssistBoat onUpdateInfoPanel={setSelection} />
                    ) : states.anchorWatch ? (
                        <ThreeDAnchoredBoat onUpdateInfoPanel={setSelection} />
                    ) : (
                        <ThreeDBoatView onUpdateInfoPanel={setSelection} selection={selection} />
                    )}
                </Canvas>
            </div>

        </div>
    );
};

export default ThreeDMainView;
