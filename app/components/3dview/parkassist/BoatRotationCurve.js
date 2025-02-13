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
  maxCurvePoints = 100,
}) => {
  // Refs for each line
  const centerLineRef = useRef();
  const portLineRef = useRef();
  const starboardLineRef = useRef();

  /**
   * 1) Calculate environmental force (same as your original).
   */
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

  /**
   * 2) Straight-line points (fallback if rudder is near zero).
   */
  const generateStraightLinePoints = useCallback(() => {
    const envForce = calculateEnvironmentalForce();
    const points = [];
    const lineLength = 50; // arbitrary total length

    for (let i = 0; i < maxCurvePoints; i++) {
      const t = (i / maxCurvePoints) * lineLength;
      // Forward along -Z
      let x = 0;
      let z = -t;

      // Quadratic drift
      const distanceEffect = (t / lineLength) ** 2;
      x += envForce.x * distanceEffect * lineLength;
      z += envForce.z * distanceEffect * lineLength;

      points.push(new THREE.Vector3(x, 0, z));
    }

    return points;
  }, [calculateEnvironmentalForce, maxCurvePoints]);

  /**
   * 3) Primary turning curve (includes rudder angle + environment).
   */
  const generateCurvePoints = useCallback(() => {
    if (Math.abs(rudderAngle) < 0.1) {
      // If rudder angle is tiny, revert to straight line
      return generateStraightLinePoints();
    }

    const theta = THREE.MathUtils.degToRad(rudderAngle);
    const baseRadius = sog !== 0 ? sog / Math.tan(theta || 0.01) : 1000;
    const clampedRadius = Math.min(Math.max(Math.abs(baseRadius), boatWidth * 2), 500);

    const envForce = calculateEnvironmentalForce();
    const points = [];

    for (let i = 0; i < maxCurvePoints; i++) {
      const t = i / maxCurvePoints;
      // We'll just do an arc from 0 to PI
      const angle = t * Math.PI;

      // Basic turning shape (scaled down)
      let x = clampedRadius * (1 - Math.cos(angle)) * 0.1;
      let z = clampedRadius * Math.sin(angle) * 0.1;

      // Add environmental drift
      x += envForce.x * t * t;
      z += envForce.z * t * t;

      // Minimum turn radius
      const currentRadius = Math.sqrt(x * x + z * z);
      const minTurnRadius = boatWidth * 1.5;
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

  /**
   * 4) Offset the curve to produce a "parallel" line in XZ plane.
   *    This is a simplistic approach:
   *    - For each point, compute the direction from (prev -> next).
   *    - The perpendicular in XZ is roughly (-dir.z, dir.x).
   *    - Multiply by offsetDistance and add to the current point.
   */
  const offsetCurvePoints = useCallback((points, offsetDistance) => {
    const offsetPts = [];

    for (let i = 0; i < points.length; i++) {
      // Look at prev & next to get direction
      const prevIndex = i === 0 ? 0 : i - 1;
      const nextIndex = i === points.length - 1 ? points.length - 1 : i + 1;

      const prev = points[prevIndex];
      const next = points[nextIndex];
      const curr = points[i];

      // direction from prev to next
      const dir = new THREE.Vector3().subVectors(next, prev).normalize();

      // In XZ, a perpendicular can be:
      //    normal = (-dir.z, 0, dir.x)
      // If you want the "other" side, you can invert it.
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      // Offset the current point by that normal * offsetDistance
      const offsetPt = new THREE.Vector3().copy(curr).addScaledVector(normal, offsetDistance);
      offsetPts.push(offsetPt);
    }
    return offsetPts;
  }, []);

  /**
   * 5) Update the three lines (center, port, starboard) on each render.
   */
  useEffect(() => {
    if (!centerLineRef.current || !portLineRef.current || !starboardLineRef.current) return;

    //  Main curve points
    const mainPoints = generateCurvePoints();

    //  Offset left/right by half the boat width (adjust if you prefer a different spacing)
    const leftPoints = offsetCurvePoints(mainPoints, -boatWidth * 0.5);
    const rightPoints = offsetCurvePoints(mainPoints, boatWidth * 0.5);

    // Assign geometry
    centerLineRef.current.geometry.setFromPoints(mainPoints);
    portLineRef.current.geometry.setFromPoints(leftPoints);
    starboardLineRef.current.geometry.setFromPoints(rightPoints);
  }, [generateCurvePoints, offsetCurvePoints, boatWidth]);

  return (
    <>
      {/* Center line */}
      <line ref={centerLineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="blue" linewidth={3} />
      </line>

      {/* Port line (offset) */}
      <line ref={portLineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="red" linewidth={3} />
      </line>

      {/* Starboard line (offset) */}
      <line ref={starboardLineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="yellow" linewidth={3} />
      </line>
    </>
  );
};

export default BoatRotationCurve;
