import React, { useMemo } from 'react';
import { Ring, Sphere, Text } from '@react-three/drei';
import { DoubleSide, MathUtils } from 'three';
import { oGreen, oRed, useOcearoContext } from '../../context/OcearoContext';

// Memoized markers creation component
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
        const label = deg === 0 ? "N" : deg.toString();
        markersArray.push(
          <Text characters="N0123456789"
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

// Memoized static ring component
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

const CompassDial = ({ outerRadius, innerRadius }) => {
  const dialColor = 0xffffff;
  const outerDialOpacity = 0.5;
  const markerColorPrimary = 0x000000;
  const markerColorGreen = oGreen;
  const markerColorRed = oRed;

  const { getSignalKValue } = useOcearoContext();
  const courseOverGroundAngle = getSignalKValue('navigation.courseOverGroundTrue') || 10;

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
      {/* Rotating inner dial */}
      <group rotation={[0, -courseOverGroundAngle, 0]}>
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

      {/* Static outer dial */}
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