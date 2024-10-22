import { Canvas } from '@react-three/fiber';

// Importing the new components
import ThreeDBoatView from './ThreeDBoatView';
import ThreeDBoatToolbar from './ThreeDBoatToolbar';
import ThreeDBoatSpeedIndicator from './ThreeDBoatSpeedIndicator';
import ThreeDBoatThanksIndicator from './ThreeDBoatThanksIndicator';
import ThreeDBoatRudderIndicator from './ThreeDBoatRudderIndicator';
import ThreeDBoatSeeLevelIndicator from './ThreeDBoatSeeLevelIndicator';
import { ThreeDViewProvider } from './context/ThreeDViewContext';

const ThreeDMainView = () => {
    return (
        <ThreeDViewProvider>
        <div className="w-full h-full relative bg-black">
        
        <div className="absolute top-2 left-2 z-10 space-y-2">
            {/* Toolbar with buttons for Autopilot, Anchor Watch, MOB, and Night Mode */}
            <ThreeDBoatToolbar />

            {/* Speed Indicator (top-left) */}
            <ThreeDBoatSpeedIndicator />
        </div>

            {/* Thanks & Batteries Indicator (top-right) */}
            <div className="absolute top-2  z-10  right-2" >
                <ThreeDBoatThanksIndicator />
            </div>

            {/* See Level Indicator (left-side) */}
            <div className="absolute left-2 bottom-10 z-20 flex flex-col items-center">
             <ThreeDBoatSeeLevelIndicator />
            </div>

            {/* Rudder Angle / Heel Indicator (bottom-center slider) */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
             <ThreeDBoatRudderIndicator />
            </div>

            {/* 3D Wind Component */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full h-full">
                <Canvas style={{ width: '100%', height: '100%' }}>
                    <ThreeDBoatView
                        compassHeading={45}
                        courseOverGroundAngle={90}
                        courseOverGroundEnable={true}
                        trueWindAngle={120}
                        trueWindSpeed={20}
                        appWindAngle={60}
                        appWindSpeed={15}
                        waypointAngle={270}
                        waypointEnable={true}
                    />
                </Canvas>
            </div>

         
        </div>
        </ThreeDViewProvider>
    );
};

export default ThreeDMainView;
