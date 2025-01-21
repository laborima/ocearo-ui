import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Line } from '@react-three/drei';
import { Vector3, CatmullRomCurve3, Group, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import polarData from './polar.json';
import { 
    convertSpeed, 
    convertWindSpeed, 
    oBlue, 
    oGreen, 
    oRed, 
    useOcearoContext 
} from '../../context/OcearoContext';

// Constants
const DEG2RAD = Math.PI / 180;
const ROTATION_INTERPOLATION_FACTOR = 0.05;
const SOG_SMOOTHING_FACTOR = 0.1;
const DEFAULT_SOG = 3;
const ANGLE_INCREMENT = 10;
const SPHERE_SIZE = 0.4;
const SPHERE_SEGMENTS = 32;
const DEFAULT_LINE_WIDTH = 1;
const PLOTS_COUNT = 10;
const FRAME_TO_MINUTE_RATIO = 3600;

// Utility functions
const radiusScale = (value, timeInMinute) => value * 0.44704 * 60 * timeInMinute * 0.1;

const calculatePosition = (angleDeg, value, timeInMinute) => {
    if (!angleDeg || !value) return new Vector3(0, 0, 0);
    
    const angleRad = angleDeg * DEG2RAD;
    const radius = radiusScale(value, timeInMinute);
    return new Vector3(
        radius * Math.sin(angleRad), 
        0, 
        -radius * Math.cos(angleRad)
    );
};

const findClosestIndex = (values, target) => {
    if (!values?.length) return 0;
    return values.reduce((closestIdx, current, idx) => 
        Math.abs(current - target) < Math.abs(values[closestIdx] - target) ? idx : closestIdx, 0);
};

// Diamond marker component
const DiamondMarker = ({ position, color }) => {
    if (!position) return null;
    
    return (
        <mesh position={position}>
            <sphereGeometry args={[SPHERE_SIZE, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

// Polar curve component
const PolarCurve = ({ points, color }) => {
    if (!points?.length) return null;
    
    return <Line points={points} color={color} lineWidth={DEFAULT_LINE_WIDTH} />;
};

function PolarPlot({ timeInMinute, windSpeed }) {
    const polarRef = useRef(polarData.vpp);

    const calculateDiamondPosition = useCallback((angles, vmgs, windSpeedIdx, timeInMinute) => {
        if (!angles?.length || !vmgs?.length || angles.length <= windSpeedIdx || vmgs.length <= windSpeedIdx) {
            console.warn("Invalid angle or VMG data");
            return null;
        }
        return calculatePosition(angles[windSpeedIdx], vmgs[windSpeedIdx], timeInMinute);
    }, []);

    const createRadialCurve = useCallback((windSpeedIdx, timeInMinute) => {
        const { speeds, angles, beat_angle, beat_vmg, run_angle, run_vmg } = polarRef.current;
        
        if (!speeds?.length || !angles?.length) {
            console.warn("Invalid polar data");
            return null;
        }

        const interpolate = (start, end, ratio) => start + ratio * (end - start);
        const points = [];

        // Generate points for different angle ranges
        const generatePoints = (startAngle, endAngle, getSpeed) => {
            for (let angle = startAngle; angle <= endAngle; angle += ANGLE_INCREMENT) {
                points.push(calculatePosition(angle, getSpeed(angle), timeInMinute));
            }
        };

        // 0° to beat_angle
        generatePoints(0, beat_angle[windSpeedIdx], 
            angle => interpolate(0, beat_vmg[windSpeedIdx], angle / beat_angle[windSpeedIdx]));

        // beat_angle to run_angle
        angles.forEach(angle => {
            if (angle > beat_angle[windSpeedIdx] && angle < run_angle[windSpeedIdx]) {
                const speed = polarRef.current[Math.floor(angle)]?.[windSpeedIdx] || 0;
                points.push(calculatePosition(angle, speed, timeInMinute));
            }
        });

        // run_angle to 180°
        generatePoints(run_angle[windSpeedIdx], 180, 
            () => run_vmg[windSpeedIdx]);

        return new CatmullRomCurve3(points, true);
    }, []);

    const curveData = useMemo(() => {
        const polar = polarRef.current;
        if (!polar?.speeds?.length) {
            console.warn("Invalid polar data structure");
            return { curve: null, beat: null, run: null };
        }

        const windSpeedIdx = findClosestIndex(polar.speeds, windSpeed);
        const curve = createRadialCurve(windSpeedIdx, timeInMinute);
        
        return {
            curve,
            beat: calculateDiamondPosition(polar.beat_angle, polar.beat_vmg, windSpeedIdx, timeInMinute),
            run: calculateDiamondPosition(polar.run_angle, polar.run_vmg, windSpeedIdx, timeInMinute)
        };
    }, [timeInMinute, windSpeed, calculateDiamondPosition, createRadialCurve]);

    const renderPolarGroup = (rotation = 0) => (
        <group rotation={[0, 0, rotation]}>
            {curveData.curve && (
                <PolarCurve 
                    points={curveData.curve.getPoints(100)} 
                    color={oBlue} 
                />
            )}
            <DiamondMarker position={curveData.beat} color={oGreen} />
            <DiamondMarker position={curveData.run} color={oRed} />
        </group>
    );

    return (
        <>
            {renderPolarGroup(0)}
            {renderPolarGroup(-Math.PI)}
        </>
    );
}

function PolarProjection() {
    const groupRefs = useRef([]);
    const [plots, setPlots] = useState([]);
    const frameCount = useRef(0);
    const previousAngles = useRef([]);
    const lastSOG = useRef(DEFAULT_SOG);
    const { getSignalKValue } = useOcearoContext();

    const appWindAngle = getSignalKValue('environment.wind.angleApparent');
    const trueWindSpeed = convertWindSpeed(getSignalKValue('environment.wind.speedOverGround'));
    const sog = getSignalKValue('navigation.speedOverGround') || DEFAULT_SOG;

    useEffect(() => {
        const initialPlots = Array.from({ length: PLOTS_COUNT }, (_, index) => ({
            id: index,
            timeInMinute: 5 * (index + 1),
        }));

        setPlots(initialPlots);
        groupRefs.current = initialPlots.map(() => new Group());
        previousAngles.current = Array(PLOTS_COUNT).fill(0);
    }, []);

    useFrame((_, delta) => {
        frameCount.current += 1;
        lastSOG.current = MathUtils.lerp(lastSOG.current, sog, SOG_SMOOTHING_FACTOR);
        
        setPlots(currentPlots => 
            currentPlots.map((plot, index) => {
                const group = groupRefs.current[index];
                if (!group) return plot;

                const remainingTime = plot.timeInMinute - frameCount.current / FRAME_TO_MINUTE_RATIO;

                if (remainingTime > 0) {
                    const prevAngle = previousAngles.current[index];
                    const interpolatedAngle = MathUtils.lerp(
                        prevAngle, 
                        appWindAngle, 
                        ROTATION_INTERPOLATION_FACTOR
                    );
                    
                    group.rotation.set(0, interpolatedAngle, 0);
                    previousAngles.current[index] = interpolatedAngle;
                }

                return plot;
            })
        );
    });

    return (
        <>
            {plots.map((plot, index) => (
                <group
                    key={plot.id}
                    ref={ref => {
                        if (ref) groupRefs.current[index] = ref;
                    }}
                >
                    <PolarPlot 
                        timeInMinute={plot.timeInMinute} 
                        windSpeed={trueWindSpeed} 
                    />
                </group>
            ))}
        </>
    );
}

export default PolarProjection;