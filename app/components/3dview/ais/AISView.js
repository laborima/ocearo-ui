import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';

import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat';

// --- Constants ---
const LENGTH_SCALING_FACTOR = 0.1;
const EARTH_RADIUS_METERS = 6371000;

// --- Helper Functions ---
const findMaterial = (obj) => {
  if (obj.material) return obj;
  for (const child of obj.children) {
    const found = findMaterial(child);
    if (found) return found;
  }
  return null;
};

const relativeLatLonToXY = (lat, lon, homeLat, homeLon) => {
  const dLat = (lat - homeLat) * (Math.PI / 180);
  const dLon = (lon - homeLon) * (Math.PI / 180);
  const x = EARTH_RADIUS_METERS * dLon * Math.cos(homeLat * (Math.PI / 180));
  const y = EARTH_RADIUS_METERS * dLat;
  return { x, y };
};

const relativeAngle = (angle1, angle2) => {
  const delta = angle2 - angle1;
  return ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
};

const updateColor = (mesh, targetColor) => {
  if (!mesh?.material?.color) {
    console.warn("Mesh or its material is missing. Unable to update color.");
    return;
  }
  const currentColor = mesh.material.color.getHexString();
  const newColor = new Color(targetColor).getHexString();
  if (currentColor !== newColor) {
    mesh.material.color.set(targetColor);
  }
};

const predictPosition = (boatData, elapsedTime) => {
  if (boatData.sog != null && boatData.cog != null) {
    const speed = boatData.sog * 0.51444; // Convert knots to m/s
    const deltaX = speed * elapsedTime * Math.sin(boatData.cog * Math.PI / 180); // Ensure cog is in radians
    const deltaY = speed * elapsedTime * Math.cos(boatData.cog * Math.PI / 180);
    return { deltaX, deltaY };
  }
  return { deltaX: 0, deltaY: 0 };
};

const updatePosition = (boat, targetX, targetY, interpolate = true) => {
  const scaledX = -targetX * LENGTH_SCALING_FACTOR;
  const scaledZ = targetY * LENGTH_SCALING_FACTOR;
  if (interpolate) {
    boat.position.x += (scaledX - boat.position.x) * 0.1;
    boat.position.z += (scaledZ - boat.position.z) * 0.1;
  } else {
    boat.position.set(scaledX, 0, scaledZ);
  }
};

const updateRotation = (boat, targetAngle, interpolate = true) => {
  const radianAngle = targetAngle * Math.PI / 180; // Convert degrees to radians
  if (interpolate) {
    boat.children[0].rotation.y += (radianAngle - boat.children[0].rotation.y) * 0.1;
  } else {
    boat.children[0].rotation.y = radianAngle;
  }
};

// --- Main Component ---
const AISView = () => {
  const { aisData, vesselIds } = useAIS();
  const boatRefs = useRef({});
  const { getSignalKValue } = useOcearoContext();

  useFrame(() => {
    const myPosition = getSignalKValue('navigation.position');
    const courseOverGround = getSignalKValue('navigation.courseOverGroundTrue'); // In degrees
    const mySpeed = getSignalKValue('navigation.speedOverGround'); // in m/s

    if (!myPosition?.latitude || !myPosition?.longitude) return;
    if (!Object.keys(boatRefs.current).length) return;

    const currentTime = performance.now();
    const isFirstFrame = vesselIds.length && !Object.keys(aisData).length;
    const currentData = isFirstFrame ? vesselIds : aisData;

    Object.values(currentData).forEach((boatData) => {
      if (boatData.latitude == null || boatData.longitude == null || !boatRefs.current[boatData.mmsi]) return;

      const boat = boatRefs.current[boatData.mmsi];
      const lastUpdate = boatData.lastUpdate || currentTime;

      // Convert AIS boat's position to local coordinates
      const { x: targetX, y: targetY } = relativeLatLonToXY(
        boatData.latitude,
        boatData.longitude,
        myPosition.latitude,
        myPosition.longitude
      );

      // Predict movement if data is stale
      let deltaX = 0, deltaY = 0;
      if (!isFirstFrame && mySpeed != null && mySpeed > 0 && currentTime - lastUpdate > 1000) {
        const elapsedTime = (currentTime - lastUpdate) / 1000;
        ({ deltaX, deltaY } = predictPosition(boatData, elapsedTime));
      }

      // Calculate predicted distance (Euclidean in meters)
      const predictedX = targetX + deltaX;
      const predictedY = targetY + deltaY;
      const distance = Math.sqrt(predictedX ** 2 + predictedY ** 2);

      if (distance > 0 && distance <= 3000) {
        boat.visible = true;

        // Update position and rotation based on prediction
        updatePosition(boat, predictedX, predictedY, !isFirstFrame);
        if (boatData.cog != null) {
          updateRotation(boat, boatData.cog, !isFirstFrame);
        } else if (boatData.heading != null) {
          updateRotation(boat, boatData.heading, !isFirstFrame);
        }

        // Update color based on real-time distance
        const mesh = findMaterial(boat.children[0]);
        if (mesh) {
          const targetColor = distance < 500 ? 'red' : 'white';

       //   console.log(distance+" m"+" "+targetColor+" "+boatData.name);
          updateColor(mesh, targetColor);
        }
      } else {
        boat.visible = false;
      }
    });
  });

  const boats = useMemo(() => {
    return vesselIds
      .filter((boatData) => 
        boatData.mmsi &&
        !boatData.mmsi.startsWith('urn:mrn:signalk:uuid:') &&
        !boatData.mmsi.startsWith('227925790') &&
        !boatData.mmsi.startsWith('urn:mrn:imo:mmsi:230035780')
      )
      .map((boatData) => (
        <AISBoat
          key={boatData.mmsi}
          ref={(el) => (boatRefs.current[boatData.mmsi] = el)}
          position={[0, 0, 0]}
          visible={false}
          boatData={boatData}
        />
      ));
  }, [vesselIds]);

  return <>{boats}</>;
};

export default AISView;