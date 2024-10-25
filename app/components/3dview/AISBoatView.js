/*    // Fetch AIS data from SignalK
    const fetchAisData = () => {
      const aisTargets = getSignalKValue('ais.targets'); // Get all AIS targets
      if (aisTargets) {
        const formattedAisData = Object.values(aisTargets).map(target => ({
          lat: target.position.latitude,
          lon: target.position.longitude,
          length: target.dimensions ? target.dimensions.length : 30, // Default to 30m length if not provided
          width: target.dimensions ? target.dimensions.beam : 10, // Default to 10m width if not provided
          cog: target.courseOverGroundTrue * (180 / Math.PI), // Convert to degrees
          sog: target.speedOverGround || 0, // Speed over ground
        }));
        setAisData(formattedAisData);
      }
    };
    
    TODO : https://github.com/KEGustafsson/signalk-vessels-to-ais/blob/master/index.js

    // Call the fetch function to get AIS data
    fetchAisData();
    */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useOcearoContext } from '../context/OcearoContext';
import useBoat from './helpers/BoatLoader';


const AISBoatView = ({ sailBoatRef }) => {
  const { scene } = useThree();
  const { getSignalKValue } = useOcearoContext();
  const [aisData, setAisData] = useState([]);
  
  // Helper to determine boat ID based on length
  const getBoatId = (length) => {
    if (length <= 20) return 'optimist';
    if (length <= 40) return 'sailboat';
    return 'ship';
  };

  // Fetch AIS data from SignalK (if enabled)
  useEffect(() => {
    // Sample AIS data
    const sampleAisData = [
      { lat: 37.7749, lon: -122.4195, length: 10, width: 10, cog: 45, sog: 15 },
      { lat: 37.7750, lon: -122.4196, length: 40, width: 12, cog: 90, sog: 10 },
      { lat: 37.7755, lon: -122.4199, length: 50, width: 8, cog: 270, sog: 12 },
    ];
    setAisData(sampleAisData);
  }, []);

  return (
    <>
      {aisData.map((boatData, index) => (
        <AISBoat
          key={index}
          boatData={boatData}
          sailBoatRef={sailBoatRef}
          getBoatId={getBoatId}
          scene={scene}
        />
      ))}
    </>
  );
};

// AISBoat Component
const AISBoat = ({ boatData, sailBoatRef, getBoatId, scene }) => {
  const { lat, lon, length, cog, sog } = boatData;
  const boatId = getBoatId(length);

  // Load the boat model with `useBoat`
  const boatMesh = useBoat(boatId, length , null, false);

  // Helper to convert lat/lon to relative 3D coordinates
  const latLonToXY = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const x = R * dLon * Math.cos(lat1 * Math.PI / 180);
    const y = R * dLat;
    return { x, y };
  };

  // Set boat position and orientation
  const { x, y } = latLonToXY(37.7756, -122.4194, lat, lon);
  if (boatMesh) {
    boatMesh.position.set(x, 0, y);
    boatMesh.rotation.y = (-cog * Math.PI) / 180;
    boatMesh.cog = cog;
    boatMesh.sog = sog;

    // Add boat mesh to the scene
    scene.add(boatMesh);
  }

  return null; // This component only sets up the 3D objects in the scene, no DOM rendering.
};

export default AISBoatView;