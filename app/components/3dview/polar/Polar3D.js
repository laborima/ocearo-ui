import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3, CatmullRomCurve3, Group, MathUtils } from 'three';
import polarData from './polar.json';
import { convertSpeed, convertWindSpeed, oBlue, oGreen, oRed, useOcearoContext } from '../../context/OcearoContext';
import { useFrame } from '@react-three/fiber';
const DEG2RAD = Math.PI / 180;

// Utility functions
const radiusScale = (value, timeInMinute) => value * 0.44704 * 60 * timeInMinute * 0.1;

const calculatePosition = (angleDeg, value, timeInMinute) => {
    if (angleDeg === 0 || value === 0) return new Vector3(0, 0, 0);
    
    const angleRad = angleDeg * DEG2RAD;
    const radius = radiusScale(value, timeInMinute);
    return new Vector3(radius * Math.sin(angleRad), 0, -radius * Math.cos(angleRad));
};

const findClosestIndex = (values, target) =>
    values.reduce((closestIdx, current, idx) =>
        Math.abs(current - target) < Math.abs(values[closestIdx] - target) ? idx : closestIdx, 0);

function PolarPlot({ timeInMinute, windSpeed }) {
    const polarRef = useRef(polarData.vpp);

    const calculateDiamondPosition = useMemo(() => (angles, vmgs, windSpeedIdx, timeInMinute) => {
        if (!angles || !vmgs || angles.length <= windSpeedIdx || vmgs.length <= windSpeedIdx) {
            console.error("Invalid angle or VMG data.");
            return null;
        }
        return calculatePosition(angles[windSpeedIdx], vmgs[windSpeedIdx], timeInMinute);
    }, []);

    const createRadialCurve = useMemo(() => (windSpeedIdx, timeInMinute) => {
        const { speeds, angles, beat_angle, beat_vmg, run_angle, run_vmg } = polarRef.current;
        
        if (!speeds || !angles || !speeds.length || !angles.length) {
            console.error("Invalid polar data.");
            return null;
        }

        const interpolate = (start, end, ratio) => start + ratio * (end - start);
        const points = [];

        // 0° to beat_angle: speed from 0 to beat_vmg
        for (let angle = 0; angle <= beat_angle[windSpeedIdx]; angle += 10) {
            points.push(calculatePosition(angle, interpolate(0, beat_vmg[windSpeedIdx], angle / beat_angle[windSpeedIdx]), timeInMinute));
        }

        // beat_angle to run_angle: use existing polar data
        angles.forEach((angle, i) => {
            if (angle > beat_angle[windSpeedIdx] && angle < run_angle[windSpeedIdx]) {
                points.push(calculatePosition(angle, polarRef.current[Math.floor(angle)]?.[windSpeedIdx] || 0, timeInMinute));
            }
        });

        // run_angle to 180°: constant speed of run_vmg
        for (let angle = run_angle[windSpeedIdx]; angle <= 180; angle += 10) {
            points.push(calculatePosition(angle, run_vmg[windSpeedIdx], timeInMinute));
        }

        // Points for the other half (180° to 360°) would be symmetrical, but we're not including them here for simplicity
        return new CatmullRomCurve3(points, true);
    }, []);

    // Use useMemo for curve and diamonds
    const curveData = useMemo(() => {
        const polar = polarRef.current;
        const { speeds, beat_angle, beat_vmg, run_angle, run_vmg } = polar;
        
        if (!speeds || speeds.length === 0) {
            console.error("Speeds data is missing.");
            return { curve: null, beat: null, run: null };
        }

        const closestWindSpeedIdx = findClosestIndex(speeds, windSpeed);
        return {
            curve: createRadialCurve(closestWindSpeedIdx, timeInMinute),
            beat: calculateDiamondPosition(beat_angle, beat_vmg, closestWindSpeedIdx, timeInMinute),
            run: calculateDiamondPosition(run_angle, run_vmg, closestWindSpeedIdx, timeInMinute)
        };
    }, [timeInMinute, windSpeed]);
    


    return (
        <>
            <group>
                {curveData.curve && <Line points={curveData.curve.getPoints(100)} color={oBlue} lineWidth={1} />}
                {curveData.beat && (
                    <mesh position={curveData.beat}>
                        <octahedronGeometry args={[0.2, 0]} />
                        <meshStandardMaterial color={oGreen} />
                    </mesh>
                )}
                {curveData.run && (
                    <mesh position={curveData.run}>
                        <octahedronGeometry args={[0.2, 0]} />
                        <meshStandardMaterial color={oRed} />
                    </mesh>
                )}
            </group>
            <group rotation={[0, 0, -Math.PI]}>
                {curveData.curve && <Line points={curveData.curve.getPoints(100)} color={oBlue} lineWidth={1} />}
                {curveData.beat && (
                    <mesh position={curveData.beat}>
                        <octahedronGeometry args={[0.2, 0]} />
                        <meshStandardMaterial color={oGreen} />
                    </mesh>
                )}
                {curveData.run && (
                    <mesh position={curveData.run}>
                        <octahedronGeometry args={[0.2, 0]} />
                        <meshStandardMaterial color={oRed} />
                    </mesh>
                )}
            </group>
        </>
    );
}

function PolarProjection() {
    const groupRefs = useRef([]);
    const [plots, setPlots] = useState([]);
    const frameCount = useRef(0);
    const previousAngles = useRef([]);
    const { getSignalKValue } = useOcearoContext();

    // Fetch SignalK values
    const appWindAngle = getSignalKValue('environment.wind.angleApparent');
    const trueWindAngle = getSignalKValue('environment.wind.angleTrueGround') || appWindAngle;
    const trueWindSpeed = convertWindSpeed(getSignalKValue('environment.wind.speedOverGround'));
    const sog = getSignalKValue('navigation.speedOverGround') || 3;

    useEffect(() => {
        const initialPlots = Array.from({ length: 10 }, (_, index) => ({
            id: index,
            timeInMinute: 5 * (index + 1),
        }));

        setPlots(initialPlots);
        groupRefs.current = initialPlots.map(() => new Group());
        previousAngles.current = Array(10).fill(0);
    }, []);

    const lerpAngle = (start, end, t) => MathUtils.lerp(start, end, t);

    useFrame(() => {
        frameCount.current += 1;

        setPlots((currentPlots) => {
            const updatedPlots = currentPlots.map((plot, index) => {
                const group = groupRefs.current[index];
                if (!group) return plot;

                const remainingTime = plot.timeInMinute - frameCount.current / 3600;

                if (remainingTime > 0) {
                    const distanceCovered = sog * (plot.timeInMinute * 60);
                    const scaleFactor = Math.max(0, 1 - distanceCovered / (plot.timeInMinute * 600));

                    const prevAngle = previousAngles.current[index];
                    const interpolatedAngle = lerpAngle(prevAngle, trueWindAngle, 0.05);

                    group.rotation.set(0, interpolatedAngle, 0);
                    group.scale.set(scaleFactor, scaleFactor, scaleFactor);

                    previousAngles.current[index] = interpolatedAngle;
                }

                return plot;
            });

            if (updatedPlots[0]?.timeInMinute * sog <= 0.1) {
                const newPlotId = updatedPlots[updatedPlots.length - 1]?.id + 1 || 0;

                updatedPlots.shift();
                updatedPlots.push({
                    id: newPlotId,
                    timeInMinute: 5 * (updatedPlots.length + 1),
                });

                groupRefs.current.shift();
                groupRefs.current.push(new Group());

                previousAngles.current.shift();
                previousAngles.current.push(0);
            }

            return updatedPlots;
        });
    });

    return (
        <>
            {plots.map((plot, index) => (
                <group
                    key={plot.id}
                    ref={(ref) => {
                        if (ref) groupRefs.current[index] = ref;
                    }}
                >
                    <PolarPlot timeInMinute={plot.timeInMinute} windSpeed={trueWindSpeed} />
                </group>
            ))}
        </>
    );
}

export default PolarProjection;