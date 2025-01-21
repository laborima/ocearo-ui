import React, { useRef, useEffect, forwardRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOcearoContext } from '../context/OcearoContext';
import configService from '../settings/ConfigService'; // Import ConfigService for configuration
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Sail3D from './sail/Sail3D';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';
const modelPath = `${ASSET_PREFIX}/boats/default/assets/scene-transformed.glb`;

const SailBoat3D = forwardRef(({ showSail = false, ...props }, ref) => {
    const boatRef = useRef(); // Ref to access and control the boat object
    const rudderRef = useRef(); // Ref for the rudder geometry
    const { getSignalKValue} = useOcearoContext(); // Use the context to get SignalK values
   

    const { nodes, materials } = useGLTF(modelPath, `${ASSET_PREFIX}/draco/`);


    // Load configuration settings
    const config = configService.getAll();
    const primaryColor = config.primaryColor; // Default to white if not set
    const metallicEffect = config.metallicEffect || false; // Default to non-metallic

    // Get inclination from SignalK (use 'heel' data as an example)
    const inclination = getSignalKValue('navigation.attitude.roll') || 0; // Get inclination (heel angle) from SignalK, fallback to 0 if unavailable
    const rudderAngleRadians = getSignalKValue('steering.rudderAngle') || 0; // Example: -0.5585 radians
    const rudderAngle = (rudderAngleRadians * 180) / Math.PI; // Convert to degrees


    useEffect(() => {
        // Apply the color and metallic effect to the hull (fiberglass2 material)
        if (primaryColor && materials && materials.fiberglass) {
            materials.fiberglass.color.set(primaryColor); // Set the material color
            materials.fiberglass.metalness = metallicEffect ? 1.0 : 0.0; // Apply metallic effect
            materials.fiberglass.roughness = metallicEffect ? 0.2 : 1.0; // Adjust roughness for metallic look
        }
        
        // Reduce texture resolution for low GPU devices
               Object.values(materials).forEach((material) => {
                   if (material.map) {
                       material.map.minFilter = THREE.LinearFilter;
                       material.map.magFilter = THREE.LinearFilter;
                       material.map.anisotropy = 1; // Reduce anisotropy for better performance
                   }
               });
               
    }, [primaryColor, metallicEffect, materials]);



    // Update boat inclination or position
    useFrame(() => {
        if (boatRef.current && boatRef.current.rotation.z !== inclination) {
            boatRef.current.rotation.z = inclination; // Apply the inclination to the boat's Z rotation
        }

        if (rudderRef.current) {
            // Reset rotation to ensure no cumulative effects
               rudderRef.current.rotation.set(-Math.PI / 2, Math.PI / 2, 0);

               // Define the axis for rotation (e.g., x-axis for rudder rotation)
               const luffAxis = new THREE.Vector3(1, 0, 0);

               // Apply the new rotation based on the updated rudder angle
               rudderRef.current.rotateOnAxis(
                   luffAxis,
                   -THREE.MathUtils.degToRad(rudderAngle)
               );
        }

    });

    return (
        <group {...props} ref={boatRef} dispose={null}>
                 {showSail && <Sail3D />} 
                 <mesh geometry={nodes.baba_metal_0.geometry} material={materials.metal} position={[0.24, 0.895, -5.546]} rotation={[-Math.PI / 2, 0, 1.968]} scale={0.027} />
                 <mesh geometry={nodes.camadadirek_fiberglass_0.geometry} material={materials.fiberglass} position={[0, 5.267, -3.711]} rotation={[2.054, 0, Math.PI]} scale={[-0.042, 0.042, 4.707]} />
                 <mesh geometry={nodes.camadanyelkeni_bez_0.geometry} material={materials.mcaterial} position={[0, 5.267, -3.711]} rotation={[2.054, 0, Math.PI]} scale={[-0.042, 0.042, 4.707]} />
                 <mesh geometry={nodes.camadaonbaglay_metal_0.geometry} material={materials.metal} position={[0, 0.891, -5.958]} rotation={[-Math.PI / 2, 0, 0]} scale={0.02} />
                 <mesh geometry={nodes.capa_metal_0.geometry} material={materials.metal} position={[0, 0.671, -6.173]} rotation={[-Math.PI / 2, 0, 0]} scale={0.348} />
                 <mesh geometry={nodes.direk_fiberglass_0.geometry} material={materials.fiberglass} position={[0, 4.315, -1.056]} rotation={[Math.PI / 2, 0, Math.PI]} scale={[-0.113, 0.113, 5.203]} />
                 <mesh geometry={nodes.duman_ahsap_0.geometry} material={materials.ahsap} position={[-0.011, 0.854, 3.487]} rotation={[Math.PI, 0, Math.PI / 2]} scale={[0.045, 0.045, 0.011]} />
                 <mesh geometry={nodes.dumenyuvasi_ahsap_0.geometry} material={materials.ahsap} position={[-0.011, 0.299, 3.441]} rotation={[-Math.PI / 2, 0, 1.571]} scale={0.094} />
                 <mesh geometry={nodes.dumenyuvasi_cam_0.geometry} material={materials.material_5} position={[-0.011, 0.299, 3.441]} rotation={[-Math.PI / 2, 0, 1.571]} scale={0.094} />
                 <mesh geometry={nodes.dumenyuvasi_fiberglass_0.geometry} material={materials.fiberglass} position={[-0.011, 0.299, 3.441]} rotation={[-Math.PI / 2, 0, 1.571]} scale={0.094} />
                 <mesh geometry={nodes.govde_fiberglass2_0.geometry} material={materials.fiberglass2} position={[0, 0.32, -0.897]} rotation={[0, Math.PI / 2, 0]} scale={[5.11, 0.454, 1.212]} />
                 <mesh geometry={nodes.govde_fiberglass_0.geometry} material={materials.fiberglass} position={[0, 0.32, -0.897]} rotation={[0, Math.PI / 2, 0]} scale={[5.11, 0.454, 1.212]} />
                 <mesh geometry={nodes.govde_metal_0.geometry} material={materials.metal} position={[0, 0.32, -0.897]} rotation={[0, Math.PI / 2, 0]} scale={[5.11, 0.454, 1.212]} />
                 <mesh geometry={nodes.halattutucu_fiberglass2_0.geometry} material={materials.fiberglass2} position={[-1.044, 0.939, 1.809]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.016, 0.059, 0.016]} />
                 <mesh geometry={nodes.ip001_metal_0.geometry} material={materials.metal} position={[-0.231, 7.608, -0.621]} rotation={[-2.322, 0.222, -1.556]} scale={[0.007, 0.007, 0.011]} />
                 <mesh geometry={nodes.pervan_fiberglass_0.geometry} material={materials.fiberglass} position={[0, -1.005, 1.561]} rotation={[-Math.PI / 2, Math.PI / 2, 0]} scale={[0.154, 0.094, 0.104]} />
                 <mesh geometry={nodes.pervane_metal_0.geometry} material={materials.metal} position={[0, -1.122, 1.75]} scale={0.034} />
                 <mesh  ref={rudderRef} geometry={nodes.rudder_fiberglass_0.geometry} material={materials.fiberglass} position={[0, -1.153, 3.486]} rotation={[-Math.PI / 2, Math.PI / 2, 0]} scale={[0.573, 0.262, 0.262]} />
                 <mesh geometry={nodes.salma_fiberglass_0.geometry} material={materials.fiberglass} position={[0, -1.953, -0.739]} scale={[0.149, 0.108, 0.756]} />
                 <mesh geometry={nodes.ustcam_cam_0.geometry} material={materials.material_5} position={[-0.337, 0.974, -3.127]} rotation={[-Math.PI / 2, 0, 0]} scale={[-0.183, 0.133, 0.025]} />
                 <mesh geometry={nodes.ustcam_fiberglass_0.geometry} material={materials.fiberglass} position={[-0.337, 0.974, -3.127]} rotation={[-Math.PI / 2, 0, 0]} scale={[-0.183, 0.133, 0.025]} />
                 <mesh geometry={nodes.ustgovde_fiberglass_0.geometry} material={materials.fiberglass} position={[0, 0.832, -2.741]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.566, 0.7, 1.212]} />
                 <mesh geometry={nodes.ustgovdekzak_ahsap_0.geometry} material={materials.ahsap} position={[0, 0.862, -2.741]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.566, 0.7, 1.212]} />
                 <mesh geometry={nodes.vinc_metal_0.geometry} material={materials.metal} position={[-1.07, 0.977, 2.02]} rotation={[-Math.PI / 2, 0, 0]} scale={0.065} />
                 <mesh geometry={nodes.yancam002_cam_0.geometry} material={materials.material_5} position={[-0.984, 0.591, -3.772]} rotation={[Math.PI, -1.241, -Math.PI / 2]} scale={[0.095, 0.28, 0.014]} />
                 <mesh geometry={nodes.yancam002_fiberglass_0.geometry} material={materials.fiberglass} position={[-0.984, 0.591, -3.772]} rotation={[Math.PI, -1.241, -Math.PI / 2]} scale={[0.095, 0.28, 0.014]} />
                 <mesh geometry={nodes.yankoruma_metal_0.geometry} material={materials.metal} position={[-1.641, 0.946, 2.868]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.01, 0.01, 0.159]} />
                 <mesh geometry={nodes.yankoruma_metal_0001.geometry} material={materials.metal} position={[-1.641, 0.946, 2.868]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.01, 0.01, 0.159]} />
                 <mesh geometry={nodes.yankoruma_metal_0002.geometry} material={materials.metal} position={[-1.641, 0.946, 2.868]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.01, 0.01, 0.159]} />
                 <mesh geometry={nodes.zincir_metal_0.geometry} material={materials.metal} position={[-0.001, 0.88, -6.258]} rotation={[-1.56, -0.031, -0.149]} scale={0.004} />
                 <mesh geometry={nodes.zincir_metal_0001.geometry} material={materials.metal} position={[-0.001, 0.88, -6.258]} rotation={[-1.56, -0.031, -0.149]} scale={0.004} />
                 <mesh geometry={nodes.zincirdeposu_fiberglass2_0.geometry} material={materials.fiberglass2} position={[0, 0.863, -5.779]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.103, 0.088, 0.009]} />
                 <mesh geometry={nodes.zincirmakara_metal_0.geometry} material={materials.metal} position={[0, 0.869, -6.305]} rotation={[-2.159, 1.564, 0.59]} scale={[0.01, 0.01, 0.016]} />
                 <mesh geometry={nodes.zincirray_ahsap_0.geometry} material={materials.ahsap} position={[0, 0.864, -6.113]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.017, 0.181, 0.003]} />
        
        </group>
    );
});

useGLTF.preload(modelPath, `${ASSET_PREFIX}/draco/`);

SailBoat3D.displayName = 'SailBoat3D';
export default SailBoat3D;
