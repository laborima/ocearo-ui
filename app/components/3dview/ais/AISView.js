import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three'; // Import THREE for Color

import { useOcearoContext, toKnots, toDegrees } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat'; // Assuming AISBoat accepts onClick prop now

/**
 * Recursively searches for a mesh with material in a 3D object hierarchy
 * @param {THREE.Object3D} obj - The 3D object to search
 * @returns {THREE.Mesh|null} - The mesh with material or null if not found
 */
const findMaterialMesh = (obj) => {
    if (obj.isMesh && obj.material) return obj;
    if (obj.children?.length) {
        for (const child of obj.children) {
            const found = findMaterialMesh(child);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Updates the boat's transform, optionally interpolating
 * @param {THREE.Object3D} boat - The boat's 3D object
 * @param {object} boatData - The data containing target position/rotation
 * @param {boolean} interpolate - Whether to smoothly interpolate
 */
const updateBoatTransform = (boat, boatData, interpolate = true) => {
    const targetRotationY = -boatData.rotationAngleY;

    if (interpolate) {
        // Simple linear interpolation (lerp)
        boat.position.lerp(new THREE.Vector3(boatData.sceneX, boat.position.y, boatData.sceneZ), 0.1);

        // Shortest angle interpolation for rotation
        const currentQuaternion = new THREE.Quaternion().setFromEuler(boat.rotation);
        const targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetRotationY, 0));
        currentQuaternion.slerp(targetQuaternion, 0.1);
        boat.rotation.setFromQuaternion(currentQuaternion);

    } else {
        boat.position.set(boatData.sceneX, 0, boatData.sceneZ); // Assuming Y is always 0 initially
        boat.rotation.set(0, targetRotationY, 0);
    }
};


const AISView = ({ onUpdateInfoPanel }) => {
    const { getBoatRotationAngle } = useOcearoContext();
    const { aisData, vesselIds } = useAIS();
    const boatRefs = useRef({}); // Refs to all boat 3D objects for direct manipulation
    const materialsCache = useRef({}); // Cache materials per boat { mmsi: { white: mat, red: mat } }

    // State for the selected boat MMSI
    const [selectedBoat, setSelectedBoat] = useState(null);

    // Store user's boat rotation angle for relative position calculations
    const myRotationRef = useRef(0);

    // Proximity alert settings
    const lowerThreshold = 500; // meters
    const upperThreshold = 550; // meters

    // --- Frame Loop for Animation & Logic ---
    useFrame(() => {
        // Update user's boat rotation
        myRotationRef.current = getBoatRotationAngle();

        if (!aisData || Object.keys(boatRefs.current).length === 0) return;

        // Iterate through the *rendered* boats (via refs)
        Object.entries(boatRefs.current).forEach(([mmsi, boat]) => {
            if (!boat) return; // Skip if ref is null (e.g., during unmount)

            const boatData = aisData[mmsi];

            // If data for this rendered boat doesn't exist anymore, hide it
            if (!boatData) {
                boat.visible = false;
                return;
            }

            // Update boat position and rotation
            updateBoatTransform(boat, boatData, true);

            // Update visibility
            boat.visible = boatData.visible;

            // Only handle color logic if the boat is visible
            if (boat.visible) {
                const mesh = findMaterialMesh(boat);
                if (!mesh) {
                    // console.warn(`Material mesh not found for boat ${mmsi}`);
                    return; // Cannot update color if no material mesh found
                }

                // Initialize materials cache for this boat if needed
                if (!materialsCache.current[mmsi]) {
                    const originalMaterial = mesh.material;
                    if (!originalMaterial) return; // Should not happen if findMaterialMesh worked

                    materialsCache.current[mmsi] = {
                        white: originalMaterial.clone(),
                        red: originalMaterial.clone(),
                        // Store original color to reset white correctly if needed
                        originalColor: originalMaterial.color.clone(),
                    };
                    materialsCache.current[mmsi].white.color.copy(materialsCache.current[mmsi].originalColor); // Ensure white is original
                    materialsCache.current[mmsi].red.color.set('red');
                }

                const boatMaterials = materialsCache.current[mmsi];
                const currentStoredColor = boat.userData.proximityColor || 'white'; // Get stored color state
                let targetColor = currentStoredColor;

                // Hysteresis logic
                if (currentStoredColor === 'red' && boatData.distanceMeters > upperThreshold) {
                    targetColor = 'white';
                } else if (currentStoredColor === 'white' && boatData.distanceMeters < lowerThreshold) {
                    targetColor = 'red';
                }

                // Swap material only if the target color changed
                if (targetColor !== currentStoredColor) {
                    mesh.material = (targetColor === 'red') ? boatMaterials.red : boatMaterials.white;
                    boat.userData.proximityColor = targetColor; // Store the new color state
                }
                // Ensure initial material is set correctly if not set yet
                else if (!mesh.material || (mesh.material !== boatMaterials.red && mesh.material !== boatMaterials.white)) {
                    mesh.material = (currentStoredColor === 'red') ? boatMaterials.red : boatMaterials.white;
                }

            }
        });
    }, [aisData]);

    // --- Render Boat Components ---
    const boats = useMemo(() => {
        console.log("Re-rendering boat list"); // Debug log

        return vesselIds
            .map(vessel => {
                //console.log(vessel);

                // Skip rendering if data is not yet available for this ID
                if (!vessel) {
                    return null;
                }

                return (
                    <AISBoat
                        key={vessel.mmsi}
                        ref={(el) => {
                            // Cleanup ref when component unmounts
                            if (el) {
                                el.userData = { ...el.userData, mmsi: vessel.mmsi }; // Store mmsi in userData
                                boatRefs.current[vessel.mmsi] = el;
                            } else {
                                // Remove ref and material cache when boat is removed
                                delete boatRefs.current[vessel.mmsi];
                                delete materialsCache.current[vessel.mmsi];
                            }
                        }}
                        rotation={[0, -vessel.rotationAngleY, 0]}
                        position={[vessel.sceneX, 0, vessel.sceneZ]}
                        visible={vessel.visible}
                        boatData={vessel}
                        onClick={(boat) => {
                            if (selectedBoat && boat && selectedBoat.mmsi === boat.mmsi) {
                                setSelectedBoat(null);
                            } else {
                                setSelectedBoat(boat);
                            }
                        }}
                    />
                );
            })
            .filter(Boolean); // Filter out any nulls from missing data
    }, [vesselIds, selectedBoat]); // Depend only on vesselIds and the stable callback


    // --- Data Formatting Utilities ---
    const formatBoatData = (label, value, unit = '', isAngle = false, isSpeed = false) => {
        // If value is undefined, null, empty string, or 0 length string, return null
        if (value === undefined || value === null || value === '' ||
            (typeof value === 'string' && value.trim().length === 0)) {
            return null;
        }


        // If it's an angle value (COG or heading) and in radians, convert to degrees
        if (isAngle && value !== null) {
            // SignalK provides angles in radians, always convert to degrees
            value = toDegrees(value);
        }

        // If it's a speed value in m/s, convert to knots for display
        if (isSpeed && value !== null) {
            // SignalK provides speeds in m/s, convert to knots
            value = toKnots(value);
        }

        return `${label}: ${value}${unit}`;

    }

    const formatMMSI = (mmsi) => {
        if (!mmsi) return null;
        const prefixes = ['urn:mrn:imo:mmsi:', 'urn:mrn:signalk:uuid:'];
        let formattedMMSI = String(mmsi); // Ensure it's a string
        for (const prefix of prefixes) {
            if (formattedMMSI.startsWith(prefix)) {
                formattedMMSI = formattedMMSI.substring(prefix.length);
                break;
            }
        }
        return formattedMMSI;
    };

    const calculateDistanceNM = (distanceMeters) => {
        if (distanceMeters === undefined || distanceMeters === null) return null;
        const distanceNM = distanceMeters / 1852;
        return distanceNM.toFixed(1); // Format to 1 decimal place
    };

    // --- Prepare Info Panel Content ---
    const infoPanelContent = selectedBoat ? [
        formatBoatData('Name', selectedBoat.name),  // Only show Name if it exists
        formatBoatData('MMSI', formatMMSI(selectedBoat.mmsi)),
        formatBoatData('Distance', selectedBoat.distanceMeters ? selectedBoat.distanceMeters.toFixed(0) : O, 'm'),
        formatBoatData('Length', selectedBoat.length, 'm'),
        formatBoatData('Type', selectedBoat.shipType),
        formatBoatData('SOG', selectedBoat.sog, ' kts', false, true),
        formatBoatData('COG', selectedBoat.cog, '°', true),
        formatBoatData('Heading', selectedBoat.heading, '°', true),
        formatBoatData('Beam', selectedBoat.beam, 'm'),
        formatBoatData('Draft', selectedBoat.draft, 'm'),
        formatBoatData('Callsign', selectedBoat.callsign),
        formatBoatData('Destination', selectedBoat.destination)
    ]
        .filter(item => item !== null) // Remove any unavailable information
        .join('\n') : ''; // Format with newlines for display

    // --- Update Parent Info Panel ---
    useEffect(() => {
        if (onUpdateInfoPanel) {
            onUpdateInfoPanel(infoPanelContent);
        }
        // Depend only on the generated content and the callback itself
    }, [infoPanelContent, onUpdateInfoPanel]);


    // --- Component Return ---
    return (
        <>
            {/* Rotate the entire AIS view group based on user's boat rotation */}
            <group rotation={[0, myRotationRef.current, 0]}>
                {boats}
            </group>
        </>
    );
};

export default AISView;