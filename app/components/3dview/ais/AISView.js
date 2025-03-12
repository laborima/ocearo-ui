import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';

import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat';

// --- Constants ---
const LENGTH_SCALING_FACTOR = 0.7;
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

const predictPosition = (boatData, elapsedTime) => {
  if (boatData.sog != null && boatData.cog != null) {
    const speed = boatData.sog * 0.51444; // Convert knots to m/s
    const deltaX =
      speed *
      elapsedTime *
      Math.sin((boatData.cog * Math.PI) / 180) *
      LENGTH_SCALING_FACTOR;
    const deltaY =
      speed *
      elapsedTime *
      Math.cos((boatData.cog * Math.PI) / 180) *
      LENGTH_SCALING_FACTOR;
    return { deltaX, deltaY };
  }
  return { deltaX: 0, deltaY: 0 };
};

const updatePosition = (boat, targetX, targetY, interpolate = true) => {
  // Apply the scaling factor uniformly.
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
 const radianAngle = targetAngle * Math.PI / 180;
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

  // Define thresholds (in real meters) and convert them into displayed coordinates.
  // For example, we want the boat to appear red if its displayed distance is below 500m
  // and to switch to white only if it goes above 550m.
  const lowerThreshold = 500; // in meters
  const upperThreshold = 550; // in meters
  const displayedLowerThreshold = lowerThreshold * LENGTH_SCALING_FACTOR;
  const displayedUpperThreshold = upperThreshold * LENGTH_SCALING_FACTOR;

  // Define maximum displayed distance (in displayed coordinates)
  const maxDisplayedDistance = 3000 * LENGTH_SCALING_FACTOR;

  useFrame(() => {
    const myPosition = getSignalKValue('navigation.position');
    const mySpeed = getSignalKValue('navigation.speedOverGround'); // in m/s

    if (!myPosition?.latitude || !myPosition?.longitude) return;
    if (!Object.keys(boatRefs.current).length) return;

    const currentTime = performance.now();
    const isFirstFrame = vesselIds.length && !Object.keys(aisData).length;
    const currentData = isFirstFrame ? vesselIds : aisData;

    Object.values(currentData).forEach((boatData) => {
      if (
        boatData.latitude == null ||
        boatData.longitude == null ||
        !boatRefs.current[boatData.mmsi]
      )
        return;

      const boat = boatRefs.current[boatData.mmsi];
      const lastUpdate = boatData.lastUpdate || currentTime;

      // Convert AIS position to local coordinates (in meters)
      const { x: targetX, y: targetY } = relativeLatLonToXY(
        boatData.latitude,
        boatData.longitude,
        myPosition.latitude,
        myPosition.longitude
      );

      // Predict movement if the data is stale
      let deltaX = 0,
        deltaY = 0;
      if (!isFirstFrame && mySpeed != null && mySpeed > 0 && currentTime - lastUpdate > 1000) {
        const elapsedTime = (currentTime - lastUpdate) / 1000;
        ({ deltaX, deltaY } = predictPosition(boatData, elapsedTime));
      }

      // Predicted position (in real meters)
      const predictedX = targetX + deltaX;
      const predictedY = targetY + deltaY;

      // Calculate displayed distance (using the same scaling factor)
      const displayedDistance = Math.sqrt(
        (predictedX * LENGTH_SCALING_FACTOR) ** 2 +
          (predictedY * LENGTH_SCALING_FACTOR) ** 2
      );

      // Make the boat visible only if it is within the displayed zone
      if (displayedDistance > 0 && displayedDistance <= maxDisplayedDistance) {
        boat.visible = true;

        // Apply hysteresis logic to decide which material to use.
        // The boat will swap to red if below the lower threshold
        // and to white if above the upper threshold.
        if (!boat.currentColor) {
          boat.currentColor =
            displayedDistance < displayedLowerThreshold ? 'red' : 'white';
        }
        let targetColor = boat.currentColor;
        if (boat.currentColor === 'red' && displayedDistance > displayedUpperThreshold) {
          targetColor = 'white';
        } else if (boat.currentColor === 'white' && displayedDistance < displayedLowerThreshold) {
          targetColor = 'red';
        }

   /*     console.log(
          `Boat ${boatData.mmsi}: Displayed Distance = ${displayedDistance.toFixed(
            2
          )}, Target Color = ${targetColor}`
        ); */

        // Update position and rotation
        updatePosition(boat, predictedX, predictedY, !isFirstFrame);
        if (boatData.cog != null) {
          updateRotation(boat, boatData.cog, !isFirstFrame);
        } else if (boatData.heading != null) {
          updateRotation(boat, boatData.heading, !isFirstFrame);
        }

        // Instead of continuously updating the color,
        // we swap the entire material between red and white.
        const mesh = findMaterial(boat.children[0]);
        if (mesh) {
          // Create and store red and white materials if they don't already exist.
          if (!boat.redMaterial) {
            boat.redMaterial = mesh.material.clone();
            boat.redMaterial.color.set('red');
          }
          if (!boat.whiteMaterial) {
            boat.whiteMaterial = mesh.material.clone();
            boat.whiteMaterial.color.set('white');
          }
          // Swap the material if needed
          if (targetColor === 'red' && boat.currentMaterial !== 'red') {
            mesh.material = boat.redMaterial;
            boat.currentMaterial = 'red';
            console.log(`Swapped material to red for boat ${boatData.mmsi}`);
          } else if (targetColor === 'white' && boat.currentMaterial !== 'white') {
            mesh.material = boat.whiteMaterial;
            boat.currentMaterial = 'white';
            console.log(`Swapped material to white for boat ${boatData.mmsi}`);
          }
          // Update currentColor for hysteresis tracking
          boat.currentColor = targetColor;
        } else {
          console.warn(`Material not found for boat ${boatData.mmsi}`);
        }
      } else {
        boat.visible = false;
      }
    });
  });

  const boats = useMemo(() => {
    return vesselIds
      .filter(
        (boatData) =>
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
