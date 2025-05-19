import React, { useRef, useEffect, forwardRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOcearoContext, toDegrees, toKnots } from '../context/OcearoContext';
import configService from '../settings/ConfigService';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Sail3D from './sail/Sail3D';

/**
 * Find a mesh with material in an object hierarchy
 * @param {Object} obj - The 3D object to search
 * @returns {Object|null} - The object with material or null if not found
 */
const findMaterial = (obj) => {
  if (obj.material) return obj;
  for (const child of obj.children) {
    const found = findMaterial(child);
    if (found) return found;
  }
  return null;
};

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';


// Helper function to get model path
const getModelPath = (modelPath = 'default') =>
    `${ASSET_PREFIX}/boats/${modelPath}/assets/scene-transformed.glb`;

const defaultBoat = {
    name: "Default",
    modelPath: "default",
    capabilities: ["navigation", "rudder", "sail", "color"]
};


const SailBoat3D = forwardRef(({ showSail = false, onUpdateInfoPanel, ...props }, ref) => {
    const boatRef = useRef();
    const rudderRef = useRef();
    const { getSignalKValue } = useOcearoContext();
    const config = configService.getAll();

    // Use state to store the selected boat
    const [selectedBoat, setSelectedBoat] = useState(() =>
        configService.getSelectedBoat() || defaultBoat
    );

    // Update selectedBoat when config changes
    useEffect(() => {
        const newSelectedBoat = configService.getSelectedBoat() || defaultBoat;
        setSelectedBoat(newSelectedBoat);
    }, [config]);



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
        // For default boat, use direct material access
        if (selectedBoat.modelPath === "default") {
            if (!materials?.fiberglass) return;
            
            materials.fiberglass.color.set(materialProperties.primaryColor);
            materials.fiberglass.metalness = materialProperties.metallicEffect ? 1.0 : 0.0;
            materials.fiberglass.roughness = materialProperties.metallicEffect ? 0.2 : 1.0;
        } 
        // For non-default boats, use findMaterial to locate and update the material
        else if (boatRef.current) {
            // Get all scene objects
            boatRef.current.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Apply color and material properties to each material
                    if (Array.isArray(child.material)) {
                        // Handle multi-material objects
                        child.material.forEach(mat => {
                            mat.color.set(materialProperties.primaryColor);
                            mat.metalness = materialProperties.metallicEffect ? 1.0 : 0.0;
                            mat.roughness = materialProperties.metallicEffect ? 0.2 : 1.0;
                        });
                    } else {
                        // Handle single material objects
                        child.material.color.set(materialProperties.primaryColor);
                        child.material.metalness = materialProperties.metallicEffect ? 1.0 : 0.0;
                        child.material.roughness = materialProperties.metallicEffect ? 0.2 : 1.0;
                    }
                }
            });
        }

        // Optimize textures for all boats
        Object.values(materials).forEach(material => {
            if (material.map) {
                material.map.minFilter = THREE.LinearFilter;
                material.map.magFilter = THREE.LinearFilter;
                material.map.anisotropy = 1;
            }
        });
    }, [materials, materialProperties, selectedBoat, boatRef]);

    // Memoize transformation matrix for better performance
    const rudderMatrix = useMemo(() => new THREE.Matrix4(), []);
    const luffAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);

    // Optimize frame updates using RAF
    useFrame(() => {
        if (!boatRef.current) return;

        // Get attitude values from SignalK (in radians)
        const attitude = getSignalKValue('navigation.attitude') || { roll: 0, pitch: 0, yaw: 0 };
        const rudderAngleRadians = getSignalKValue('steering.rudderAngle') || 0;
        const rudderAngle = (rudderAngleRadians * 180) / Math.PI;

        // Update boat attitude
        if (boatRef.current) {
            boatRef.current.rotation.set(
                attitude.pitch,  // X rotation (pitch)
                0/*2* Math.PI  - attitude.yaw*/,    // Y rotation (yaw)
                2* Math.PI  - attitude.roll    // Z rotation (roll)
            );
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
            ),
            RM1080: () => (
                <>
                  <mesh geometry={nodes.Body_1.geometry} material={materials.PaletteMaterial003} />
                  <mesh geometry={nodes.Body_2.geometry} material={materials.PaletteMaterial001} />
                  <mesh geometry={nodes.Body_3.geometry} material={materials.PaletteMaterial002} />
                </>  
                  )
        };

        return meshComponents[selectedBoat.name] || meshComponents.Default;
    }, [selectedBoat.name, nodes, materials]);

    // Get the various boat data values for display in the info panel
    const boatData = useMemo(() => {
        return {
            // Basic info
            name: selectedBoat.name || 'Sailboat',
            type: 'sailboat',
            
            // Wind data
            trueWindAngle: getSignalKValue('environment.wind.angleTrueWater') || 0,
            trueWindSpeed: getSignalKValue('environment.wind.speedTrue') || 0,
            appWindAngle: getSignalKValue('environment.wind.angleApparent') || 0,
            appWindSpeed: getSignalKValue('environment.wind.speedApparent') || 0,
            
            // Navigation performance
            beatAngle: getSignalKValue('performance.beatAngle') || 0,
            polarSpeed: getSignalKValue('performance.polarSpeed') || 0,
            polarSpeedRatio: getSignalKValue('performance.polarSpeedRatio') || 0,
            velocityMadeGood: getSignalKValue('performance.velocityMadeGood') || 0,
            speedThroughWater: getSignalKValue('navigation.speedThroughWater') || 0,
            
            // Heading and course
            headingTrue: getSignalKValue('navigation.headingTrue') || 0,
            courseOverGroundTrue: getSignalKValue('navigation.courseOverGroundTrue') || 0,
           
            position: getSignalKValue('navigation.position') || { latitude: 0, longitude: 0 }
        };
    }, [getSignalKValue, selectedBoat.name]);

   
    // Format data for InfoPanel display
    const formatInfoPanelContent = (data) => {
        
        // Create array of formatted strings, filtering out empty/zero values
        const result = [];
        
        // Only add name if it exists and isn't empty
        if (data.name) {
            result.push(`Name: ${data.name}`);
        }
        
        // Only add wind data if speed exists and isn't zero
        if (data.trueWindSpeed) {
            // SignalK provides wind speed in m/s
            result.push(`Wind: ${toKnots(data.trueWindSpeed)}kn @ ${toDegrees(data.trueWindAngle)}°`);
        }
        
        // Only add apparent wind data if speed exists and isn't zero
        if (data.appWindSpeed) {
            // SignalK provides apparent wind speed in m/s
            result.push(`App Wind: ${toKnots(data.appWindSpeed)}kn @ ${toDegrees(data.appWindAngle)}°`);
        }
        
        // Only add speed if it exists and isn't zero
        if (data.speedThroughWater) {
            // SignalK provides boat speed in m/s
            result.push(`Speed: ${toKnots(data.speedThroughWater)}kn`);
        }
        
        // Only add heading if it exists
        if (data.headingTrue !== undefined && data.headingTrue !== null) {
            // SignalK provides heading in radians
            result.push(`Heading: ${toDegrees(data.headingTrue)}°`);
        }
        
        // Only add COG if it exists
        if (data.courseOverGroundTrue !== undefined && data.courseOverGroundTrue !== null) {
            // SignalK provides COG in radians
            result.push(`COG: ${toDegrees(data.courseOverGroundTrue)}°`);
        }
        
        // Only add VMG if it exists and isn't zero
        if (data.velocityMadeGood) {
            // SignalK provides VMG in m/s
            result.push(`VMG: ${toKnots(data.velocityMadeGood)}kn`);
        }
        
        // Only add Polar if it exists and isn't zero
        if (data.polarSpeedRatio) {
            // Ratio is already a percentage (0-1 range)
            result.push(`Polar: ${(data.polarSpeedRatio * 100).toFixed(0)}%`);
        }
        
        // Only add Position if both latitude and longitude exist
        if (data.position && data.position.latitude !== undefined && data.position.longitude !== undefined) {
            result.push(`Position: ${data.position.latitude.toFixed(4)}°, ${data.position.longitude.toFixed(4)}°`);
        }
        
        return result.join('\n');
    };
    
    // Handle touch/click events for touchscreen optimization
    const [infoVisible, setInfoVisible] = useState(false);
    
    const handleInfoPanelToggle = () => {
        const newVisibleState = !infoVisible;
        setInfoVisible(newVisibleState);
        
        if (onUpdateInfoPanel) {
            // If toggling on, show the info; if toggling off, hide it
            onUpdateInfoPanel(newVisibleState ? formatInfoPanelContent(boatData) : null);
        }
    };

    return (
        <group 
            {...props} 
            ref={boatRef} 
            dispose={null}
            onClick={handleInfoPanelToggle}
        >
            {capabilities.includes('sail') && showSail && <Sail3D />}
            <BoatMeshes />
        </group>
    );
});


// Preload default model
useGLTF.preload(getModelPath(), `${ASSET_PREFIX}/draco/`);

SailBoat3D.displayName = 'SailBoat3D';
export default SailBoat3D;
