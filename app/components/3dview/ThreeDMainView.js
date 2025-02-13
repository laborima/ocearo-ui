import { Canvas } from '@react-three/fiber';

// Importing the new components
import ThreeDBoatView from './ThreeDBoatView';
import ThreeDBoatToolbar from './ThreeDBoatToolbar';
import ThreeDBoatSpeedIndicator from './ThreeDBoatSpeedIndicator';
import ThreeDBoatThanksIndicator from './ThreeDBoatThanksIndicator';
import ThreeDBoatRudderIndicator from './ThreeDBoatRudderIndicator';
import ThreeDBoatSeeLevelIndicator from './ThreeDBoatSeeLevelIndicator';
import ThreeDBoatTideLevelIndicator from './ThreeDBoatTideLevelIndicator';
import ThreeDParkAssistBoat from './parkassist/ThreeDParkAssistBoat';
import ThreeDAnchoredBoat from './anchored/ThreeDAnchoredBoat';
import { useOcearoContext } from '../context/OcearoContext';
import { useEffect } from 'react';
import * as THREE from 'three';
import ThreeDBoatPositionDateIndicator from './ThreeDBoatPositionDateIndicator';

const ThreeDMainView = ({ setFullScreen }) => {

    const { states } = useOcearoContext(); // Access global context, including nightMode

    useEffect(() => {
        setFullScreen(states.anchorWatch);
    }, [states.anchorWatch, setFullScreen]);



    return (
        <div className="w-full h-full relative ">

            <div className="absolute top-2 left-2 z-10 space-y-0">
                {/* Toolbar with buttons for Autopilot, Anchor Watch, MOB, and Night Mode */}
                <ThreeDBoatToolbar />

                {/* Speed Indicator (top-left) */}
                {!states.anchorWatch && <ThreeDBoatSpeedIndicator />}
                {states.anchorWatch && <ThreeDBoatPositionDateIndicator/> }
            </div>

           

            {/* Thanks & Batteries Indicator (top-right) */}
            <div className="absolute top-2  z-10  right-2" >
                <ThreeDBoatThanksIndicator />
            </div>

            {/* See Level Indicator (left-side) */}
            <div className="absolute left-2 bottom-2 z-20 flex flex-col items-center">
                <ThreeDBoatSeeLevelIndicator />
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
                <Canvas style={{ width: '100%', height: '100%' }} shadows dpr={[1, 2]} gl={{
                    antialias: true, physicallyCorrectLights: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1
                }}>
                    {states.parkingMode ? (
                        <ThreeDParkAssistBoat />
                    ) : states.anchorWatch ? (
                        <ThreeDAnchoredBoat />
                    ) : (
                        <ThreeDBoatView />
                    )}
                </Canvas>
            </div>


        </div>
    );
};

export default ThreeDMainView;
