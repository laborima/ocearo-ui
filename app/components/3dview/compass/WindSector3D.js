/**
 * WindSector3D Component
 * 
 * A 3D component that displays wind indicators (true and apparent wind)
 * around a compass dial, showing direction and speed.
 * Designed for the Ocearo UI with touch-optimized interactions.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { convertSpeedUnit, oBlue, oGreen, oNight, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPaths } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { Vector3, DoubleSide } from 'three';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Configuration Constants
 */
const WIND_OFFSET = 0.7; // Distance offset from the compass edge
const FONT_SIZE = {
    TRUE_WIND: 1,  // Font size for true wind speed
    APP_WIND: 1    // Font size for apparent wind speed
};

/**
 * WindArrow Component
 * 
 * Renders a wind arrow with speed text at a specific position and rotation.
 * 
 * @param {Vector3} position - 3D position of the arrow
 * @param {Array} rotation - Rotation angles [x, y, z] in radians
 * @param {number} speed - Wind speed value to display
 * @param {string|number} color - Color of the arrow and text
 * @param {number} fontSize - Size of the speed text
 * @param {Array} textPosition - Position offset for the text [x, y, z]
 * @param {number} arrowSize - Scale factor for the entire arrow
 */
const WindArrow = ({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    speed,
    color,
    fontSize = 0.5,
    textPosition = [0, 0.8, 0],
    arrowSize = 1
}) => {
    const { nightMode } = useOcearoContext();
    const finalColor = color || (nightMode ? oNight : "#ffffff");
    
    return (
    <group position={position} rotation={rotation}>
        {/* Wind speed text */}
        <Text
            characters=".0123456789"
            color={finalColor}
            fontSize={fontSize * arrowSize}
            position={textPosition}
            font="fonts/Roboto-Bold.ttf"
            anchorX="center"
            anchorY="middle"
        >
            {speed.toFixed(1)}
        </Text>

        {/* Arrow head - Triangular shape pointing downward */}
        <mesh>
            <shapeGeometry args={[
                new THREE.Shape([
                    // Center point
                    new THREE.Vector2(0, 0),
                    // Right point (pointing down)
                    new THREE.Vector2(0.5 * arrowSize * Math.cos(5 * Math.PI / 6), 0.5 * arrowSize * Math.sin(5 * Math.PI / 6)),
                    // Tip point (at bottom)
                    new THREE.Vector2(0, -0.577 * arrowSize),
                    // Tip point (at bottom)
                    new THREE.Vector2(0, -0.577 * arrowSize),
                    // Left point (pointing down)
                    new THREE.Vector2(-0.5 * arrowSize * Math.cos(5 * Math.PI / 6), 0.5 * arrowSize * Math.sin(5 * Math.PI / 6)),
                    // Back to center
                    new THREE.Vector2(0, 0),
                ])
            ]} />
            <meshStandardMaterial color={finalColor} side={DoubleSide} />
        </mesh>
    </group>
);
};

WindArrow.propTypes = {
    position: PropTypes.oneOfType([
        PropTypes.instanceOf(Vector3),
        PropTypes.arrayOf(PropTypes.number)
    ]).isRequired,
    rotation: PropTypes.arrayOf(PropTypes.number).isRequired,
    speed: PropTypes.number.isRequired,
    color: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fontSize: PropTypes.number,
    textPosition: PropTypes.arrayOf(PropTypes.number),
    arrowSize: PropTypes.number
};

/**
 * WindSector3D Component
 * 
 * Displays wind indicators (true and apparent) around a compass dial.
 * 
 * @param {number} outerRadius - Outer radius of the compass dial
 */
const WindSector3D = ({ outerRadius }) => {
    // Read preferred paths from settings
    const preferredWindSpeed = configService.get('preferredWindSpeedPath') || 'speedTrue';
    const preferredWindDir = configService.get('preferredWindDirectionPath') || 'directionTrue';
    const preferredHeading = configService.get('preferredHeadingPath') || 'courseOverGroundTrue';

    // Subscribe to all relevant wind paths
    const windPaths = useMemo(() => [
        'environment.wind.angleTrueGround',
        'environment.wind.speedOverGround',
        'environment.wind.directionTrue',
        'environment.wind.speedTrue',
        'environment.wind.angleApparent',
        'environment.wind.speedApparent',
        'environment.wind.angleTrueWater',
        'navigation.headingTrue',
        'navigation.headingMagnetic',
        'navigation.courseOverGroundTrue',
        'navigation.courseOverGroundMagnetic'
    ], []);

    const skValues = useSignalKPaths(windPaths);

    // Compute true wind angle relative to vessel using preferred direction path.
    // - If preferred path is a relative angle (angleTrueWater, angleTrueGround): use directly.
    // - If preferred path is an absolute direction (directionTrue): subtract vessel heading.
    // Falls back through angleTrueGround → directionTrue → 0.
    const trueWindAngle = useMemo(() => {
        const isAbsolute = preferredWindDir === 'directionTrue';

        if (isAbsolute) {
            const dirTrue = skValues[`environment.wind.${preferredWindDir}`]
                ?? skValues['environment.wind.directionTrue'];
            if (dirTrue != null) {
                const heading = skValues[`navigation.${preferredHeading}`]
                    ?? skValues['navigation.headingTrue']
                    ?? skValues['navigation.courseOverGroundTrue']
                    ?? 0;
                return Math.PI / 2 - (dirTrue - heading);
            }
            // fallback to relative angle
            const relAngle = skValues['environment.wind.angleTrueGround']
                ?? skValues['environment.wind.angleTrueWater'];
            if (relAngle != null) return Math.PI / 2 - relAngle;
        } else {
            const relAngle = skValues[`environment.wind.${preferredWindDir}`]
                ?? skValues['environment.wind.angleTrueGround']
                ?? skValues['environment.wind.angleTrueWater'];
            if (relAngle != null) return Math.PI / 2 - relAngle;
            // fallback to absolute
            const dirTrue = skValues['environment.wind.directionTrue'];
            if (dirTrue != null) {
                const heading = skValues[`navigation.${preferredHeading}`]
                    ?? skValues['navigation.headingTrue']
                    ?? skValues['navigation.courseOverGroundTrue']
                    ?? 0;
                return Math.PI / 2 - (dirTrue - heading);
            }
        }
        return Math.PI / 2;
    }, [skValues, preferredWindDir, preferredHeading]);

    const trueWindSpeed = useMemo(() => {
        const speed = skValues[`environment.wind.${preferredWindSpeed}`]
            ?? skValues['environment.wind.speedOverGround']
            ?? skValues['environment.wind.speedTrue'];
        return convertSpeedUnit(speed) || 0;
    }, [skValues, preferredWindSpeed]);

    const appWindAngle = useMemo(() => (Math.PI / 2 - (skValues['environment.wind.angleApparent'] || 0)), [skValues]);
    const appWindSpeed = useMemo(() => convertSpeedUnit(skValues['environment.wind.speedApparent']) || 0, [skValues]);
    // Calculate positions for wind indicators based on their angles
    // These are memoized to avoid recalculation on every render
    const trueWindPosition = useMemo(
        () => new Vector3(
            (outerRadius + WIND_OFFSET) * Math.cos(trueWindAngle), 
            0, 
            -(outerRadius + WIND_OFFSET) * Math.sin(trueWindAngle)
        ),
        [outerRadius, trueWindAngle]
    );

    const appWindPosition = useMemo(
        () => new Vector3(
            (outerRadius + WIND_OFFSET) * Math.cos(appWindAngle), 
            0, 
            -(outerRadius + WIND_OFFSET) * Math.sin(appWindAngle)
        ),
        [outerRadius, appWindAngle]
    );

    return (
        <group>
            {/* True wind indicator - only shown when speed > 0 */}
            {trueWindSpeed > 0 && (
                <WindArrow
                    position={trueWindPosition}
                    rotation={[-Math.PI / 2, 0, -(Math.PI / 2 - trueWindAngle)]}
                    speed={trueWindSpeed}
                    color={oGreen}
                    fontSize={FONT_SIZE.TRUE_WIND}
                />
            )}

            {/* Apparent wind indicator - only shown when speed > 0 */}
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
