import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useOcearoContext } from '../../context/OcearoContext';
import { Vector3 } from 'three';
import { Cone, Text } from '@react-three/drei';

// Constants for configuration
const MARKER_COLOR_PRIMARY = 0x00FF00;
const WIND_OFFSET = 0.3;
const FONT_SIZE = {
  TRUE_WIND: 0.5,
  APP_WIND: 0.6
};

const WindArrow = ({ position, rotation, speed, color, fontSize, textPosition = [0, 0.6, 0] }) => (
  <group position={position} rotation={rotation}>
    <Text color={color} fontSize={fontSize} position={textPosition}>
      {speed.toFixed(1)}
    </Text>
    <Cone args={[0.25, 0.5, 3]}>
      <meshStandardMaterial color={color} />
    </Cone>
  </group>
);

WindArrow.propTypes = {
  position: PropTypes.instanceOf(Vector3).isRequired,
  rotation: PropTypes.arrayOf(PropTypes.number).isRequired,
  speed: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  fontSize: PropTypes.number.isRequired,
  textPosition: PropTypes.arrayOf(PropTypes.number).isRequired
};

const WindSector3D = ({ outerRadius }) => {
  const { getSignalKValue } = useOcearoContext();

  const trueWindAngle = getSignalKValue('environment.wind.angleTrueGround') || 0;
  const trueWindSpeed = getSignalKValue('environment.wind.speedOverGround') || 1;
  const appWindAngle = getSignalKValue('environment.wind.angleApparent') || 0;
  const appWindSpeed = getSignalKValue('environment.wind.speedApparent') || 1;

  const trueWindPosition = useMemo(
    () => new Vector3((outerRadius + WIND_OFFSET) * Math.cos(trueWindAngle), 0, -(outerRadius + WIND_OFFSET) * Math.sin(trueWindAngle)),
    [outerRadius, trueWindAngle]
  );

  const appWindPosition = useMemo(
    () => new Vector3((outerRadius + WIND_OFFSET) * Math.cos(appWindAngle), 0, -(outerRadius + WIND_OFFSET) * Math.sin(appWindAngle)),
    [outerRadius, appWindAngle]
  );

  return (
    <group>
      <WindArrow
        position={trueWindPosition}
        rotation={[-Math.PI / 2, 0, -(Math.PI / 2 - trueWindAngle)]}
        speed={trueWindSpeed}
        color="blue"
        fontSize={FONT_SIZE.TRUE_WIND}
      />

      <WindArrow
        position={appWindPosition}
        rotation={[-Math.PI / 2, 0, -(Math.PI / 2 - appWindAngle)]}
        speed={appWindSpeed}
        color="cyan"
        fontSize={FONT_SIZE.APP_WIND}
      />
    </group>
  );
};

WindSector3D.propTypes = {
  outerRadius: PropTypes.number.isRequired
};

export default WindSector3D;
