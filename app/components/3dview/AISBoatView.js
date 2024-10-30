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
    if (length <= 2) return 'windsurf';
    if (length <= 4) return 'optimist';
    if (length <= 15) return 'sailboat';
    return 'ship';
  };

  // Fetch AIS data from SignalK (if enabled)
  useEffect(() => {
    // Sample AIS data
    const sampleAisData = [
      { lat: 37.7749, lon: -122.4195, length: 3, cog: 45, sog: 15 },
      { lat: 37.7750, lon: -122.4196, length: 8, cog: 90, sog: 10 },
      { lat: 37.7755, lon: -122.4199, length: 20, cog: 270, sog: 12 },
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

/*
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import Client from '@signalk/client';
import loadBoat from './helpers/BoatLoader'; // Assuming loadBoat is the refactored version from the previous task

const AISBoatView = ({ sailBoatRef }) => {
  const { scene } = useThree();
  const [aisData, setAisData] = useState({});
  const clientRef = useRef(null);

  // Function to determine the boat ID based on its length
  const getBoatId = (length) => {
    if (length <= 2) return 'windsurf';
    if (length <= 4) return 'optimist';
    if (length <= 15) return 'sailboat';
    return 'ship';
  };

  // Fetch and update AIS data based on delta updates
  const fetchAisData = (delta) => {
    if (!delta || !delta.updates) return;

    const updatedAisData = { ...aisData };

    delta.updates.forEach((update) => {
      const vesselData = delta.context;
      let boatName = vesselData; // Default to vessel context name

      const aisTarget = {
        name: boatName,
        lat: null,
        lon: null,
        length: 30,
        width: 10,
        cog: 0,
        sog: 0,
      };

      update.values.forEach((value) => {
        switch (value.path) {
          case 'name':
            boatName = value.value;
            aisTarget.name = boatName || vesselData;
            break;
          case 'navigation.position':
            aisTarget.lat = value.value.latitude;
            aisTarget.lon = value.value.longitude;
            break;
          case 'navigation.courseOverGroundTrue':
            aisTarget.cog = value.value * (180 / Math.PI);
            break;
          case 'navigation.speedOverGround':
            aisTarget.sog = value.value;
            break;
          case 'design.length':
            aisTarget.length = value.value.overall || 30;
            break;
          case 'design.beam':
            aisTarget.width = value.value || 10;
            break;
          default:
            break;
        }
      });

      if (aisTarget.lat && aisTarget.lon && aisTarget.name) {
        updatedAisData[aisTarget.name] = aisTarget;
      }
    });

    setAisData(updatedAisData);
  };

  // Establish connection with SignalK client and subscribe to updates
  useEffect(() => {
    const connectSignalKClient = async () => {
      try {
        const client = new Client({
          hostname: 'demo.signalk.org',
          port: 443,
          useTLS: true,
          reconnect: true,
          autoConnect: false,
          notifications: false,
          subscriptions: [
            {
              context: "vessels.*",
              subscribe: [
                { path: "name" },
                { path: "navigation.position" },
                { path: "navigation.speedOverGround" },
                { path: "navigation.courseOverGroundTrue" },
                { path: "design.length" },
                { path: "design.beam" },
              ],
            },
          ],
        });

        clientRef.current = client;
        await client.connect();
        client.on('delta', fetchAisData);
      } catch (error) {
        console.error('Failed to connect to SignalK:', error);
      }
    };

    connectSignalKClient();

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      {Object.values(aisData).map((boatData) => (
        <AISBoat
          key={boatData.name}
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
const AISBoat = ({ boatData, getBoatId, scene }) => {
  const { name, lat, lon, length, cog } = boatData;
  const boatId = getBoatId(length);

  useEffect(() => {
    // Check for existing boat mesh in the scene by name
    let boatMesh = scene.getObjectByName(name);

    // If the boat is not found, load and add it to the scene
    if (!boatMesh) {
      loadBoat(boatId, length, null, false, (loadedBoat) => {
        boatMesh = loadedBoat;
        boatMesh.name = name;
        scene.add(boatMesh);
        updateBoatPosition(boatMesh, lat, lon, cog);
      });
    } else {
      // Update position and rotation of the existing boat mesh
      updateBoatPosition(boatMesh, lat, lon, cog);
    }

    return () => {
      // Cleanup: remove the boat from the scene when component unmounts
      if (boatMesh) {
        scene.remove(boatMesh);
      }
    };
  }, [lat, lon, cog, length, scene, name, boatId]);

  // Update the boat's position based on latitude and longitude
  const updateBoatPosition = (boatMesh, lat, lon, cog) => {
    const { x, y } = latLonToXY(lat, lon);
    boatMesh.position.set(x, 0, y);
    boatMesh.rotation.y = (-cog * Math.PI) / 180;
  };

  // Convert latitude and longitude to x, y coordinates
  const latLonToXY = (lat, lon) => {
    const R = 6371000; // Earth radius in meters
    const homeLat = 0; // Replace with actual home latitude
    const homeLon = 0; // Replace with actual home longitude
    const dLat = (lat - homeLat) * (Math.PI / 180);
    const dLon = (lon - homeLon) * (Math.PI / 180);
    const x = R * dLon * Math.cos(homeLat * Math.PI / 180);
    const y = R * dLat;
    return { x, y };
  };

  return null;
};

export default AISBoatView;*/
