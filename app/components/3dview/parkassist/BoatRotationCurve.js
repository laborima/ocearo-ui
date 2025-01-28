import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const BoatRotationCurve = ({
  rudderAngle,
  sog,
  windSpeed = 0,
  windDirection = 0,
  currentSpeed = 0,
  currentDirection = 0,
  boatWidth = 2,
  color = "white",
  maxCurvePoints = 100
}) => {
  const pathRef = useRef();

  // Helper function to calculate environmental force vector
  const calculateEnvironmentalForce = () => {
    const windRad = THREE.MathUtils.degToRad(windDirection);
    const currentRad = THREE.MathUtils.degToRad(currentDirection);

    const windForceX = Math.cos(windRad) * windSpeed * 0.1;
    const windForceZ = Math.sin(windRad) * windSpeed * 0.1;

    const currentForceX = Math.cos(currentRad) * currentSpeed * 0.2;
    const currentForceZ = Math.sin(currentRad) * currentSpeed * 0.2;

    return {
      x: windForceX + currentForceX,
      z: windForceZ + currentForceZ
    };
  };

  // Generate straight line points with environmental forces
  const generateStraightLinePoints = () => {
    const envForce = calculateEnvironmentalForce();
    const points = [];
    const lineLength = 50; // Length of the projected path

    for (let i = 0; i < maxCurvePoints; i++) {
      const t = (i / maxCurvePoints) * lineLength;
      
      // Start from origin and project forward
      let x = 0;
      let z = -t; // Project along negative Z axis

      // Apply environmental forces with increasing effect over distance
      const distanceEffect = (t / lineLength) * (t / lineLength);
      x += envForce.x * distanceEffect * lineLength;
      z += envForce.z * distanceEffect * lineLength;

      points.push(new THREE.Vector3(x, 0, z));
    }

    return points;
  };

  // Generate curve points considering environmental forces
  const generateCurvePoints = () => {
    // If rudder angle is 0 (or very close to 0), generate straight line
    if (Math.abs(rudderAngle) < 0.1) {
      return generateStraightLinePoints();
    }

    const theta = THREE.MathUtils.degToRad(rudderAngle);
    const baseRadius = sog !== 0 ? sog / Math.tan(theta || 0.01) : 1000;
    const clampedRadius = Math.min(Math.max(Math.abs(baseRadius), boatWidth * 2), 500);

    const envForce = calculateEnvironmentalForce();
    const points = [];

    for (let i = 0; i < maxCurvePoints; i++) {
      const t = i / maxCurvePoints;
      const angle = t * Math.PI;

      // Base curve points
      let x = clampedRadius * (1 - Math.cos(angle)) * 0.1;
      let z = clampedRadius * Math.sin(angle) * 0.1;

      // Apply environmental forces with increasing effect over distance
      x += envForce.x * t * t;
      z += envForce.z * t * t;

      // Ensure minimum turning radius based on boat width
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
  };

  useEffect(() => {
    if (!pathRef.current) return;

    const points = generateCurvePoints();
    pathRef.current.geometry.setFromPoints(points);
  }, [rudderAngle, sog, windSpeed, windDirection, currentSpeed, currentDirection, boatWidth]);

  return (
    <line ref={pathRef}>
      <bufferGeometry />
      <lineBasicMaterial color={color} linewidth={4} />
    </line>
  );
};

export default BoatRotationCurve;