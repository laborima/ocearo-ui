import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader';
import * as THREE from 'three';

export default function SailBoat3D({ inclination = 0 }) {
    const boatRef = useRef(); // Ref to access and control the boat object
    const [boatConfig, setBoatConfig] = useState(null); // State to hold boat configuration
    const boatAssets = './boats/default';

    // Load JSON configuration for the boat
    useEffect(() => {
        const fetchBoatConfig = async () => {
            const response = await fetch(`${boatAssets}/boat.json`);
            const data = await response.json();
            setBoatConfig(data);
        };

        fetchBoatConfig();
    }, [boatAssets]);

    // Unified loading function
    const loadGeometry = (fileType, fileName) => {
        const lowerFileType = fileType.toLowerCase();
        if (lowerFileType === 'stl') {
            return useLoader(STLLoader, `${boatAssets}/${fileName}`);
        } else if (lowerFileType === '3dm') {
            return useLoader(Rhino3dmLoader, `${boatAssets}/${fileName}`, (loader) => {
                loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/');
            });
        }
    };

    // Load geometries based on file type
    const hullGeometry = boatConfig ? loadGeometry(boatConfig.hull.fileType, boatConfig.hull.fileName) : null;
    const mastGeometry = boatConfig && boatConfig.hasMast ? loadGeometry(boatConfig.mast.fileType, boatConfig.mast.fileName) : null;

    // Create materials
    let boatMaterial = new THREE.MeshStandardMaterial({
        color: 0xAAAAAA,
        shininess: 200,
    });

    // Apply transformations to hull geometry
    if (hullGeometry) {
        hullGeometry.rotateX(-Math.PI / 4); // Rotate hull
        hullGeometry.translate(0, 0, 0);     // Translate hull (adjust this if needed)
        


        if (hullGeometry.hasColors) {
           boatMaterial = new THREE.MeshStandardMaterial({ opacity: hullGeometry.alpha, vertexColors: true });
        }

    }

    // Update boat inclination or position
    useFrame(() => {
        if (boatRef.current) {
            boatRef.current.rotation.z = inclination; // Apply the inclination
        }
    });

    // Function to set the color for Rhino3D model
    const setRhinoModelColors = (model, color) => {
        model.traverse((child) => {
            if (child.isMesh) child.material.color.set(color);
            else if (child.isLine) child.material.color.set('white');
        });
    };

    // Set colors for the model if it's a Rhino model
    useLayoutEffect(() => {
        if (hullGeometry && hullGeometry.isMesh) {
            setRhinoModelColors(hullGeometry, boatMaterial.color);
        }
        if (mastGeometry && mastGeometry.isMesh) {
            setRhinoModelColors(mastGeometry, boatMaterial.color);
        }
    }, [hullGeometry, mastGeometry, boatMaterial]);

    // Ensure the boat config is loaded before rendering
    if (!boatConfig) return null;

    return (
        <group
            ref={boatRef}
            scale={new THREE.Vector3(boatConfig.boatScale, boatConfig.boatScale, boatConfig.boatScale)}
            position={[0, boatConfig.waterlineToMastFootHeight * 10, 0]} // Adjust Y based on waterline
        >
            {/* Hull */}
            {hullGeometry && (
                <primitive
                    object={hullGeometry}
                    attach="mesh"
                    castShadow
                    receiveShadow
                />
            )}

            {/* Mast */}
            {mastGeometry && (
                <primitive
                    object={mastGeometry}
                    attach="mesh"
                    castShadow
                    receiveShadow
                />
            )}
        </group>
    );
}

    