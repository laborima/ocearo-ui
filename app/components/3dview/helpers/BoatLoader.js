import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const boatAssets = './boats';

export default function useBoat(boatId, desiredLength, material, useModelMaterial) {
    const [boat, setBoat] = useState(null);

    useEffect(() => {
        const loadBoat = async () => {
            try {
                const config = await fetchConfig(boatId);
                const loader = getLoader(config.modelType);

                const meshMaterial = material || getDefaultMaterial();

                if (config.modelType === 'gltf') {
                    loader.load(`${boatAssets}/${boatId}/${config.hull.fileName}`, (gltf) => {
                        const boatGroup = new THREE.Group();
                        const hullMesh = gltf.scene;

                        hullMesh.traverse((node) => {
                            if (node.isMesh) {
                                if (!useModelMaterial || !node.material) {
                                    node.material = meshMaterial;
                                }
                                node.castShadow = true;
                                node.receiveShadow = true;
                            }
                        });

                        boatGroup.add(hullMesh);
                        boatGroup.castShadow = true;
                        boatGroup.receiveShadow = true;

                        rotateModel(boatGroup, config.orientation);
                        scaleModel(boatGroup, desiredLength, config.waterlineHeight, config.mastToZ);
                        

                        setBoat(boatGroup);

                    });
                }
            } catch (error) {
                console.error('Error loading boat configuration or geometries:', error);
            }
        };

        loadBoat();
    }, [boatId, length, material, useModelMaterial]);

    return boat;
}

async function fetchConfig(boatId) {
    const response = await fetch(`${boatAssets}/${boatId}/boat.json`);
    return response.json();
}

function getLoader(modelType) {
    if (modelType === 'gltf') return new GLTFLoader();
    throw new Error(`Unsupported model type: ${modelType}`);
}


function scaleModel(model, desiredLength, waterlineHeight, mastToZ) {
    // Compute the model's bounding box
    const box = new Box3().setFromObject(model);

    // Calculate the size of the bounding box
    const size = new Vector3();
    box.getSize(size); // size.x, size.y, and size.z will contain width, height, and depth respectively

    console.log(`Width: ${size.x} meters, Height: ${size.y} meters, Lenght: ${size.z} meters`);

    // Scale the model to fit a desired size (in meters)
    const scale = desiredLength / size.z;
    model.scale.set(scale, scale, scale);
    
    if (waterlineHeight) {
        model.position.y =   waterlineHeight * scale;
    }
    
    if (mastToZ) {
       model.position.z =   mastToZ * scale;
   }
}

function rotateModel(model, orientation) {
    if (orientation) {
        switch (orientation) {
            case "rotate-y-right":
                model.rotation.set(0,  - Math.PI / 2, 0); 
                break;
                
            case "rotate-y-left":
                 model.rotation.set(0,  Math.PI / 2, 0); 
                break;
                
            case "rotate-y-360":
               model.rotation.set(0,  Math.PI, 0); 
                break;
                
            case "y-hup-right":
                // No rotation needed for y-hup-right; model already in correct orientation
                break;
                
            default:
                console.warn("Unknown orientation specified.");
        }
    }
}



function getDefaultMaterial() {
    return new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        opacity: 0.4,
        transparent: true,
        metalness: 0.5,
        roughness: 0.1,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.4
    });
}

function createMesh(geometry, material, useModelMaterial) {
    if (geometry.hasColors && useModelMaterial) {
        material = new THREE.MeshStandardMaterial({
            opacity: geometry.alpha,
            vertexColors: true
        });
    }
    return new THREE.Mesh(geometry, material);
}

function applyShadowSettings(group) {

}

