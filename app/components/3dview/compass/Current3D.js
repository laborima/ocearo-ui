import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Vector3 } from 'three';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { oBlue, oGreen, useOcearoContext } from '../../context/OcearoContext';

// Constants for configuration
const CURRENT_OFFSET = 0.7;
const FONT_SIZE = 0.5;

const CurrentArrow = ({
  position,
  rotation,
  speed,
  color = '#ffffff',
  fontSize = FONT_SIZE,
  textPosition = [0, 0.8, 0],
  arrowSize = 1,
}) => (
  <group position={position} rotation={rotation}>
    {/* Speed text */}
    <Text
      characters="0123456789."
      color={color}
      fontSize={fontSize * arrowSize}
      position={textPosition}
      font="fonts/Roboto-Bold.ttf"
      anchorX="center"
      anchorY="middle"
    >
      {speed.toFixed(1)}
    </Text>

    {/* Arrow shape */}
    <mesh>
      <shapeGeometry 
        args={[
          new THREE.Shape([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0.5 * arrowSize * Math.cos(5 * Math.PI / 6), 0.5 * arrowSize * Math.sin(5 * Math.PI / 6)),
            new THREE.Vector2(0, -0.577 * arrowSize),
            new THREE.Vector2(-0.5 * arrowSize * Math.cos(5 * Math.PI / 6), 0.5 * arrowSize * Math.sin(5 * Math.PI / 6)),
            new THREE.Vector2(0, 0),
          ])
        ]} 
      />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

CurrentArrow.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number),
  rotation: PropTypes.arrayOf(PropTypes.number),
  speed: PropTypes.number.isRequired,
  color: PropTypes.string,
  fontSize: PropTypes.number,
  textPosition: PropTypes.arrayOf(PropTypes.number),
  arrowSize: PropTypes.number
};

CurrentArrow.defaultProps = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  color: '#ffffff',
  fontSize: FONT_SIZE,
  textPosition: [0, 0.8, 0],
  arrowSize: 1
};

const Current3D = ({ outerRadius }) => {
  const { getSignalKValue } = useOcearoContext();

  // Get current data with default values
  const currentData = getSignalKValue('environment.current') || {
    setTrue: 0,
    drift: 0
  };

  // Calculate current arrow position
  const currentPosition = useMemo(() => {
    const angle = currentData.setTrue || 0;
    return [
      (outerRadius + CURRENT_OFFSET) * Math.cos(angle),
      0,
      -(outerRadius + CURRENT_OFFSET) * Math.sin(angle)
    ];
  }, [outerRadius, currentData.setTrue]);

  // Only render if we have current
  if (!currentData.drift || currentData.drift <= 0) {
    return null;
  }

  return (
    <group>
      <CurrentArrow
        position={currentPosition}
        rotation={[-Math.PI / 2, 0, -(Math.PI / 2 - (currentData.setTrue || 0))]}
        speed={currentData.drift}
        color={oGreen}
        arrowSize={1.2}
      />
    </group>
  );
};

Current3D.propTypes = {
  outerRadius: PropTypes.number.isRequired
};

export default Current3D;