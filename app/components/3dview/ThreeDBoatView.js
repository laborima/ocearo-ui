import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';


import * as THREE from 'three';
import SvgWindComponent from './SvgWindComponent'; // Your SVG component
import SailBoat3D from './SailBoat3D';

const SvgWind3DView = ({
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
  trueWindMaxHistoric,       
  sailSetupEnable            
}) => {
  const svgPlaneRef = useRef();


/*  // Extract layers from the loaded Rhino model
   useEffect(() => {
     if (boatModel) {
       const rhino = rhino3dm(); // Initialize rhino3dm.js
       const layers = [];

       // Loop through all objects in the 3dm file and get their layers
       boatModel.objects().forEach(obj => {
         const layerIndex = obj.attributes().layerIndex;
         const layer = boatModel.getLayer(layerIndex); // Get layer details

         if (layer && !layers.some(l => l.name === layer.name)) {
           layers.push({
             name: layer.name,
             objects: boatModel.objects().filter(o => o.attributes().layerIndex === layerIndex),
           });
         }
       });

       setLayers(layers); // Save the layers to state
     }
   }, [boatModel]);
   

   { Render each layer's objects }
   {layers.map((layer, index) => (
     <group key={index} position={[0, -1, 0]}>
       {layer.objects.map((obj, i) => (
         <primitive key={i} object={obj.toThreejsObject()} scale={[0.1, 0.1, 0.1]} />
       ))}
     </group>
   ))}*/
  
  // Optional animation: Rotate the plane if needed
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    svgPlaneRef.current.rotation.z = elapsedTime * 0.1; // Rotate around z-axis slowly
  });

  return (
    <Suspense fallback={null}>
      {/* Orbit controls for zoom and rotation */}
      <OrbitControls enableZoom={true} enableRotate={true} />

      {/* Ambient light for better visibility */}
      <ambientLight intensity={0.5} />

      {/* Point light */}
      <pointLight position={[10, 10, 10]} />
      
     
       <SailBoat3D url="/boats/cad/boat_model.3dm" color="white" />

      {/* Plane to display the SVG */}
      <mesh ref={svgPlaneRef} position={[0, 0, 0]}>
        {/* Plane geometry */}
        <planeGeometry args={[10, 10]} /> {/* Adjust the size of the plane */}
        
        {/* Mesh material using Html helper to embed the SVG */}
        <meshBasicMaterial
             transparent={true} // Enable transparency
             opacity={0.1} // Set opacity (0 is fully transparent, 1 is fully opaque)
             color="white" // Optional: Set a base color if needed
        >
          <Html position={[0, 0, 0]} transform>
            <div style={{ width: '300px', height: '300px' }}>
              {/* SVG Component */}
              <SvgWindComponent
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
                sailSetupEnable={sailSetupEnable}            
              />
            </div>
          </Html>
        </meshBasicMaterial>
      </mesh>
    </Suspense>
  );
};

export default SvgWind3DView;
