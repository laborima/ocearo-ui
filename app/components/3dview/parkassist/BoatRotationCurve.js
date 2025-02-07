import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const BoatRotationCurve = ({
  rudderAngle,
  sog,
  windSpeed = 0,
  windDirection = 0,
  currentSpeed = 0,
  currentDirection = 0,
  boatWidth = 2,
  color = 'white',
  maxCurvePoints = 100,
}) => {
  const pathRef = useRef();

  // Calculate environmental force based on wind and current parameters.
  const calculateEnvironmentalForce = useCallback(() => {
    const windRad = THREE.MathUtils.degToRad(windDirection);
    const currentRad = THREE.MathUtils.degToRad(currentDirection);

    const windForceX = Math.cos(windRad) * windSpeed * 0.1;
    const windForceZ = Math.sin(windRad) * windSpeed * 0.1;

    const currentForceX = Math.cos(currentRad) * currentSpeed * 0.2;
    const currentForceZ = Math.sin(currentRad) * currentSpeed * 0.2;

    return {
      x: windForceX + currentForceX,
      z: windForceZ + currentForceZ,
    };
  }, [windSpeed, windDirection, currentSpeed, currentDirection]);

  // Generate points for a straight-line path (used when the rudder angle is nearly 0)
  const generateStraightLinePoints = useCallback(() => {
    const envForce = calculateEnvironmentalForce();
    const points = [];
    const lineLength = 50; // Total length of the projected path

    for (let i = 0; i < maxCurvePoints; i++) {
      const t = (i / maxCurvePoints) * lineLength;
      // Start at the origin and project along negative Z
      let x = 0;
      let z = -t;

      // Increase the effect of the environmental force with distance (quadratic effect)
      const distanceEffect = (t / lineLength) ** 2;
      x += envForce.x * distanceEffect * lineLength;
      z += envForce.z * distanceEffect * lineLength;

      points.push(new THREE.Vector3(x, 0, z));
    }

    return points;
  }, [calculateEnvironmentalForce, maxCurvePoints]);

  // Generate curve points that simulate the boat's turning path,
  // modified by the rudder angle and environmental forces.
  const generateCurvePoints = useCallback(() => {
    // If the rudder angle is nearly 0, fall back to a straight line.
    if (Math.abs(rudderAngle) < 0.1) {
      return generateStraightLinePoints();
    }

    // Calculate the turning radius based on the rudder angle and speed.
    const theta = THREE.MathUtils.degToRad(rudderAngle);
    // Use a fallback small angle value to avoid division by zero.
    const baseRadius = sog !== 0 ? sog / Math.tan(theta || 0.01) : 1000;
    // Clamp the radius to a sensible range based on boat width.
    const clampedRadius = Math.min(Math.max(Math.abs(baseRadius), boatWidth * 2), 500);

    const envForce = calculateEnvironmentalForce();
    const points = [];

    for (let i = 0; i < maxCurvePoints; i++) {
      const t = i / maxCurvePoints;
      const angle = t * Math.PI; // Vary the angle over the curve

      // Base curve calculation (scaled down for visualization)
      let x = clampedRadius * (1 - Math.cos(angle)) * 0.1;
      let z = clampedRadius * Math.sin(angle) * 0.1;

      // Apply environmental forces with an increasing effect over distance.
      x += envForce.x * t * t;
      z += envForce.z * t * t;

      // Ensure a minimum turning radius based on boat width.
      const minTurnRadius = boatWidth * 1.5;
      const currentRadius = Math.sqrt(x * x + z * z);
      if (currentRadius < minTurnRadius) {
        const scale = minTurnRadius / currentRadius;
        x *= scale;
        z *= scale;
      }

      points.push(new THREE.Vector3(x, 0, z));
    }

    return points;
  }, [
    rudderAngle,
    sog,
    boatWidth,
    maxCurvePoints,
    calculateEnvironmentalForce,
    generateStraightLinePoints,
  ]);

  // Update the geometry of the path whenever the curve changes.
  useEffect(() => {
    if (!pathRef.current) return;

    const points = generateCurvePoints();
    pathRef.current.geometry.setFromPoints(points);
  }, [generateCurvePoints]);

  return (
    <line ref={pathRef}>
      <bufferGeometry />
      <lineBasicMaterial color={color} linewidth={4} />
    </line>
  );
};

export default BoatRotationCurve;
