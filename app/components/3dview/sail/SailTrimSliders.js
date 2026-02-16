/**
 * SailTrimSliders Component - Three compass-style arc indicators showing
 * sail car positions at the same level and plane as the compass dial.
 *
 * Displays 3 indicators:
 *  - GV (Grand-Voile): mainsail traveller — position mode (port / centre / starboard)
 *  - FP (Foc Port): port jib car — fill mode (forward / aft)
 *  - FS (Foc Starboard): starboard jib car — fill mode (forward / aft)
 *
 * When a jib car is on the inactive (leeward) side it is fully greyed out.
 */
import React, { useMemo } from 'react';
import { Sphere, Text } from '@react-three/drei';
import { MathUtils } from 'three';
import { useSignalKPath } from '../../hooks/useSignalK';

const SLIDER_RADIUS = 4.2;
const ARC_SPAN_DEG = 30;
const MARKER_COUNT = 12;
const MARKER_SIZE = 0.09;
const CURSOR_MARKER_SIZE = 0.16;
const LABEL_OFFSET = 0.6;

const COLOR_MAIN = '#09bfff';
const COLOR_PORT = '#15bd6f';
const COLOR_STARBOARD = '#bf1515';
const COLOR_DIM = '#333333';
const COLOR_DISABLED = '#222222';

/**
 * Slider definitions.
 *
 * mode 'position': cursor slides along the arc (GV traveller: port/centre/starboard)
 * mode 'fill':     markers fill from start to value (jib car: forward/aft)
 */
const SLIDERS = [
    { label: 'GV', centerDeg: 180, color: COLOR_MAIN, key: 'mainCar', mode: 'position' },
    { label: 'FP', centerDeg: 260, color: COLOR_PORT, key: 'jibCar', side: 'port', mode: 'fill' },
    { label: 'FS', centerDeg: 100, color: COLOR_STARBOARD, key: 'jibCar', side: 'starboard', mode: 'fill' },
];

/**
 * Converts a compass degree to an XZ position on the slider ring.
 *
 * @param {number} deg - Compass bearing in degrees
 * @param {number} radius - Distance from center
 * @returns {Array<number>} [x, z] position
 */
function degToXZ(deg, radius) {
    const angle = MathUtils.degToRad(deg - 90);
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

/**
 * Position-mode arc slider for the mainsail traveller (GV).
 *
 * All markers form a dim track. A single bright cursor shows the car position.
 * Value 0 = port end, 0.5 = centre, 1 = starboard end.
 *
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {number} props.value - Position 0–1 (0=port, 0.5=centre, 1=starboard)
 * @param {number} props.centerDeg - Centre compass bearing for the arc
 * @param {string} props.color - Cursor color
 */
const PositionSlider = ({ label, value, centerDeg, color }) => {
    const clamped = Math.max(0, Math.min(1, value));

    const markers = useMemo(() => {
        const result = [];
        const startDeg = centerDeg - ARC_SPAN_DEG / 2;

        for (let i = 0; i <= MARKER_COUNT; i++) {
            const t = i / MARKER_COUNT;
            const deg = startDeg + ARC_SPAN_DEG * t;
            const [x, z] = degToXZ(deg, SLIDER_RADIUS);

            const dist = Math.abs(t - clamped);
            const isCursor = dist <= (0.5 / MARKER_COUNT);
            const isNear = dist <= (1.5 / MARKER_COUNT);
            const isCenter = Math.abs(t - 0.5) <= (0.5 / MARKER_COUNT);

            let markerColor = COLOR_DIM;
            let size = MARKER_SIZE;
            let opacity = 0.3;

            if (isCursor) {
                markerColor = color;
                size = CURSOR_MARKER_SIZE;
                opacity = 1.0;
            } else if (isNear) {
                markerColor = color;
                size = MARKER_SIZE;
                opacity = 0.5;
            } else if (isCenter) {
                opacity = 0.5;
            }

            result.push(
                <Sphere key={i} args={[size, 8, 8]} position={[x, 0, z]}>
                    <meshBasicMaterial color={markerColor} transparent opacity={opacity} />
                </Sphere>
            );
        }
        return result;
    }, [clamped, centerDeg, color]);

    const labelAngle = MathUtils.degToRad(centerDeg - 90);
    const labelX = (SLIDER_RADIUS - LABEL_OFFSET) * Math.cos(labelAngle);
    const labelZ = (SLIDER_RADIUS - LABEL_OFFSET) * Math.sin(labelAngle);

    return (
        <group>
            {markers}
            <Text
                position={[labelX, -0.4, labelZ]}
                color={color}
                fontSize={0.3}
                rotation={[-Math.PI / 2, 0, Math.PI / 2 - labelAngle]}
                font="fonts/Roboto-Bold.ttf"
                anchorY="middle"
                fillOpacity={0.9}
            >
                {label}
            </Text>
        </group>
    );
};

/**
 * Fill-mode arc slider for a jib car (FP / FS).
 *
 * When active, markers fill from the start up to the value position.
 * When inactive (leeward side), the entire arc is fully greyed out
 * with no colour at all.
 *
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {number} props.value - Car position 0–1
 * @param {number} props.centerDeg - Centre compass bearing for the arc
 * @param {string} props.color - Active fill color
 * @param {boolean} props.active - Whether this side is in use
 */
const FillSlider = ({ label, value, centerDeg, color, active }) => {
    const clamped = Math.max(0, Math.min(1, value));

    const markers = useMemo(() => {
        const result = [];
        const startDeg = centerDeg - ARC_SPAN_DEG / 2;

        for (let i = 0; i <= MARKER_COUNT; i++) {
            const t = i / MARKER_COUNT;
            const deg = startDeg + ARC_SPAN_DEG * t;
            const [x, z] = degToXZ(deg, SLIDER_RADIUS);

            let markerColor = COLOR_DISABLED;
            let size = MARKER_SIZE;
            let opacity = 0.15;

            if (active) {
                const isFilled = t <= clamped;
                const isCurrent = Math.abs(t - clamped) <= (0.5 / MARKER_COUNT);

                if (isCurrent) {
                    markerColor = color;
                    size = CURSOR_MARKER_SIZE;
                    opacity = 1.0;
                } else if (isFilled) {
                    markerColor = color;
                    opacity = 0.7;
                } else {
                    markerColor = COLOR_DIM;
                    opacity = 0.3;
                }
            }

            result.push(
                <Sphere key={i} args={[size, 8, 8]} position={[x, 0, z]}>
                    <meshBasicMaterial color={markerColor} transparent opacity={opacity} />
                </Sphere>
            );
        }
        return result;
    }, [clamped, centerDeg, color, active]);

    const labelAngle = MathUtils.degToRad(centerDeg - 90);
    const labelX = (SLIDER_RADIUS - LABEL_OFFSET) * Math.cos(labelAngle);
    const labelZ = (SLIDER_RADIUS - LABEL_OFFSET) * Math.sin(labelAngle);

    return (
        <group>
            {markers}
            <Text
                position={[labelX, -0.4, labelZ]}
                color={active ? color : COLOR_DISABLED}
                fontSize={0.3}
                rotation={[-Math.PI / 2, 0, Math.PI / 2 - labelAngle]}
                font="fonts/Roboto-Bold.ttf"
                anchorY="middle"
                fillOpacity={active ? 0.9 : 0.2}
            >
                {label}
            </Text>
        </group>
    );
};

/**
 * Computes recommended car positions from apparent wind angle and speed.
 *
 * GV traveller (mainCar): 0 = full port, 0.5 = centre, 1 = full starboard.
 * Wind from port → traveller eased to port (value &lt; 0.5).
 * Wind from starboard → traveller eased to starboard (value &gt; 0.5).
 *
 * Jib car (jibCar): 0 = forward, 1 = aft.
 * Upwind → car forward (low value). Reaching/running → car aft (high value).
 *
 * @param {number} windAngle - Apparent wind angle in radians
 * @param {number} windSpeed - Apparent wind speed in m/s
 * @returns {{ mainCar: number, jibCar: number }}
 */
function computeRecommendedCars(windAngle, windSpeed) {
    let angle = windAngle;
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;

    const isWindFromPort = angle > Math.PI;
    const absAngle = isWindFromPort ? (2 * Math.PI - angle) : angle;
    const upwindFactor = Math.max(0, 1 - absAngle / (Math.PI * 0.75));
    const speedFactor = Math.min(1, Math.abs(windSpeed) / 15);

    const deviation = (1 - upwindFactor) * 0.4 * speedFactor;
    const mainCar = isWindFromPort ? (0.5 - deviation) : (0.5 + deviation);

    const jibCar = Math.max(0.05, Math.min(1, (1 - upwindFactor) * 0.7 + speedFactor * 0.2 + 0.1));

    return { mainCar, jibCar };
}

/**
 * SailTrimSliders - Compass-style arc indicators for sail car positions.
 *
 * Rendered in the XZ plane at Y=0, matching the compass dial level.
 * Car positions are computed dynamically from apparent wind angle and speed.
 */
const SailTrimSliders = () => {
    const windAngle = useSignalKPath('environment.wind.angleApparent', 0);
    const windSpeed = useSignalKPath('environment.wind.speedApparent', 0);

    const isWindFromPort = useMemo(() => {
        let angle = windAngle;
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle > Math.PI;
    }, [windAngle]);

    const { mainCar, jibCar } = useMemo(
        () => computeRecommendedCars(windAngle, windSpeed),
        [windAngle, windSpeed]
    );

    return (
        <group>
            {SLIDERS.map((slider) => {
                const value = slider.key === 'mainCar' ? mainCar : jibCar;
                let active = true;
                if (slider.side === 'port') active = !isWindFromPort;
                if (slider.side === 'starboard') active = isWindFromPort;

                if (slider.mode === 'position') {
                    return (
                        <PositionSlider
                            key={slider.label}
                            label={slider.label}
                            value={value}
                            centerDeg={slider.centerDeg}
                            color={slider.color}
                        />
                    );
                }

                return (
                    <FillSlider
                        key={slider.label}
                        label={slider.label}
                        value={value}
                        centerDeg={slider.centerDeg}
                        color={slider.color}
                        active={active}
                    />
                );
            })}
        </group>
    );
};

export default SailTrimSliders;
