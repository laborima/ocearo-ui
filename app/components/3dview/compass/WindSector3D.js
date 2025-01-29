import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { convertWindSpeed, oBlue, useOcearoContext } from '../../context/OcearoContext';
import { Vector3 } from 'three';
import { Cone, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';

// Constants for configuration
const MARKER_COLOR_PRIMARY = 0x00FF00;
const WIND_OFFSET = 0.7;
const FONT_SIZE = {
    TRUE_WIND: 1,
    APP_WIND: 1
};



const WindArrow = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    speed,
    color = '#ffffff',
    fontSize = 0.5,
    textPosition = [0, 0.8, 0],
    arrowSize = 1, // Scale factor for the entire arrow
}) => (
    <group position={position} rotation={rotation}>
        {/* Speed text */}
        <Text
            characters=".0123456789"
            color={color}
            fontSize={fontSize * arrowSize}
            position={textPosition}
            font="fonts/Roboto-Bold.ttf"
        >
            {speed.toFixed(1)}
        </Text>

        {/* Arrow head */}
        <mesh>
            <shapeGeometry args={[
                new THREE.Shape([
                    // Center point
                    new THREE.Vector2(0, 0),
                    // Right point (now pointing down)
                    new THREE.Vector2(0.5 * arrowSize * Math.cos(5 * Math.PI / 6), 0.5 * arrowSize * Math.sin(5 * Math.PI / 6)),
                    // Tip point (now at bottom)
                    new THREE.Vector2(0, -0.577 * arrowSize),
                    // Left point (now pointing down)
                    new THREE.Vector2(-0.5 * arrowSize * Math.cos(5 * Math.PI / 6), 0.5 * arrowSize * Math.sin(5 * Math.PI / 6)),
                    // Back to center
                    new THREE.Vector2(0, 0),
                ])
            ]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
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

    const trueWindAngle = Math.PI / 2 - getSignalKValue('environment.wind.angleTrueGround') || 0;
    const trueWindSpeed = convertWindSpeed(getSignalKValue('environment.wind.speedOverGround')) || 0;
    const appWindAngle = Math.PI / 2 - getSignalKValue('environment.wind.angleApparent') || 0;
    const appWindSpeed = convertWindSpeed(getSignalKValue('environment.wind.speedApparent')) || 0;

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
            {trueWindSpeed > 0 && (
                <WindArrow
                    position={trueWindPosition}
                    rotation={[-Math.PI / 2, 0, -(Math.PI / 2 - trueWindAngle)]}
                    speed={trueWindSpeed}
                    color="blue"
                    fontSize={FONT_SIZE.TRUE_WIND}
                />
            )}

            {appWindSpeed > 0 && (
                <WindArrow
                    position={appWindPosition}
                    rotation={[-Math.PI / 2, 0, -(Math.PI / 2 - appWindAngle)]}
                    speed={appWindSpeed}
                    color={oBlue}
                    fontSize={FONT_SIZE.APP_WIND}
                />
            )}
        </group>
    );

};

WindSector3D.propTypes = {
    outerRadius: PropTypes.number.isRequired
};

export default WindSector3D;
