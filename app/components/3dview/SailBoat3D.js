import React, { useRef, useEffect, forwardRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOcearoContext } from '../context/OcearoContext';
import configService from '../settings/ConfigService';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Sail3D from './sail/Sail3D';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';


// Helper function to get model path
const getModelPath = (modelPath = 'default') => 
    `${ASSET_PREFIX}/boats/${modelPath}/assets/scene-transformed.glb`;

const SailBoat3D = forwardRef(({ showSail = false, ...props }, ref) => {
    const boatRef = useRef();
    const rudderRef = useRef();
    const { getSignalKValue } = useOcearoContext();

    const config = configService.getAll();
    let selectedBoat = configService.getSelectedBoat() || {
        name: "Default",
        modelPath: "default",
        capabilities: ["navigation", "rudder", "sail", "color"]
    };

    
    const modelPath = useMemo(() =>
      getModelPath(selectedBoat.modelPath),
      [selectedBoat]
    );
    
    const capabilities = selectedBoat?.capabilities || [];

    // Load model only when path changes
    const { nodes, materials } = useGLTF(modelPath, `${ASSET_PREFIX}/draco/`);

    // Memoize material properties
    const materialProperties = useMemo(() => ({
        primaryColor: config.primaryColor,
        metallicEffect: config.metallicEffect || false
    }), [config.primaryColor, config.metallicEffect]);

    // Update materials when properties change
    useEffect(() => {
        if (!materials?.fiberglass) return;

        materials.fiberglass.color.set(materialProperties.primaryColor);
        materials.fiberglass.metalness = materialProperties.metallicEffect ? 1.0 : 0.0;
        materials.fiberglass.roughness = materialProperties.metallicEffect ? 0.2 : 1.0;

        // Optimize textures
        Object.values(materials).forEach(material => {
            if (material.map) {
                material.map.minFilter = THREE.LinearFilter;
                material.map.magFilter = THREE.LinearFilter;
                material.map.anisotropy = 1;
            }
        });
    }, [materials, materialProperties]);

    // Memoize transformation matrix for better performance
    const rudderMatrix = useMemo(() => new THREE.Matrix4(), []);
    const luffAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);

    // Optimize frame updates using RAF
    useFrame(() => {
        if (!boatRef.current) return;

        const inclination = getSignalKValue('navigation.attitude.roll') || 0;
        const rudderAngleRadians = getSignalKValue('steering.rudderAngle') || 0;
        const rudderAngle = (rudderAngleRadians * 180) / Math.PI;

        // Update boat inclination
        if (boatRef.current.rotation.z !== inclination) {
            boatRef.current.rotation.z = inclination;
        }

        // Update rudder rotation
        if (rudderRef.current) {
            rudderMatrix.makeRotationFromEuler(
                new THREE.Euler(-Math.PI / 2, Math.PI / 2, 0)
            );
            rudderRef.current.setRotationFromMatrix(rudderMatrix);
            rudderRef.current.rotateOnAxis(
                luffAxis,
                -THREE.MathUtils.degToRad(rudderAngle)
            );
        }
    });

    // Memoize boat meshes based on selected boat
    const BoatMeshes = useMemo(() => {
        const meshComponents = {
            Default: () => (
                <>
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
                    <mesh ref={rudderRef} geometry={nodes.rudder_fiberglass_0.geometry} material={materials.fiberglass} position={[0, -1.153, 3.486]} rotation={[-Math.PI / 2, Math.PI / 2, 0]} scale={[0.573, 0.262, 0.262]} />
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
                </>
            ),
            Optimist: () => (
                <>
                    <mesh geometry={nodes.body_body_0.geometry} material={materials.body} position={[-0.054, 0.272, -0.022]} rotation={[-1.571, 0.01, 0.01]} scale={[1, 5.242, 1]} />
                    <mesh geometry={nodes.boom_aluminium_0.geometry} material={materials.aluminium} position={[-0.019, 2.771, 0.964]} rotation={[0, 0.01, -0.01]} scale={[0.15, 0.15, 4.609]} />
                    <mesh geometry={nodes.rubber_joint__0.geometry} material={materials.rubber_joint__0} position={[-0.008, 1.407, 3.453]} rotation={[1.571, -0.01, -0.01]} scale={[-0.037, 0.056, 0.079]} />
                    <mesh geometry={nodes.sail_sail_0.geometry} material={materials.sail} position={[0.038, 8.739, 0.698]} rotation={[2.356, 1.557, 2.356]} scale={[-5.728, 4.361, 4.361]} />
                </>
            ),
            Ship: () => (
                <mesh geometry={nodes.Object_10.geometry} material={materials.material_0} position={[0, -0.55, 0]} rotation={[-1.558, 0.002, 3.139]} scale={0.004} />
            ),
            Windsurf: () => (
                <mesh geometry={nodes['body_Material_#30_0'].geometry} material={materials.Material_30} position={[-0.007, 0, -0.071]} rotation={[-Math.PI / 2, 0, 0]} scale={0.002} />
            ),
            Sailboat: () => (
                <mesh geometry={nodes.sailboat.geometry} material={materials.texture} position={[0, -1.5, 0]} rotation={[-Math.PI, 0.011, -Math.PI]} scale={0.219} />
            )
        };

        return meshComponents[selectedBoat.name] || meshComponents.Default;
    }, [selectedBoat.name, nodes, materials]);

    return (
        <group {...props} ref={boatRef} dispose={null}>
            {capabilities.includes('sail') && showSail && <Sail3D />}
            <BoatMeshes />
        </group>
    );
});


// Preload default model
useGLTF.preload(getModelPath(), `${ASSET_PREFIX}/draco/`);

SailBoat3D.displayName = 'SailBoat3D';
export default SailBoat3D;
