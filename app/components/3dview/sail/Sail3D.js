import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Wind from './Wind';
import SailShape from './SailShape';
import { useOcearoContext, oBlue } from '../../context/OcearoContext';

// Constants (moved outside the component to avoid recalculation)
const SAIL_HEIGHT = 8000; // mm
const SAIL_LEVEL_HEIGHT = 50; // mm
const SAIL_VERTICES_PER_LEVEL = Math.floor(1000 / SAIL_LEVEL_HEIGHT);
const SAIL_LEVELS = Math.ceil(SAIL_HEIGHT / SAIL_LEVEL_HEIGHT);
const SAIL_TACK_HEIGHT = 900; // mm
const SAIL_TACK_MAST_DISTANCE = 3600; // mm
const SAIL_MAST_WIDTH = 200; // mm
const SAIL_DECKSWEEPER_WIDTH = 3800; // mm
const SAIL_TOP_MAST_DISTANCE = 390; // mm
const SAIL_LEECH_CURVATURE = 600; // mm

const BOAT_LIMITS = {
    waterlineToMastFootHeight: 0.45, // m
    maxMastRotation: Math.PI / 2,
    maxChordRotationPerSailLevel: (Math.PI / 3) * 2,
};

const Sail3D = ({
    windParams = { speed: 5.0, hellman: 0.27 },
    boatParams = { mastrotation: 0.0, heading: 130.0, speed: 5.0 },
    sailParams = { mastArea: 0, sailArea: 0, cunningham: 1, angleOfAttack: 20 },
}) => {
    const { getSignalKValue } = useOcearoContext();

    const sailRef = useRef();
    const flatSailGeometryRef = useRef(null);
    const lastMastRotationRef = useRef(0);
    const lastCunninghamRef = useRef(null);
    const sailShapeRef = useRef(null);
    const windGroupRef = useRef();
    const apparentWindFieldRef = useRef({});

    // Memoized wind cone creation
    const createWindCone = useMemo(() => {
        const windcone = new THREE.Group();
        const geometry = new THREE.ConeGeometry(0.1, 0.2, 12);
        const material = new THREE.MeshStandardMaterial({
            color: oBlue,
            opacity: 0.5,
            transparent: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -0.1, 0);
        windcone.add(mesh);
        return windcone;
    }, []);

    // Initialize wind visualization on mount
    useEffect(() => {
        const windGroup = new THREE.Group();
        const apparentWindField = {};

        for (let height = 0; height < SAIL_HEIGHT / 1000; height += 0.5) {
            const clone = createWindCone.clone();
            clone.position.set(0, height, 0);
            apparentWindField[height * 2] = clone;
            windGroup.add(clone);
        }

        windGroup.position.set(0, 0, 0);

        if (windGroupRef.current) {
            windGroupRef.current.add(windGroup);
        }

        apparentWindFieldRef.current = apparentWindField;

        return () => {
            windGroup.clear();
        };
    }, [createWindCone]);

    // Recalculate apparent wind field
    const recalcApparentWindField = (appWindSpeed, hellman) => {
        const apparentWindField = apparentWindFieldRef.current;

        if (!apparentWindField) {
            console.error("apparentWindField is not initialized.");
            return;
        }

        for (let height = 0; height < SAIL_HEIGHT / 1000; height += 0.5) {
            const aws = Wind.windSheer(appWindSpeed, height, hellman);
            const cone = apparentWindField[height * 2];

            if (!cone) {
                console.warn(`Apparent wind field cone at height ${height} is not defined.`);
                continue;
            }

            cone.scale.set(aws * 0.1, aws, aws * 0.1);
            cone.rotation.set(0, -Math.PI, Math.PI / 2);
        }
    };

    // Memoized sail geometry creation
    const createSailGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const sailClipWidthPerLevel = [];

        for (let level = 0; level <= SAIL_LEVELS; level++) {
            const height = Math.min(level * SAIL_LEVEL_HEIGHT, SAIL_HEIGHT);
            let sailWidth, clipOffWidth;

            if (height < SAIL_TACK_HEIGHT) {
                sailWidth = SAIL_TACK_MAST_DISTANCE;
                clipOffWidth = SAIL_DECKSWEEPER_WIDTH +
                    (SAIL_TACK_MAST_DISTANCE - SAIL_DECKSWEEPER_WIDTH) * height / SAIL_TACK_HEIGHT;
            } else {
                sailWidth = SAIL_TACK_MAST_DISTANCE -
                    (SAIL_TACK_MAST_DISTANCE - SAIL_TOP_MAST_DISTANCE) *
                    (height - SAIL_TACK_HEIGHT) / (SAIL_HEIGHT - SAIL_TACK_HEIGHT);
                sailWidth += Math.sin((height - SAIL_TACK_HEIGHT) /
                    (SAIL_HEIGHT - SAIL_TACK_HEIGHT) * Math.PI) * SAIL_LEECH_CURVATURE;
                clipOffWidth = sailWidth;
            }

            let lastX = 0;
            for (let v = 0; v < SAIL_VERTICES_PER_LEVEL; v++) {
                const segWidth = sailWidth / (SAIL_VERTICES_PER_LEVEL - 1);
                let clipAway = segWidth * v - clipOffWidth;
                let finalSegWidth = segWidth;

                if (clipAway > 0.1) {
                    finalSegWidth = clipAway > segWidth ? 0 : segWidth - clipAway;
                }

                vertices.push(
                    v === 0 ? 0 : (lastX + finalSegWidth) / 1000, // x
                    height / 1000, // y
                    0 // z
                );

                lastX = v === 0 ? 0 : lastX + finalSegWidth;

                const sailStripeInterval = Math.floor(SAIL_LEVELS / 10);
                colors.push(...(level % sailStripeInterval === 0 ? [0.8, 0.0, 0.047] : [0.596, 0.596, 0.596]));
            }

            sailClipWidthPerLevel.push(clipOffWidth === sailWidth ? null : clipOffWidth);
        }

        const indices = [];
        for (let level = 0; level < SAIL_LEVELS; level++) {
            for (let v = 1; v < SAIL_VERTICES_PER_LEVEL; v++) {
                const i = level * SAIL_VERTICES_PER_LEVEL + v;
                indices.push(
                    i - 1, i, i + SAIL_VERTICES_PER_LEVEL - 1,
                    i, i + SAIL_VERTICES_PER_LEVEL, i + SAIL_VERTICES_PER_LEVEL - 1
                );
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return { geometry, sailClipWidthPerLevel };
    }, []);
    
    const { geometry, sailClipWidthPerLevel } = createSailGeometry;

    // Memoized wind angle and speed
    const appWindAngle = useMemo(() => getSignalKValue('environment.wind.angleApparent') || 0, [getSignalKValue]);
    const appWindSpeed = useMemo(() => getSignalKValue('environment.wind.speedApparent') || 0, [getSignalKValue]);

    // Update sail geometry and wind field
    useEffect(() => {
        if (!sailRef.current) return;

        recalcApparentWindField(appWindSpeed, windParams.hellman);

        const isWindFromLeft = appWindAngle > Math.PI && appWindAngle <= 2 * Math.PI;
        const sailGeometry = sailRef.current.geometry;
        const positions = sailGeometry.attributes.position.array;

        if (sailParams.cunningham !== lastCunninghamRef.current) {
            sailShapeRef.current = new SailShape(
                SAIL_TACK_MAST_DISTANCE,
                SAIL_TOP_MAST_DISTANCE,
                SAIL_MAST_WIDTH,
                sailParams.cunningham
            );
            lastCunninghamRef.current = sailParams.cunningham;
        }

        if (!flatSailGeometryRef.current) {
            flatSailGeometryRef.current = sailGeometry.clone();
        }

        const mastFootOverWaterHeight = BOAT_LIMITS.waterlineToMastFootHeight * 1000;
        const dirFact = isWindFromLeft ? -1.0 : 1.0;

        let chordAngleOfAttackRad = THREE.MathUtils.degToRad(sailParams.angleOfAttack);
        const absAwaRad = Math.abs(appWindAngle);
        const mastEntryAngleRad = sailShapeRef.current.mastAngleRad;

        if (absAwaRad < 0.01) {
            chordAngleOfAttackRad = 0;
        }

        const mastRotationRad = Math.min(
            absAwaRad - chordAngleOfAttackRad + mastEntryAngleRad,
            BOAT_LIMITS.maxMastRotation
        );

        const luffAxis = new THREE.Vector3(0, 1, 0);
        let lastChordRotationRad = null;

        for (let level = 0; level <= SAIL_LEVELS; level++) {
            const overWaterHeight = level * SAIL_LEVEL_HEIGHT + mastFootOverWaterHeight;
            const levelAw = { "awa": appWindAngle, "aws": Wind.windSheer(appWindSpeed, overWaterHeight / 1000.0, windParams.hellman) };
            const levelAbsAwaRad = Math.abs(levelAw.awa);

            let chordAngleRad = levelAbsAwaRad - chordAngleOfAttackRad;
            if (chordAngleRad < 0) {
                chordAngleRad = 0;
            } else if (chordAngleRad > Math.PI / 2) {
                chordAngleRad = Math.PI / 2;
            }

            let chordRotationRad = chordAngleRad - mastRotationRad;
            if (lastChordRotationRad &&
                ((chordRotationRad - lastChordRotationRad) > BOAT_LIMITS.maxChordRotationPerSailLevel)) {
                chordRotationRad = lastChordRotationRad + BOAT_LIMITS.maxChordRotationPerSailLevel;
            }
            lastChordRotationRad = chordRotationRad;

            const clipWidth = sailClipWidthPerLevel[level];
            const verticeAnglesRad = sailShapeRef.current.getVerticesAngles(
                SAIL_VERTICES_PER_LEVEL,
                SAIL_MAST_WIDTH,
                clipWidth
            );

            for (let v = 1; v < SAIL_VERTICES_PER_LEVEL; v++) {
                const i = (level * SAIL_VERTICES_PER_LEVEL + v) * 3;
                const originalPos = new THREE.Vector3(
                    flatSailGeometryRef.current.attributes.position.array[i],
                    flatSailGeometryRef.current.attributes.position.array[i + 1],
                    flatSailGeometryRef.current.attributes.position.array[i + 2]
                );

                originalPos.applyAxisAngle(
                    luffAxis,
                    -(chordRotationRad + verticeAnglesRad[v]) * dirFact
                );

                positions[i] = originalPos.x;
                positions[i + 1] = originalPos.y;
                positions[i + 2] = originalPos.z;
            }
        }

        sailGeometry.attributes.position.needsUpdate = true;

        const newBoatParams = {
            ...boatParams,
            mastrotation: mastRotationRad * dirFact,
        };

        if (sailRef.current) {
            sailRef.current.rotateY(
                lastMastRotationRef.current - newBoatParams.mastrotation
            );
        }

        lastMastRotationRef.current = newBoatParams.mastrotation;
    }    , [
        // Dependencies - add all values that should trigger an update
        appWindSpeed,
        appWindAngle,
        windParams.hellman,
        sailParams.cunningham,
        sailParams.angleOfAttack,
        boatParams, sailClipWidthPerLevel
    ]);

    return (
        <mesh ref={sailRef} position={[0, 2, -1]} rotation={[0, -Math.PI / 2, 0]}>
            <bufferGeometry {...geometry} />
            <group ref={windGroupRef} />
            <meshBasicMaterial
                vertexColors
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default Sail3D;