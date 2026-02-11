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
      const markerSize = isOuter ? (isMainMarker ? 0.35 : 0.15) : (isMainMarker ? 0.25 : 0.1);
      const x = (radius + markerSize * 0.5 + 0.2) * Math.cos(angle);
      const z = (radius + markerSize * 0.5 + 0.2) * Math.sin(angle);

      const isGreenZone = isOuter && deg > 0 && deg < 61;
      const isRedZone = isOuter && deg >= 300 && deg < 360;
      // In HUD style, we prefer more translucent colors
      const currentMarkerColor = isGreenZone ? markerColorGreen : isRedZone ? markerColorRed : markerColorPrimary;

      if (!isOuter && isMainMarker) {
        let label;
        if (deg === 0) label = "N";
        else if (deg === 90) label = "E";
        else if (deg === 180) label = "S";
        else if (deg === 270) label = "W";
        else label = deg.toString();
        
        markersArray.push(
          <Text characters="NESW0123456789"
            key={`text-${deg}`}
            position={[x, 0.02, z]}
            color={markerColorPrimary}
            fontSize={0.6}
            rotation={[-Math.PI / 2, 0, Math.PI / 2 - angle]}
            font="fonts/Roboto-Bold.ttf"
            anchorY="middle"
            fillOpacity={0.9}
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
            <meshBasicMaterial 
                color={currentMarkerColor} 
                transparent={true} 
                opacity={isMainMarker ? 0.8 : 0.4} 
            />
          </Sphere>
        );
      }
    }
    return markersArray;
  }, [radius, isOuter, markerColorPrimary, markerColorGreen, markerColorRed]);

  return <>{markers}</>;
});

StaticMarkers.displayName = 'StaticMarkers';

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
      depthWrite={false}
    />
  </Ring>
));

StaticRing.displayName = 'StaticRing';

const CompassDial = ({ outerRadius, innerRadius }) => {
  // Get context values and night mode setting
  const { nightMode } = useOcearoContext();

  // Constants for visual appearance - Tesla UI High Contrast HUD
  const outerDialOpacity = 0.15;
  const innerDialOpacity = 0.1;
  const markerColorPrimary = nightMode ? oNight : "#ffffff";
  const markerColorGreen = oGreen;
  const markerColorRed = oRed;
  
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

  const dialColor = nightMode ? "#000000" : "#0a0a0a";
  
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
      <group rotation={[0, compassHeading + (isNorthUp ? 0 : Math.PI), 0]}>
        <StaticRing
          innerRadius={staticProps.innerRadius}
          outerRadius={staticProps.outerRadius}
          dialColor={staticProps.dialColor}
          transparent={true}
          opacity={innerDialOpacity}
        />
        <StaticMarkers
          radius={staticProps.innerRadius}
          isOuter={false}
          markerColorPrimary={staticProps.markerColorPrimary}
          markerColorGreen={staticProps.markerColorGreen}
          markerColorRed={staticProps.markerColorRed}
        />
      </group>

      <group>
        <StaticRing
          innerRadius={staticProps.innerRadius + 0.8}
          outerRadius={staticProps.outerRadius + 0.8}
          dialColor={staticProps.dialColor}
          transparent={true}
          opacity={outerDialOpacity}
        />
        <StaticMarkers
          radius={staticProps.innerRadius + 0.8}
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