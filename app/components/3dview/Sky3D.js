import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

const Sky3D = ({ inclination = 0.28, azimuth = 0.379 }) => {
    const { scene, gl } = useThree();
    const sunRef = useRef(new THREE.Vector3());
    const pmremGenerator = useRef(new THREE.PMREMGenerator(gl));

    useEffect(() => {
        pmremGenerator.current.compileEquirectangularShader();
    }, [gl]);

    // Function to update the sun position and sky parameters
    const updateSun = () => {
        const theta = Math.PI * (inclination - 0.5);
        const phi = 2 * Math.PI * (azimuth - 0.5);

        sunRef.current.x = Math.cos(phi);
        sunRef.current.y = Math.sin(phi) * Math.sin(theta);
        sunRef.current.z = Math.sin(phi) * Math.cos(theta);

        scene.environment = pmremGenerator.current.fromScene(scene).texture;
    };

    // Update sun when inclination or azimuth changes
    useEffect(() => {
        updateSun();
    }, [inclination, azimuth]);

    return (
            <Sky
                distance={450000} // Visual distance (far from the scene)
                sunPosition={sunRef.current} // The position of the sun in the sky
                turbidity={10} // Atmosphere turbidity (default: 2)
                rayleigh={2} // Scattering factor (default: 1)
                mieCoefficient={0.005} // Mie scattering coefficient
                mieDirectionalG={0.8} // Directional scattering (default: 0.8)
            />
    );
};

export default Sky3D;
