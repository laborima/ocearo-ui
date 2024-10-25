import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader';
import * as THREE from 'three';
import { useOcearoContext } from '../context/OcearoContext';
import { useThreeDView } from './context/ThreeDViewContext';
import useBoat from './helpers/BoatLoader';


export default function SailBoat3D() {
    const boatRef = useRef(); // Ref to access and control the boat object
    //const [boat, setBoat] = useState(null); // Store the boat group
    const { getSignalKValue } = useOcearoContext(); // Use the context to get SignalK values
    const {states } = useThreeDView();
    const boatAssets = './boats/default';
/*
    // Load boat configuration on mount
    useEffect(() => {
        const fetchBoatConfig = async () => {
            try {
                const response = await fetch(`${boatAssets}/boat.json`);
                const config = await response.json();

                const loader = config.modelType === 'stl' ? new STLLoader() : new Rhino3dmLoader();
                if (config.modelType === '3dm') {
                    loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/');
                }

                loader.load(`${boatAssets}/${config.hull.fileName}`, hullGeometry => {
                    let meshMaterial = new THREE.MeshStandardMaterial({
                        color: 0xFFFFFF,     // light gray color
                        opacity: 0.4,        // lower opacity for transparency
                        transparent: true,   // enable transparency
                        metalness: 0.5,      // slight metallic effect
                        roughness: 0.1,      // smooth surface
                        emissive: 0xFFFFFF,  // add a soft white glow
                        emissiveIntensity: 0.4 // lower emissive intensity
                    });

                    if (hullGeometry.hasColors  && states.showOcean) {
                        meshMaterial = new THREE.MeshStandardMaterial({ opacity: hullGeometry.alpha, vertexColors: true });
                    }

                    const boatGroup = new THREE.Group();
                    const hullMesh = new THREE.Mesh(hullGeometry, meshMaterial);

                    // Rotate and position the hull mesh
                    hullGeometry.rotateX(-Math.PI / 2);
                    hullGeometry.rotateY(Math.PI / 2);
                    boatGroup.scale.set(config.boatScale, config.boatScale, config.boatScale);
                    hullMesh.position.y = config.waterlineToMastFootHeight * 1000; // Adjust Y position

                    boatGroup.add(hullMesh);

                    // Set casting and receiving shadows
                    boatGroup.castShadow = true;
                    boatGroup.receiveShadow = true;

                    if (config.mast) {
                        // Load mast geometry after hull
                        loader.load(`${boatAssets}/${config.mast.fileName}`, mastGeometry => {
                            let mastMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, shininess: 200 });
                            if (mastGeometry.hasColors && states.showOcean) {
                                mastMaterial = new THREE.MeshStandardMaterial({ opacity: mastGeometry.alpha, vertexColors: true });
                            }

                            const mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
                            mastMesh.rotation.set(0, 0, THREE.MathUtils.degToRad(4)); // Rotate the mast slightly (4 degrees)
                            mastMesh.position.y = config.waterlineToMastFootHeight * 1000; // Position mast

                            mastMesh.castShadow = true;
                            mastMesh.receiveShadow = true;

                            // Add mast to the boat
                            boatGroup.add(mastMesh);
                            setBoat(boatGroup); // Update state with boat that includes the mast
                        });
                    } else {
                        setBoat(boatGroup); // Update state with boat without mast
                    }
                });
            } catch (error) {
                console.error('Error loading boat configuration or geometries:', error);
            }
        };

        fetchBoatConfig();
    }, []);*/

    // Load the boat model with `useBoat`
     const boat = useBoat("default2",10,10, null, true);

    
    
    // Get inclination from SignalK (use 'heel' data as an example)
    const inclination = getSignalKValue('navigation.attitude.roll') || 0; // Get inclination (heel angle) from SignalK, fallback to 0 if unavailable

    // Update boat inclination or position
    useFrame(() => {
        if (boatRef.current && boatRef.current.rotation.z !== inclination) {
            boatRef.current.rotation.z = inclination; // Apply the inclination to the boat's Z rotation
        }
    });

    // Ensure the boat config is loaded before rendering
    if (!boat) return null;

    return (
        <group ref={boatRef}>
            <primitive object={boat} />
        </group>
    );
}
