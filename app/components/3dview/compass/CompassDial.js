/**
 * CompassDial Component
 * 
 * A 3D compass dial that displays heading information with color-coded markers.
 * Designed for the Ocearo UI with touch-optimized interactions.
 */
import React, { useMemo } from 'react';
import { Ring, Sphere, Text } from '@react-three/drei';
import { DoubleSide, MathUtils } from 'three';
import { oGreen, oRed, oNight, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPaths } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';

/**
 * StaticMarkers Component
 * 
 * Creates the markers and labels for the compass dial.
 * - Inner dial: Shows degree labels (0-330) with 'N' at 0°
 * - Outer dial: Shows color-coded markers (green 0-60°, red 300-360°)
 * 
 * @param {number} radius - Radius of the marker circle
 * @param {boolean} isOuter - Whether this is for the outer dial
 * @param {number} markerColorPrimary - Color for standard markers
 * @param {number} markerColorGreen - Color for green zone markers
 * @param {number} markerColorRed - Color for red zone markers
 */
const StaticMarkers = React.memo(({ radius, isOuter, markerColorPrimary, markerColorGreen, markerColorRed }) => {
  const markers = useMemo(() => {
    const markersArray = [];
    
    for (let deg = 0; deg < 360; deg += 10) {
      const angle = MathUtils.degToRad(deg - 90);
      const isMainMarker = deg % 30 === 0;
      const markerSize = isOuter ? (isMainMarker ? 0.4 : 0.2) : (isMainMarker ? 0.3 : 0.15);
      const x = (radius + markerSize * 0.5 + 0.2) * Math.cos(angle);
      const z = (radius + markerSize * 0.5 + 0.2) * Math.sin(angle);

      const isGreenZone = isOuter && deg > 0 && deg < 61;
      const isRedZone = isOuter && deg >= 300 && deg < 360;
      const currentMarkerColor = isGreenZone ? markerColorGreen : isRedZone ? markerColorRed : markerColorPrimary;

      if (!isOuter && isMainMarker) {
        // Add cardinal directions (N, S, W, E) at their respective degrees
        let label;
        if (deg === 0) label = "N";
        else if (deg === 90) label = "E";
        else if (deg === 180) label = "S";
        else if (deg === 270) label = "W";
        else label = deg.toString();
        
        markersArray.push(
          <Text characters="NESW0123456789"
            key={`text-${deg}`}
            position={[x, 0.01, z]}
            color={markerColorPrimary}
            fontSize={0.5}
            rotation={[-Math.PI / 2, 0, Math.PI / 2 - angle]}
            font="fonts/Roboto-Bold.ttf"
            anchorY="middle"
          >
            {label}
          </Text>
        );
      } else {
        markersArray.push(
          <Sphere
            key={`marker-${isOuter ? 'outer' : 'inner'}-${deg}`}
            args={[markerSize / 2, 16, 16]}
            position={[x, 0, z]}
          >
            <meshBasicMaterial color={currentMarkerColor} />
          </Sphere>
        );
      }
    }
    return markersArray;
  }, [radius, isOuter, markerColorPrimary, markerColorGreen, markerColorRed]);

  return <>{markers}</>;
});

StaticMarkers.displayName = 'StaticMarkers';

/**
 * StaticRing Component
 * 
 * Creates a ring for the compass dial with configurable properties.
 * 
 * @param {number} innerRadius - Inner radius of the ring
 * @param {number} outerRadius - Outer radius of the ring
 * @param {number} dialColor - Color of the ring
 * @param {number} opacity - Opacity of the ring (default: 1)
 * @param {boolean} transparent - Whether the ring material is transparent (default: false)
 */
const StaticRing = React.memo(({ innerRadius, outerRadius, dialColor, opacity = 1, transparent = false }) => (
  <Ring
    args={[innerRadius, outerRadius, 64]}
    rotation={[Math.PI / 2, 0, 0]}
  >
    <meshBasicMaterial
      color={dialColor}
      side={DoubleSide}
      transparent={transparent}
      opacity={opacity}
    />
  </Ring>
));

StaticRing.displayName = 'StaticRing';

/**
 * CompassDial Component
 * 
 * Main component that renders a 3D compass dial with the following features:
 * - Rotating inner dial that shows the current heading
 * - Static outer dial with color-coded markers
 * - Clockwise rotation that matches standard compass behavior
 * - North (0°) positioned at the bottom of the compass
 * 
 * @param {number} outerRadius - Outer radius of the compass dial
 * @param {number} innerRadius - Inner radius of the compass dial
 */
const CompassDial = ({ outerRadius, innerRadius }) => {
  // Constants for visual appearance
  const outerDialOpacity = 0.5;
  const markerColorPrimary = 0x000000;
  const markerColorGreen = oGreen;
  const markerColorRed = oRed;

  // Get context values and night mode setting
  const { nightMode } = useOcearoContext();
  
  // Subscribe to relevant SignalK paths for heading
  const headingPaths = useMemo(() => [
    'navigation.headingTrue',
    'navigation.headingMagnetic',
    'navigation.courseOverGroundTrue',
    'navigation.courseOverGroundMagnetic'
  ], []);
  
  const skValues = useSignalKPaths(headingPaths);
  
  // Logic from getBoatRotationAngle
  const compassHeading = useMemo(() => {
    const heading = skValues['navigation.headingTrue'] || skValues['navigation.headingMagnetic'];
    const cog = skValues['navigation.courseOverGroundTrue'] || skValues['navigation.courseOverGroundMagnetic'];
    return cog || heading || 0;
  }, [skValues]);

  const dialColor = nightMode ? oNight : 0xffffff;
  
  // Get compass orientation preference from settings
  const isNorthUp = configService.get('compassNorthUp');

  // Memoize the static properties
  const staticProps = useMemo(() => ({
    innerRadius,
    outerRadius,
    dialColor,
    markerColorPrimary,
    markerColorGreen,
    markerColorRed
  }), [
    innerRadius,
    outerRadius,
    dialColor,
    markerColorPrimary,
    markerColorGreen,
    markerColorRed
  ]);

  return (
    <>
      {/* 
        Rotating inner dial
        
        Compass rotation calculation:  
        1. In Three.js, Y-rotation of 0 points to -Z axis
        2. We rotate clockwise using the heading value directly
        3. We add Math.PI (180°) to position North at the bottom of the compass for standard marine view
           OR we don't add it for North at top (aeronautical/land navigation style)
        4. This creates either:
           Standard marine compass (North at bottom):
           - North (0°) at the bottom
           - East (90°) on the left
           - South (180°) at the top
           - West (270°) on the right
           OR North-up compass:
           - North (0°) at the top
           - East (90°) on the right
           - South (180°) at the bottom
           - West (270°) on the left
        5. The rotation is always clockwise, matching standard compass behavior
      */}
      <group rotation={[0, compassHeading + (isNorthUp ? 0 : Math.PI), 0]}>
        <StaticRing
          innerRadius={staticProps.innerRadius}
          outerRadius={staticProps.outerRadius}
          dialColor={staticProps.dialColor}
        />
        <StaticMarkers
          radius={staticProps.innerRadius}
          isOuter={false}
          markerColorPrimary={staticProps.markerColorPrimary}
          markerColorGreen={staticProps.markerColorGreen}
          markerColorRed={staticProps.markerColorRed}
        />
      </group>

      {/* 
        Static outer dial
        - Remains fixed while inner dial rotates
        - Contains color-coded markers:
          - Green zone: 0-60° (starboard side)
          - Red zone: 300-360° (port side)
      */}
      <group>
        <StaticRing
          innerRadius={staticProps.innerRadius + 1}
          outerRadius={staticProps.outerRadius + 1}
          dialColor={staticProps.dialColor}
          transparent={true}
          opacity={outerDialOpacity}
        />
        <StaticMarkers
          radius={staticProps.innerRadius + 1}
          isOuter={true}
          markerColorPrimary={staticProps.markerColorPrimary}
          markerColorGreen={staticProps.markerColorGreen}
          markerColorRed={staticProps.markerColorRed}
        />
      </group>
    </>
  );
};

CompassDial.displayName = 'CompassDial';

export default CompassDial;