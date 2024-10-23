import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { OrbitControls } from '@react-three/drei';

const SvgWindComponent = ({
    compassHeading,
    courseOverGroundAngle,
    courseOverGroundEnable,
    trueWindAngle,
    trueWindSpeed,
    appWindAngle,
    appWindSpeed,
    laylineAngle,
    closeHauledLineEnable,
    sailSetupEnable,
    windSectorEnable,
    waypointAngle,
    waypointEnable,
    trueWindMinHistoric,
    trueWindMidHistoric,
    trueWindMaxHistoric,
}) => {
    const [svgElements, setSvgElements] = useState(null);
    const compassGroupRef = useRef();
    const appWindRef = useRef();
    const trueWindRef = useRef();
    const laylineRef = useRef();
    const windSectorRef = useRef();

    // Load the SVG file and isolate specific elements
    useEffect(() => {
        console.log("Loading SVG file...");

        const loader = new SVGLoader();
        loader.load('./assets/compass.svg', (data) => {
            const paths = data.paths;
            const group = new THREE.Group();
            const elements = {};

            paths.forEach((path) => {
                const material = new THREE.MeshBasicMaterial({
                    color: path.color,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                });

                path.toShapes(true).forEach((shape) => {
                    const geometry = new THREE.ShapeGeometry(shape);
                    const mesh = new THREE.Mesh(geometry, material);

                    console.log("Paths :", path.userData.node.id);
                    // Identifying specific elements based on layer names, ids, or other criteria
                    if (path.userData.node.id === 'circle4732') {
                        elements.compass = mesh; // Main compass
                    } else if (path.userData.node.id === 'appWind') {
                        elements.appWind = mesh; // Apparent wind arrow
                    } else if (path.userData.node.id === 'trueWind') {
                        elements.trueWind = mesh; // True wind arrow
                    } else if (path.userData.node.id === 'layline') {
                        elements.layline = mesh; // Layline
                    } else if (path.userData.node.id === 'windSector') {
                        elements.windSector = mesh; // Wind sector lines
                    }

                    group.add(mesh);
                });
            });

            console.log("SVG file loaded successfully. Elements found:", elements);
            setSvgElements(elements); // Store the elements for later use
        }, undefined, (error) => {
            console.error("An error occurred while loading the SVG:", error);
        });
    }, []);

    // Log whenever compassHeading or other relevant angles change
    useEffect(() => {
        console.log("Compass heading changed:", compassHeading);
    }, [compassHeading]);

    useEffect(() => {
        console.log("App wind angle changed:", appWindAngle);
    }, [appWindAngle]);

    useEffect(() => {
        console.log("True wind angle changed:", trueWindAngle);
    }, [trueWindAngle]);
/*
    useFrame(() => {
        if (compassGroupRef.current) {
            compassGroupRef.current.rotation.z = THREE.MathUtils.degToRad(-compassHeading);
            console.log("Updated compass rotation to:", compassGroupRef.current.rotation.z);
        }

        if (appWindRef.current) {
            appWindRef.current.rotation.z = THREE.MathUtils.degToRad(appWindAngle);
            console.log("Updated apparent wind rotation to:", appWindRef.current.rotation.z);
        }

        if (trueWindRef.current) {
            trueWindRef.current.rotation.z = THREE.MathUtils.degToRad(trueWindAngle);
            console.log("Updated true wind rotation to:", trueWindRef.current.rotation.z);
        }

        if (laylineRef.current && closeHauledLineEnable) {
            laylineRef.current.rotation.z = THREE.MathUtils.degToRad(laylineAngle);
            console.log("Updated layline rotation to:", laylineRef.current.rotation.z);
        }

        if (windSectorRef.current && windSectorEnable) {
            windSectorRef.current.rotation.z += 0.01; // Example of continuous rotation
            console.log("Updated wind sector rotation to:", windSectorRef.current.rotation.z);
        }
    });*/
     return (
        <group>
          <group ref={compassGroupRef}>
            {svgElements?.compass && <primitive object={svgElements.compass} scale={0.01} position={[0, 1, 0]} />}
          </group>
          <group ref={appWindRef}>
            {svgElements?.appWind && <primitive object={svgElements.appWind} scale={0.01} position={[0, 0, 0]} />}
          </group>
          <group ref={trueWindRef}>
            {svgElements?.trueWind && <primitive object={svgElements.trueWind} scale={0.01} position={[0, 0, 0]} />}
          </group>
          <group ref={laylineRef}>
            {svgElements?.layline && <primitive object={svgElements.layline} scale={0.01} position={[0, 0, 0]} />}
          </group>
          <group ref={windSectorRef}>
            {svgElements?.windSector && <primitive object={svgElements.windSector} scale={0.01} position={[0, 0, 0]} />}
          </group>
        </group>
      );
    };

    export default SvgWindComponent;
