import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const boatAssets = './boats';

export default function useBoat(boatId, length, width, material, useModelMaterial) {
    const [boat, setBoat] = useState(null);

    useEffect(() => {
        const loadBoat = async () => {
            if (!boatId) {
                const geometry = new THREE.BoxGeometry(width, 1, length);
                setBoat(new THREE.Mesh(geometry, material || getDefaultMaterial()));
                return;
            }

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
                      //  applyShadowSettings(boatGroup);
                        boatGroup.scale.set(config.boatScale, config.boatScale, config.boatScale);
                     //   hullMesh.position.y = config.waterlineToMastFootHeight * 1000;

                        if (config.mast) {
                            loadMast(loader, config, boatGroup).then(setBoat);
                        } else {
                            setBoat(boatGroup);
                        }
                    });
                } else {
                    loader.load(`${boatAssets}/${boatId}/${config.hull.fileName}`, (hullGeometry) => {
                        const boatGroup = new THREE.Group();
                        const hullMesh = createMesh(hullGeometry, meshMaterial, useModelMaterial);

                        hullGeometry.rotateX(-Math.PI / 2);
                        hullGeometry.rotateY(Math.PI / 2);
                        boatGroup.scale.set(config.boatScale, config.boatScale, config.boatScale);
                        hullMesh.position.y = config.waterlineToMastFootHeight * 1000;

                        boatGroup.add(hullMesh);
                        applyShadowSettings(boatGroup);

                        if (config.mast) {
                            loadMast(loader, config, boatGroup).then(setBoat);
                        } else {
                            setBoat(boatGroup);
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading boat configuration or geometries:', error);
            }
        };

        loadBoat();
    }, [boatId, length, width, material, useModelMaterial]);

    return boat;
}

async function fetchConfig(boatId) {
    const response = await fetch(`${boatAssets}/${boatId}/boat.json`);
    return response.json();
}

function getLoader(modelType) {
    if (modelType === 'stl') return new STLLoader();
    if (modelType === '3dm') {
        const loader = new Rhino3dmLoader();
        loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/');
        return loader;
    }
    if (modelType === 'gltf') return new GLTFLoader();
    throw new Error(`Unsupported model type: ${modelType}`);
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
    group.castShadow = true;
    group.receiveShadow = true;
}

async function loadMast(loader, config, boatGroup) {
    return new Promise((resolve) => {
        loader.load(`${boatAssets}/${config.mast.fileName}`, (mastGeometry) => {
            const mastMaterial = new THREE.MeshStandardMaterial({
                color: 0xAAAAAA,
                shininess: 200
            });

            const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
            mastMesh.position.y = config.waterlineToMastFootHeight * 1000;
            mastMesh.castShadow = true;
            mastMesh.receiveShadow = true;

            boatGroup.add(mastMesh);
            resolve(boatGroup);
        });
    });
}
