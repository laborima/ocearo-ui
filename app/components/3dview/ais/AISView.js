import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { Text } from '@react-three/drei';

import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat';
import configService from '../../settings/ConfigService';

/**
 * Earth radius in meters - used for coordinate calculations
 * @constant {number}
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Recursively searches for a mesh with material in a 3D object hierarchy
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
 * Converts latitude/longitude to XY coordinates relative to a home position
 * Uses the Earth radius and basic spherical trigonometry to calculate distances
 * 
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
  
  // Convert degree differences to radians
  const dLat = (lat - homeLat) * (Math.PI / 180);
  const dLon = (lon - homeLon) * (Math.PI / 180);
  
  // Calculate position with X inverted for correct port/starboard orientation
  // Maritime convention: positive X is to the right, but Three.js works with negative X for right
  const x = -EARTH_RADIUS_METERS * dLon * Math.cos(homeLat * (Math.PI / 180));
  const y = EARTH_RADIUS_METERS * dLat;
  
  return { x, y };
};

/**
 * Predicts the future position of a boat based on its speed and course
 * Used to extrapolate position for vessels with stale AIS data
 * 
 * @param {Object} boatData - The boat's current position and movement data
 * @param {number} elapsedTime - Time in seconds since the last position update
 * @returns {Object} - The predicted change in position {deltaX, deltaY} in meters
 */
const predictPosition = (boatData, elapsedTime) => {
  // Get the current scaling factor from the configuration
  const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;
  
  // Only predict if we have both speed and course data
  if (boatData.sog != null && boatData.cog != null) {
    // Convert speed from knots to meters per second
    const speed = boatData.sog * 0.51444;
    
    // Calculate position delta using speed, time elapsed, and direction
    // Math.sin for X component (east-west movement)
    const deltaX =
      speed *
      elapsedTime *
      Math.sin((boatData.cog * Math.PI) / 180) *
      scalingFactor;
      
    // Math.cos for Y component (north-south movement)
    const deltaY =
      speed *
      elapsedTime *
      Math.cos((boatData.cog * Math.PI) / 180) *
      scalingFactor;
      
    return { deltaX, deltaY };
  }
  
  // Return zero change if we don't have sufficient data
  return { deltaX: 0, deltaY: 0 };
};

/**
 * Updates the 3D position of a boat model in the scene
 * Can use smooth interpolation for visual enhancement
 * 
 * @param {Object} boat - The 3D boat object to update
 * @param {number} targetX - Target X coordinate in meters
 * @param {number} targetY - Target Y coordinate in meters
 * @param {boolean} interpolate - Whether to smoothly interpolate to the target position
 */
const updatePosition = (boat, targetX, targetY, interpolate = true) => {
  // Get the current scaling factor from the configuration
  const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;
  
  // Apply the scaling factor to convert real-world meters to scene units
  // X is already inverted in relativeLatLonToXY function for proper orientation
  const scaledX = targetX * scalingFactor;
  const scaledZ = targetY * scalingFactor; // Y coordinate maps to Z in Three.js
  
  if (interpolate) {
    // Smooth interpolation - move 10% of the remaining distance each frame
    boat.position.x += (scaledX - boat.position.x) * 0.1;
    boat.position.z += (scaledZ - boat.position.z) * 0.1;
  } else {
    // Immediate position update
    boat.position.set(scaledX, 0, scaledZ); // Y=0 keeps boats at water level
  }
};

/**
 * Updates the rotation of a boat model to match its heading or course
 * Handles coordinate system conversions between maritime and 3D space
 * 
 * @param {Object} boat - The 3D boat object to update
 * @param {number} targetAngle - Target angle in degrees (maritime convention)
 * @param {boolean} interpolate - Whether to smoothly interpolate the rotation
 */
const updateRotation = (boat, targetAngle, interpolate = true) => {
  // In Three.js, rotating around Y axis is counter-clockwise looking down from above
  // But maritime angles increase clockwise from north, so we need to negate the angle
  const negatedAngle = -targetAngle;
  
  // Convert angle to radians and normalize between 0 and 2π
  const radianAngle = (negatedAngle * Math.PI / 180) % (2 * Math.PI);
  
  if (interpolate) {
    // Smooth interpolation - rotate 10% of the remaining angle each frame
    // Applied to the boat's child object which contains the actual 3D model
    boat.children[0].rotation.y = boat.children[0].rotation.y + 
                                 (radianAngle - boat.children[0].rotation.y) * 0.1;
  } else {
    // Immediate rotation update
    boat.children[0].rotation.y = radianAngle;
  }
  
  // Log rotation for debugging (uncomment in development)
  // Only log when crossing 45-degree boundaries to avoid console spam
  if (boat.mmsi && Math.abs(targetAngle % 45) < 1) {
    console.log(`Boat ${boat.mmsi} rotation: ${targetAngle}° (${radianAngle} rad)`);
  }
};

/**
 * AISView component - Renders all AIS boat targets on the 3D display
 * Provides touch-optimized interaction for boat selection and information display
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onUpdateInfoPanel - Callback to update the info panel content
 */
const AISView = ({ onUpdateInfoPanel }) => {
  const { aisData, vesselIds } = useAIS();
  const boatRefs = useRef({});          // Refs to all boat 3D objects for direct manipulation
  const myPositionRef = useRef(null);   // Reference to user's own boat position
  const { getSignalKValue } = useOcearoContext();
  
  // State for the selected boat (using click events rather than hover for touchscreen optimization)
  const [selectedBoat, setSelectedBoat] = useState(null);
  
  // Store user's boat rotation angle for relative position calculations
  const myRotationRef = useRef(0);

  /**
   * Gets the current length scaling factor from configuration
   * This is used to scale real-world distances to scene units
   * 
   * @returns {number} The current scaling factor
   */
  const getLengthScalingFactor = () => {
    return configService.get('aisLengthScalingFactor') || 0.7; // Default to 0.7 if not set
  };

  // Proximity alert settings - defines when boats change color based on distance
  // Uses hysteresis (different thresholds for switching to red vs. back to white)
  // to prevent rapid color changes when a boat is near the threshold distance
  const lowerThreshold = 500; // in meters - switch to red when closer than this
  const upperThreshold = 550; // in meters - switch back to white when farther than this
  const displayedLowerThreshold = lowerThreshold * getLengthScalingFactor();
  const displayedUpperThreshold = upperThreshold * getLengthScalingFactor();

  // Maximum range for displaying boats (in scene units)
  const maxDisplayedDistance = 3000 * getLengthScalingFactor();

  // Optimization to avoid unnecessary re-renders
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
            onHover={(boat) => {
              // Toggle selection - if clicking the same boat, deselect it
              if (selectedBoat && boat && selectedBoat.mmsi === boat.mmsi) {
                setSelectedBoat(null);
              } else {
                setSelectedBoat(boat);
              }
            }} // Pass the click handler for touchscreen optimization
          />
        );
      });
  }, [vesselIds, aisData, maxDisplayedDistance, selectedBoat]);

  /**
   * Formats boat data for display in the info panel
   * Handles unit conversion and null/undefined values
   * 
   * @param {string} label - The label for the data field
   * @param {*} value - The data value to format
   * @param {string} unit - Optional unit to append to the value
   * @param {boolean} isAngle - Whether this is an angle value that may need conversion
   * @returns {string|null} - Formatted string or null if value is not available
   */
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

  /**
   * Formats MMSI numbers by removing standard prefixes
   * 
   * @param {string} mmsi - The raw MMSI identifier
   * @returns {string|null} - Cleaned MMSI or null if not available
   */
  const formatMMSI = (mmsi) => {
    if (!mmsi) return null;
    
    // Remove common prefixes to display just the numeric identifier
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
  
  /**
   * Calculates the distance from user's boat to another boat in nautical miles
   * 
   * @param {Object} boatData - The target boat's data including position
   * @returns {number|null} - Distance in nautical miles (rounded to 1 decimal)
   */
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
    
    // Calculate straight-line distance using Pythagorean theorem
    const distanceMeters = Math.sqrt(x * x + y * y);
    
    // Convert to nautical miles (1 nautical mile = 1852 meters)
    const distanceNM = distanceMeters / 1852;
    
    // Return rounded to 1 decimal place
    return Math.round(distanceNM * 10) / 10;
  };
  
  // Prepare info panel content if a boat is selected
  // Note: 'Name' field will only be displayed if it exists (touchscreen optimization)
  const infoPanelContent = selectedBoat ? [
    formatBoatData('Name', selectedBoat.name),  // Only show Name if it exists
    formatBoatData('MMSI', formatMMSI(selectedBoat.mmsi)),
    formatBoatData('Distance', calculateDistanceNM(selectedBoat), ' NM'),
    formatBoatData('Length', selectedBoat.length, 'm'),
    formatBoatData('Type', selectedBoat.shipType),
    formatBoatData('SOG', selectedBoat.sog, ' kts'),
    formatBoatData('COG', selectedBoat.cog, '°', true),
    formatBoatData('Heading', selectedBoat.heading, '°', true),
    formatBoatData('Beam', selectedBoat.beam, 'm'),
    formatBoatData('Draft', selectedBoat.draft, 'm'),
    formatBoatData('Callsign', selectedBoat.callsign),
    formatBoatData('Destination', selectedBoat.destination)
  ]
    .filter(item => item !== null) // Remove any unavailable information
    .join('\n') : ''; // Format with newlines for display

  // Update parent component with info panel content whenever selection changes
  React.useEffect(() => {
    if (onUpdateInfoPanel) {
      onUpdateInfoPanel(infoPanelContent);
    }
  }, [selectedBoat, infoPanelContent, onUpdateInfoPanel]);

  /**
   * The component render function returns:
   * 1. Array of AISBoat components (rendered via the boats memoized value)
   * 2. An invisible marker for the info panel position in 3D space
   * 
   * The info panel content is managed via the onUpdateInfoPanel callback
   * UI interactions are optimized for touchscreen devices using click events
   */
  return (
    <>
      {/* Render all visible AIS boat targets */}
      {boats}
      
      {/* InfoPanel content is passed to parent component via callback */}
      {/* This marker is just a reference point in 3D space */}
      {selectedBoat && (
        <group position={[0, 1, 0]}>
          {/* Invisible position marker for the InfoPanel */}
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
