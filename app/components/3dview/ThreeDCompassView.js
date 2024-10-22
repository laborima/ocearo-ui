import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Test from './compass/Test'; // Your SVG component

const ThreeDCompassView = ({
  compassHeading,
  courseOverGroundAngle,
  courseOverGroundEnable,
  trueWindAngle,
  trueWindSpeed,
  appWindAngle,
  appWindSpeed,
  waypointAngle,
  waypointEnable,
  laylineAngle,              
  closeHauledLineEnable,     
  windSectorEnable,          
  trueWindMinHistoric,       
  trueWindMidHistoric,       
  trueWindMaxHistoric       
}) => {
 /* const svgPlaneRef = useRef();

  // Optional animation: Rotate the plane if needed
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    svgPlaneRef.current.rotation.y = elapsedTime * 0.1; // Rotate around y-axis slowly
  });*/

  
  const svgLoaderRef = useRef();

  const handleChangeColor = () => {
    if (svgLoaderRef.current) {
      svgLoaderRef.current.changeColor('red'); // Change color to red
    }
  };

  const handleChangeScale = () => {
    if (svgLoaderRef.current) {
      svgLoaderRef.current.changeScale(2); // Scale up
    }
  };
  return (
    <mesh  position={[0, 0, 0]}>
  
      {/* Mesh material using Html helper to embed the SVG */}

      <Html position={[0, 0, 0]} rotation-x={-Math.PI / 2} transform>
        <div style={{ width: '300px', height: '300px' }}>
          {/* SVG Component */
        /*  <SvgWindComponent
            compassHeading={compassHeading}
            courseOverGroundAngle={courseOverGroundAngle}
            courseOverGroundEnable={courseOverGroundEnable}
            trueWindAngle={trueWindAngle}
            trueWindSpeed={trueWindSpeed}
            appWindAngle={appWindAngle}
            appWindSpeed={appWindSpeed}
            waypointAngle={waypointAngle}
            waypointEnable={waypointEnable}
            laylineAngle={laylineAngle}              
            closeHauledLineEnable={closeHauledLineEnable}  
            windSectorEnable={windSectorEnable}          
            trueWindMinHistoric={trueWindMinHistoric}    
            trueWindMidHistoric={trueWindMidHistoric}    
            trueWindMaxHistoric={trueWindMaxHistoric}    
          />*/}
          
          <Test  url="./assets/compass.svg" ref={svgLoaderRef} scale={1} color="blue" />
        </div>
      </Html>
    </mesh>
  );
};

export default ThreeDCompassView;
