import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { Text } from '@react-three/drei';

import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat';
import configService from '../../settings/ConfigService';

// --- Constants ---
const EARTH_RADIUS_METERS = 6371000;

// --- Helper Functions ---
/**
 * Find a mesh with material in an object hierarchy
 * @param {Object} obj - The 3D object to search
 * @returns {Object|null} - The object with material or null if not found
 */
const findMaterial = (obj) => {
  if (obj.material) return obj;
  for (const child of obj.children) {
    const found = findMaterial(child);
    if (found) return found;
  }
  return null;
};

/**
 * Convert latitude/longitude to XY coordinates relative to a home position
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} homeLat - Reference latitude in degrees
 * @param {number} homeLon - Reference longitude in degrees
 * @returns {Object} - {x, y} coordinates in meters
 */
const relativeLatLonToXY = (lat, lon, homeLat, homeLon) => {
  // Skip invalid coordinates
  if (lat === undefined || lon === undefined || 
      homeLat === undefined || homeLon === undefined) {
    return { x: 0, y: 0 };
  }
  
  const dLat = (lat - homeLat) * (Math.PI / 180);
  const dLon = (lon - homeLon) * (Math.PI / 180);
  
  // Calculate position with X inverted for correct port/starboard orientation
  // Maritime convention: positive X is to the right, but Three.js works with negative X for right
  const x = -EARTH_RADIUS_METERS * dLon * Math.cos(homeLat * (Math.PI / 180));
  const y = EARTH_RADIUS_METERS * dLat;
  
  return { x, y };
};

const predictPosition = (boatData, elapsedTime) => {
  // Get the current scaling factor from the configuration
  const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;
  
  if (boatData.sog != null && boatData.cog != null) {
    const speed = boatData.sog * 0.51444; // Convert knots to m/s
    const deltaX =
      speed *
      elapsedTime *
      Math.sin((boatData.cog * Math.PI) / 180) *
      scalingFactor;
    const deltaY =
      speed *
      elapsedTime *
      Math.cos((boatData.cog * Math.PI) / 180) *
      scalingFactor;
    return { deltaX, deltaY };
  }
  return { deltaX: 0, deltaY: 0 };
};

const updatePosition = (boat, targetX, targetY, interpolate = true) => {
  // Get the current scaling factor from the configuration
  const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;
  
  // Apply the scaling factor uniformly.
  // X is already inverted in relativeLatLonToXY function
  const scaledX = targetX * scalingFactor;
  const scaledZ = targetY * scalingFactor;
  
  if (interpolate) {
    boat.position.x += (scaledX - boat.position.x) * 0.1;
    boat.position.z += (scaledZ - boat.position.z) * 0.1;
  } else {
    boat.position.set(scaledX, 0, scaledZ);
  }
};

const updateRotation = (boat, targetAngle, interpolate = true) => {
  // In Three.js, rotating around Y axis is counter-clockwise looking down from above
  // But maritime angles increase clockwise from north, so we need to negate the angle
  const negatedAngle = -targetAngle;
  
  // Convert angle to radians and normalize between 0 and 2π
  const radianAngle = (negatedAngle * Math.PI / 180) % (2 * Math.PI);
  
  if (interpolate) {
    // Proper interpolation without accumulation
    boat.children[0].rotation.y = boat.children[0].rotation.y + (radianAngle - boat.children[0].rotation.y) * 0.1;
  } else {
    boat.children[0].rotation.y = radianAngle;
  }
  
  // Log rotation for debugging (remove in production)
  if (boat.mmsi && Math.abs(targetAngle % 45) < 1) {
    console.log(`Boat ${boat.mmsi} rotation: ${targetAngle}° (${radianAngle} rad)`);
  }
};

// --- Main Component ---
const AISView = ({ onUpdateInfoPanel }) => {
  const { aisData, vesselIds } = useAIS();
  const boatRefs = useRef({});
  const myPositionRef = useRef(null);
  const { getSignalKValue } = useOcearoContext();
  
  // State for the global infoPanel
  const [hoveredBoat, setHoveredBoat] = useState(null);
  
  // Store my boat's rotation angle for use in calculations
  const myRotationRef = useRef(0);

  // Get the scaling factor from configuration
  const getLengthScalingFactor = () => {
    return configService.get('aisLengthScalingFactor') || 0.7; // Default to 0.7 if not set
  };

  // Define thresholds (in real meters) and convert them into displayed coordinates.
  // For example, we want the boat to appear red if its displayed distance is below 500m
  // and to switch to white only if it goes above 550m.
  const lowerThreshold = 500; // in meters
  const upperThreshold = 550; // in meters
  const displayedLowerThreshold = lowerThreshold * getLengthScalingFactor();
  const displayedUpperThreshold = upperThreshold * getLengthScalingFactor();

  // Define maximum displayed distance (in displayed coordinates)
  const maxDisplayedDistance = 3000 * getLengthScalingFactor();

  // Use a ref to track if we've initialized boats to avoid unnecessary re-renders
  const initializedRef = useRef(false);

  useFrame(() => {
    const myPosition = getSignalKValue('navigation.position');
    const mySpeed = getSignalKValue('navigation.speedOverGround'); // in m/s
    
    // Convert radians to degrees for all angular values
    const radToDeg = (rad) => rad * (180 / Math.PI);
    
    // Get heading and COG in radians, then convert to degrees
    const headingRad = getSignalKValue('navigation.headingTrue') || getSignalKValue('navigation.headingMagnetic');
    const cogRad = getSignalKValue('navigation.courseOverGroundTrue') || getSignalKValue('navigation.courseOverGroundMagnetic');
    
    const heading = headingRad ? radToDeg(headingRad) : null;
    const courseOverGroundAngle = cogRad ? radToDeg(cogRad) : null;
  
    const myRotationAngle = courseOverGroundAngle || heading || 0;
    
    // Store my rotation angle in a ref for use in boat rotation calculations
    myRotationRef.current = myRotationAngle;
    
    // Debug the rotation value
    if (myRotationAngle !== 0) {
      console.log(`My boat rotation angle: ${myRotationAngle.toFixed(1)}° (converted from ${(myRotationAngle * Math.PI / 180).toFixed(2)} radians)`);
    }

    // Update position reference for use elsewhere in the component
    myPositionRef.current = myPosition;

    // Skip frame if no position or no boats to update
    if (!myPosition?.latitude || !myPosition?.longitude) return;
    if (!Object.keys(boatRefs.current).length) return;

    const currentTime = performance.now();
    // Use aisData directly since it's now initialized with static vessel info
    const currentData = aisData;

    Object.values(currentData).forEach((boatData) => {
      if (
        boatData.latitude == null ||
        boatData.longitude == null ||
        !boatRefs.current[boatData.mmsi]
      )
        return;

      const boat = boatRefs.current[boatData.mmsi];
      if (!boat) return;
      
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
      if (mySpeed != null && mySpeed > 0 && currentTime - lastUpdate > 1000) {
        const elapsedTime = (currentTime - lastUpdate) / 1000;
        ({ deltaX, deltaY } = predictPosition(boatData, elapsedTime));
      }

      // Predicted position (in real meters)
      // Note: We don't invert X here because updatePosition will handle the inversion
      const predictedX = targetX + deltaX;
      const predictedY = targetY + deltaY;

      // Calculate displayed distance (using the same scaling factor)
      // Note: For distance calculation, the sign of X doesn't matter as we're squaring it
      const displayedDistance = Math.sqrt(
        (predictedX * getLengthScalingFactor()) ** 2 +
          (predictedY * getLengthScalingFactor()) ** 2
      );

      // Skip boats at origin (0,0) relative position
      if (predictedX === 0 && predictedY === 0) {
        boat.visible = false;
        return;
      }
      
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


        // Update position and rotation - always use interpolation for smoother movement
        updatePosition(boat, predictedX, predictedY, true);
        
        // Determine heading or course using the same logic as CompassDial
        // First try to use COG (true or magnetic) - convert from radians to degrees
        const radToDeg = (rad) => rad * (180 / Math.PI);
        
        // AIS angles are in radians, so we need to convert them to degrees
        const courseAngle = boatData.cog !== null ? radToDeg(boatData.cog) : 
                           boatData.cogMagnetic !== null ? radToDeg(boatData.cogMagnetic) : null;
        
        // If no COG available, try to use heading (true or magnetic)
        const headingAngle = boatData.heading !== null ? radToDeg(boatData.heading) : 
                            boatData.headingMagnetic !== null ? radToDeg(boatData.headingMagnetic) : null;
        
        // Use course if available, otherwise use heading, or default to 0
        const absoluteRotationAngle = courseAngle !== null ? courseAngle : 
                                    headingAngle !== null ? headingAngle : 0;
        
        // Calculate the relative rotation by subtracting my boat's rotation angle
        // This makes the AIS boat rotation display relative to the user's boat orientation
        const relativeRotationAngle = absoluteRotationAngle - myRotationRef.current;
        
        // Debug rotation angles periodically for significant changes
        if (boat.mmsi && Math.abs(absoluteRotationAngle - (boat.lastLoggedAngle || 0)) > 10) {
          console.log(`Boat ${boat.mmsi} - Absolute angle: ${absoluteRotationAngle.toFixed(1)}°, Relative: ${relativeRotationAngle.toFixed(1)}°`);
          boat.lastLoggedAngle = absoluteRotationAngle;
        }
        
        // Always use interpolation for smoother rotation
        updateRotation(boat, relativeRotationAngle, true);

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
    // Get position from ref to avoid scope issues
    const myPosition = myPositionRef.current;
    
    // Make sure we have our own position first
    if (!myPosition?.latitude || !myPosition?.longitude) {
      return [];
    }

    return vesselIds
      .filter(vessel => {
        // Filter out boats we don't want to display
        if (!vessel.mmsi ||
            vessel.mmsi.startsWith('urn:mrn:signalk:uuid:') ||
            vessel.mmsi.startsWith('227925790') ||
            vessel.mmsi.startsWith('urn:mrn:imo:mmsi:230035780')) {
          return false;
        }
        
        // Check if this vessel has valid position data in aisData
        const vesselData = aisData[vessel.mmsi];
        if (!vesselData || 
            vesselData.latitude === null || 
            vesselData.longitude === null) {
          return false;
        }
        
        // We'll check for (0,0) relative position after calculating it below
        
        return true;
      })
      .map(vessel => {
        const vesselData = aisData[vessel.mmsi];
        
        // Calculate relative position from our boat
        const position = relativeLatLonToXY(
          vesselData.latitude,
          vesselData.longitude,
          myPosition.latitude,
          myPosition.longitude
        );
        
        // Skip boats with (0,0) relative position (likely invalid data or same position as our boat)
        if (position.x === 0 && position.y === 0) {
          return false;
        }
        
        // Get the current scaling factor from the configuration
        const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;
        
        // Apply the scaling factor to match the display scale
        // X is already inverted in relativeLatLonToXY function
        const scaledX = position.x * scalingFactor;
        const scaledY = position.y * scalingFactor;
        
        // Calculate displayed distance to determine if it's in the visible zone
        const displayedDistance = Math.sqrt(scaledX * scaledX + scaledY * scaledY);
        
        // Only display if within the maximum display distance
        const isInDisplayZone = displayedDistance <= maxDisplayedDistance;
        
        return (
          <AISBoat
            key={vessel.mmsi}
            ref={(el) => {
              if (el) {
                // Store the ref and also attach mmsi to the boat object itself for debugging
                el.mmsi = vessel.mmsi;
                boatRefs.current[vessel.mmsi] = el;
              }
            }}
            position={[scaledX, 0, scaledY]} // Use proper orientation for 3D space
            visible={isInDisplayZone} // Only visible if in the display zone
            boatData={{...vessel, ...vesselData}} // Merge vessel info with position data
            onHover={setHoveredBoat} // Pass the hover handler
          />
        );
      });
  }, [vesselIds, aisData, myPositionRef.current, maxDisplayedDistance]);

  // Format boat data for display
  const formatBoatData = (label, value, unit = '', isAngle = false) => {
    // If value is undefined, null, empty string, or 0 length string, return null
    if (value === undefined || value === null || value === '' || 
        (typeof value === 'string' && value.trim().length === 0)) {
      return null;
    }
    
    // If it's an angle value (COG or heading) and in radians, convert to degrees
    if (isAngle) {
      // Check if value is likely in radians (between -2π and 2π)
      if (Math.abs(value) <= 2 * Math.PI) {
        value = Math.round((value * 180 / Math.PI + 360) % 360);
      } else {
        // Already in degrees, just round it
        value = Math.round(value);
      }
    }
    
    return `${label}: ${value}${unit}`;
  };

  // Format MMSI by removing prefixes
  const formatMMSI = (mmsi) => {
    if (!mmsi) return null;
    
    // Remove common prefixes
    const prefixes = ['urn:mrn:imo:mmsi:', 'urn:mrn:signalk:uuid:'];
    let formattedMMSI = mmsi;
    
    for (const prefix of prefixes) {
      if (formattedMMSI.startsWith(prefix)) {
        formattedMMSI = formattedMMSI.substring(prefix.length);
        break;
      }
    }
    
    return formattedMMSI;
  };
  
  // Calculate distance from user's boat to the hovered boat in nautical miles
  const calculateDistanceNM = (boatData) => {
    if (!boatData || !myPositionRef.current) return null;
    
    const myPosition = myPositionRef.current;
    if (!myPosition?.latitude || !myPosition?.longitude || 
        !boatData.latitude || !boatData.longitude) return null;
    
    // Calculate distance in meters using the relativeLatLonToXY function
    const { x, y } = relativeLatLonToXY(
      boatData.latitude,
      boatData.longitude,
      myPosition.latitude,
      myPosition.longitude
    );
    
    // Calculate distance in meters
    const distanceMeters = Math.sqrt(x * x + y * y);
    
    // Convert to nautical miles (1 nautical mile = 1852 meters)
    const distanceNM = distanceMeters / 1852;
    
    // Return rounded to 1 decimal place
    return Math.round(distanceNM * 10) / 10;
  };
  
  // Prepare info panel content if a boat is hovered
  const infoPanelContent = hoveredBoat ? [
    formatBoatData('Name', hoveredBoat.name || 'Unknown'),
    formatBoatData('MMSI', formatMMSI(hoveredBoat.mmsi)),
    formatBoatData('Distance', calculateDistanceNM(hoveredBoat), ' NM'),
    formatBoatData('Length', hoveredBoat.length, 'm'),
    formatBoatData('Type', hoveredBoat.shipType),
    formatBoatData('SOG', hoveredBoat.sog, ' kts'),
    formatBoatData('COG', hoveredBoat.cog, '°', true),
    formatBoatData('Heading', hoveredBoat.heading, '°', true),
    formatBoatData('Beam', hoveredBoat.beam, 'm'),
    formatBoatData('Draft', hoveredBoat.draft, 'm'),
    formatBoatData('Callsign', hoveredBoat.callsign),
    formatBoatData('Destination', hoveredBoat.destination)
  ]
    .filter(item => item !== null) // Filter out null values (unavailable info)
    .join('\n') : ''; // Join with newlines for proper formatting

  // Send info panel content to parent component when hoveredBoat changes
  React.useEffect(() => {
    if (onUpdateInfoPanel) {
      onUpdateInfoPanel(infoPanelContent);
    }
  }, [hoveredBoat, infoPanelContent, onUpdateInfoPanel]);

  return (
    <>
      {boats}
      
      {/* InfoPanel now moved to parent (ThreeDMainView) component */}
      {hoveredBoat && (
        <group position={[0, 1, 0]}>
          {/* 3D position marker for the InfoPanel - will be at fixed position */}
          <mesh scale={[0.1, 0.1, 0.1]} visible={false}>
            <boxGeometry />
            <meshBasicMaterial color="yellow" />
          </mesh>
        </group>
      )}
    </>
  );
};

export default AISView;
