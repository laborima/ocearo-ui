import React, { useRef, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOcearoContext } from '../context/OcearoContext';
import configService from '../settings/ConfigService'; // Import ConfigService for configuration

import { useGLTF } from '@react-three/drei'

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';
const modelPath = `${ASSET_PREFIX}/boats/default/assets/scene-transformed.glb`;


const SailBoat3D = forwardRef((props, ref) => {
    const boatRef = useRef(); // Ref to access and control the boat object
    //const [boat, setBoat] = useState(null); // Store the boat group
    const { getSignalKValue } = useOcearoContext(); // Use the context to get SignalK values

    const { nodes, materials } = useGLTF(modelPath, `${ASSET_PREFIX}/draco/`)

    // Load configuration settings
    const config = configService.getAll();
    const primaryColor = config.primaryColor || '#ffffff'; // Default to white if not set
    const metallicEffect = config.metallicEffect || false; // Default to non-metallic


    // Get inclination from SignalK (use 'heel' data as an example)
    const inclination = getSignalKValue('navigation.attitude.roll') || 0; // Get inclination (heel angle) from SignalK, fallback to 0 if unavailable


    useEffect(() => {
        // Apply the color and metallic effect to the hull (fiberglass2 material)
        if (materials && materials.fiberglass) {
            materials.fiberglass.color.set(primaryColor); // Set the material color
            materials.fiberglass.metalness = metallicEffect ? 1.0 : 0.0; // Apply metallic effect
            materials.fiberglass.roughness = metallicEffect ? 0.2 : 1.0; // Adjust roughness for metallic look
        }
    }, [primaryColor, metallicEffect, materials]);

    // Update boat inclination or position
    useFrame(() => {
        if (boatRef.current && boatRef.current.rotation.z !== inclination) {
            boatRef.current.rotation.z = inclination; // Apply the inclination to the boat's Z rotation
        }
    });

    return (
        <group {...props} ref={boatRef} dispose={null}>
            <mesh geometry={nodes.baba_metal_0.geometry} material={materials.metal} position={[0.24, 0.895, -5.546]} rotation={[-Math.PI / 2, 0, 1.968]} scale={0.027} />
            <mesh geometry={nodes.camadadirek_fiberglass_0.geometry} material={materials.fiberglass} position={[0, 5.267, -3.711]} rotation={[2.054, 0, Math.PI]} scale={[-0.042, 0.042, 4.707]} />
            <mesh geometry={nodes.camadanyelkeni_bez_0.geometry} material={materials.material} position={[0, 5.267, -3.711]} rotation={[2.054, 0, Math.PI]} scale={[-0.042, 0.042, 4.707]} />
            <mesh geometry={nodes.duman_ahsap_0.geometry} material={materials.ahsap} position={[-0.011, 0.854, 3.487]} rotation={[-Math.PI, 0, Math.PI / 2]} scale={[0.045, 0.045, 0.011]} />
            <mesh geometry={nodes.dumenyuvasi_cam_0.geometry} material={materials.material_5} position={[-0.011, 0.299, 3.441]} rotation={[-Math.PI / 2, 0, 1.571]} scale={0.094} />
            <mesh geometry={nodes.govde_fiberglass2_0.geometry} material={materials.fiberglass2} position={[0, 0.32, -0.897]} rotation={[0, Math.PI / 2, 0]} scale={[5.11, 0.454, 1.212]} />
        </group>
    );

});

useGLTF.preload(modelPath, `${ASSET_PREFIX}/draco/`);

SailBoat3D.displayName = 'SailBoat3D';
export default SailBoat3D;
