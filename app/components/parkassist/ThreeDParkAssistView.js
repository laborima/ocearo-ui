import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';

import ThreeDBoatSpeedIndicator from '../3dview/ThreeDBoatSpeedIndicator';
import ThreeDBoatToolbar from '../3dview/ThreeDBoatToolbar';
import ThreeDBoatRudderIndicator from '../3dview/ThreeDBoatRudderIndicator';
import ThreeDBoatSeeLevelIndicator from '../3dview/ThreeDBoatSeeLevelIndicator';
import { ThreeDViewProvider } from '../3dview/context/ThreeDViewContext';
import ThreeDParkAssistBoat from './ThreeDParkAssistBoat';

const ThreeDParkAssistView = () => {

    return (
        <ThreeDViewProvider>
            <div className="w-full h-full relative bg-black">
                <div className="absolute top-2 left-2 z-10 space-y-2">
                    <ThreeDBoatToolbar />
                    <ThreeDBoatSpeedIndicator />
                </div>

                <div className="absolute left-2 bottom-10 z-20 flex flex-col items-center">
                    <ThreeDBoatSeeLevelIndicator />
                </div>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
                    <ThreeDBoatRudderIndicator />
                </div>

                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full h-full">
                    <Canvas style={{ width: '100%', height: '100%' }} resize={{ scroll: true }}>
                      <ThreeDParkAssistBoat/>
                    </Canvas>
                </div>
            </div>
        </ThreeDViewProvider>
    );
};

export default ThreeDParkAssistView;
