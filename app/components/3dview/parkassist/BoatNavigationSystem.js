import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

import { oBlue, oRed, oYellow } from '../../context/OcearoContext';

const CONSTANTS = {
  MOBILE_TEMPLATE: {
    COLOR: oYellow, // oYellow equivalent
    WIDTH_FACTOR: 0.8,
    LENGTH_FACTOR: 2.5,
    MAX_LENGTH_MULTIPLIER: 3.5,
    CURVATURE_SENSITIVITY: {
      RUDDER: 1.5,
      WIND: 0.25,
      CURRENT: 0.3,
      LEEWAY: 0.15,
      DRIFT: 0.1,
    },
  },
  NEUTRAL_TEMPLATE: {
    COLOR: oBlue, // oBlue equivalent
    WIDTH_FACTOR: 0.7,
    LENGTH_FACTOR: 0.9,
  },
  ANTICOLLISION_TEMPLATE: {
    COLOR: oRed, // oRed equivalent
    WIDTH_FACTOR: 1.5,
    LENGTH_FACTOR: 0.8,
  },
};

const BoatNavigationSystem = ({
  rudderAngle = 0,
  sog = 5,
  boatWidth = 2,
  windSpeed = 0,
  windDirection = 0,
  currentSpeed = 0,
  currentDirection = 0,
  leewayAngle = 0,
  driftFactor = 0,
  maxCurvePoints = 50,
}) => {
  const mobileTemplateRef = useRef();
  const neutralTemplateRef = useRef();
  const antiCollisionTemplateRef = useRef();

  const calculateEnvironmentalForce = useCallback(() => {
    const toRadians = angle => THREE.MathUtils.degToRad(angle);
    const windRad = toRadians(windDirection);
    const leewayRad = toRadians(leewayAngle);
    const windForceX =
      Math.cos(windRad + leewayRad) *
      windSpeed *
      CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.WIND;
    const windForceZ =
      Math.sin(windRad + leewayRad) *
      windSpeed *
      CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.WIND;

    const currentRad = toRadians(currentDirection);
    const currentForceX =
      Math.cos(currentRad) *
      currentSpeed *
      CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.CURRENT;
    const currentForceZ =
      Math.sin(currentRad) *
      currentSpeed *
      CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.CURRENT;

    return {
      x: (windForceX + currentForceX) * (1 + driftFactor * CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.DRIFT),
      z: (windForceZ + currentForceZ) * (1 + driftFactor * CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.DRIFT),
    };
  }, [windSpeed, windDirection, currentSpeed, currentDirection, leewayAngle, driftFactor]);

  const generateMobileUShape = useCallback(() => {
    const maxLength = boatWidth * CONSTANTS.MOBILE_TEMPLATE.MAX_LENGTH_MULTIPLIER;
    const L = Math.min(
      boatWidth * 2 * CONSTANTS.MOBILE_TEMPLATE.LENGTH_FACTOR,
      maxLength
    );
    const numPoints = maxCurvePoints;
    let centralPoints = [];
    const envForce = calculateEnvironmentalForce();
    const lateralForce = envForce.x * 1.5;

    if (Math.abs(rudderAngle) < 0.1) {
      const baseCurve = lateralForce * 0.5;
      const turnRadius = Math.max(
        boatWidth / Math.tan(THREE.MathUtils.degToRad(5 + Math.abs(baseCurve))),
        boatWidth * 0.5
      );
      const deltaAngle = L / turnRadius;
      const center = new THREE.Vector2(baseCurve > 0 ? turnRadius : -turnRadius, 0);
      const startAngle = baseCurve > 0 ? Math.PI : 0;

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const angle = startAngle + (baseCurve > 0 ? deltaAngle : -deltaAngle) * t;
        const x = center.x + turnRadius * Math.cos(angle);
        const z = center.y + turnRadius * Math.sin(angle);
        centralPoints.push(new THREE.Vector3(x, 0, z));
      }
    } else {
      const effectiveRudder = THREE.MathUtils.clamp(
        Math.abs(rudderAngle) * 1.2 + lateralForce,
        0,
        85
      );
      const turnRadius = boatWidth / Math.tan(
        THREE.MathUtils.degToRad(effectiveRudder * CONSTANTS.MOBILE_TEMPLATE.CURVATURE_SENSITIVITY.RUDDER)
      );
      const deltaAngle = THREE.MathUtils.clamp(L / turnRadius, 0, Math.PI * 1.25);

      if (rudderAngle > 0) {
        const center = new THREE.Vector2(turnRadius, 0);
        const startAngle = Math.PI;
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const angle = THREE.MathUtils.lerp(startAngle, startAngle + deltaAngle, t);
          const x = center.x + turnRadius * Math.cos(angle);
          const z = center.y + turnRadius * Math.sin(angle);
          centralPoints.push(new THREE.Vector3(x, 0, z));
        }
      } else {
        const center = new THREE.Vector2(-turnRadius, 0);
        const startAngle = 0;
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const angle = THREE.MathUtils.lerp(startAngle, startAngle - deltaAngle, t);
          const x = center.x + turnRadius * Math.cos(angle);
          const z = center.y + turnRadius * Math.sin(angle);
          centralPoints.push(new THREE.Vector3(x, 0, z));
        }
      }
    }

    const offsetPoints = centralPoints.map((point, index) => {
      let tangent;
      if (index === 0) {
        tangent = centralPoints[1].clone().sub(point);
      } else {
        tangent = point.clone().sub(centralPoints[index - 1]);
      }
      tangent.normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const offsetDistance = boatWidth / 1.8;

      return {
        left: point.clone().add(normal.multiplyScalar(offsetDistance)),
        right: point.clone().sub(normal.multiplyScalar(offsetDistance))
      };
    });

    const uPoints = [
      ...offsetPoints.map(p => p.left),
      offsetPoints[offsetPoints.length - 1].right,
      ...offsetPoints.reverse().map(p => p.right)
    ];

    return uPoints;
  }, [boatWidth, rudderAngle, maxCurvePoints, calculateEnvironmentalForce]);

  const generateUShape = useCallback(
    (templateType) => {
      if (templateType === 'MOBILE_TEMPLATE') {
        return generateMobileUShape();
      }
      
      const config = CONSTANTS[templateType];
      const baseLength = boatWidth * 2 * config.LENGTH_FACTOR;
      const width = boatWidth * config.WIDTH_FACTOR;
      let points = [];
      const segments = Math.floor(maxCurvePoints / 4);

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        points.push(new THREE.Vector3(-width / 2, 0, -baseLength * t));
      }
      points.push(new THREE.Vector3(width / 2, 0, -baseLength));
      for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        points.push(new THREE.Vector3(width / 2, 0, -baseLength * t));
      }
      return points;
    },
    [boatWidth, maxCurvePoints, generateMobileUShape]
  );

  useEffect(() => {
    if (!mobileTemplateRef.current || !neutralTemplateRef.current || !antiCollisionTemplateRef.current) return;

    mobileTemplateRef.current.geometry.setFromPoints(generateUShape('MOBILE_TEMPLATE'));
    neutralTemplateRef.current.geometry.setFromPoints(generateUShape('NEUTRAL_TEMPLATE'));
    antiCollisionTemplateRef.current.geometry.setFromPoints(generateUShape('ANTICOLLISION_TEMPLATE'));
  }, [generateUShape]);

  return (
    <>
      <line ref={mobileTemplateRef}>
        <bufferGeometry />
        <lineBasicMaterial 
            color={CONSTANTS.MOBILE_TEMPLATE.COLOR} 
            linewidth={3} 
            transparent={true} 
            opacity={0.8} 
        />
      </line>
      <line ref={neutralTemplateRef}>
        <bufferGeometry />
        <lineBasicMaterial 
            color={CONSTANTS.NEUTRAL_TEMPLATE.COLOR} 
            linewidth={2} 
            transparent={true} 
            opacity={0.4} 
        />
      </line>
      <line ref={antiCollisionTemplateRef}>
        <bufferGeometry />
        <lineBasicMaterial 
            color={CONSTANTS.ANTICOLLISION_TEMPLATE.COLOR} 
            linewidth={4} 
            transparent={true} 
            opacity={0.6} 
        />
      </line>
    </>
  );
};

export default BoatNavigationSystem;