/**
 * SailTrimUtils - Pure utility functions for sail trim computation.
 *
 * All functions are stateless and suitable for use inside useFrame or useEffect
 * without triggering re-renders.
 */

/**
 * Computes the recommended reef level from true wind speed.
 *
 * @param {number} twsMs - True wind speed in m/s
 * @returns {number} Reef level: 0, 1, or 2
 */
export function computeReefLevel(twsMs) {
    const twsKnots = twsMs * 1.9438444924574;
    if (twsKnots > 25) return 2;
    if (twsKnots > 18) return 1;
    return 0;
}

/**
 * Height reduction factors per reef level.
 * Reef 0 = full sail, Reef 1 = 80%, Reef 2 = 60%.
 */
const REEF_HEIGHT_FACTORS = [1.0, 0.80, 0.60];

/**
 * Returns the height factor for a given reef level.
 *
 * @param {number} level - Reef level (0, 1, or 2)
 * @returns {number} Multiplicative height factor
 */
export function getReefHeightFactor(level) {
    return REEF_HEIGHT_FACTORS[Math.min(Math.max(level, 0), 2)];
}

/**
 * Computes sail camber (draft depth ratio) from car position and tension.
 *
 * A higher car value flattens the sail; higher tension also flattens it.
 *
 * @param {number} carPosition - Car position 0 (inboard/deep) to 1 (outboard/flat)
 * @param {number} tension - General tension 0 (loose) to 1 (tight)
 * @returns {number} Camber ratio (0 = flat, 1 = maximum draft)
 */
export function computeCamber(carPosition, tension) {
    const baseCamber = 1.0 - carPosition * 0.6;
    const tensionEffect = tension * 0.3;
    return Math.max(0.05, Math.min(1.0, baseCamber - tensionEffect));
}

/**
 * Computes sail twist angle in radians from car position and wind speed.
 *
 * Lower car position and lighter wind produce more twist.
 *
 * @param {number} carPosition - Car position 0–1
 * @param {number} twsMs - True wind speed in m/s
 * @returns {number} Twist angle in radians (0 to ~PI/6)
 */
export function computeTwist(carPosition, twsMs) {
    const twsKnots = twsMs * 1.9438444924574;
    const windFactor = Math.max(0, 1.0 - twsKnots / 30.0);
    const carFactor = 1.0 - carPosition;
    return (Math.PI / 6) * windFactor * carFactor;
}

/**
 * Computes tension value (0–1) for a specific control line.
 *
 * @param {Object} windData - Wind data object
 * @param {number} windData.tws - True wind speed in m/s
 * @param {number} windData.awa - Apparent wind angle in radians
 * @param {Object} sailTrim - Sail trim state
 * @param {number} sailTrim.tension - General tension slider value (0–1)
 * @param {number} sailTrim.mainCar - Mainsail car position (0–1)
 * @param {number} sailTrim.jibCar - Jib car position (0–1)
 * @param {string} lineType - One of 'mainSheet', 'jibSheet', 'vang', 'cunningham'
 * @returns {number} Tension value from 0 (no tension) to 1 (maximum)
 */
export function computeTension(windData, sailTrim, lineType) {
    const twsKnots = (windData.tws || 0) * 1.9438444924574;
    const windPressure = Math.min(1.0, twsKnots / 30.0);
    const baseTension = sailTrim.tension || 0.5;

    switch (lineType) {
        case 'mainSheet': {
            const carEffect = sailTrim.mainCar * 0.3;
            return Math.min(1.0, windPressure * 0.5 + baseTension * 0.3 + carEffect);
        }
        case 'jibSheet': {
            const carEffect = sailTrim.jibCar * 0.3;
            return Math.min(1.0, windPressure * 0.5 + baseTension * 0.3 + carEffect);
        }
        case 'vang': {
            return Math.min(1.0, windPressure * 0.6 + baseTension * 0.4);
        }
        case 'cunningham': {
            return Math.min(1.0, windPressure * 0.4 + baseTension * 0.6);
        }
        default:
            return baseTension;
    }
}

/**
 * Interpolates a color from green (0) through orange (0.5) to red (1)
 * based on a tension value.
 *
 * @param {number} t - Tension value 0–1
 * @returns {{r: number, g: number, b: number}} RGB color components (0–1)
 */
export function tensionToColor(t) {
    const clamped = Math.max(0, Math.min(1, t));
    if (clamped <= 0.5) {
        const f = clamped * 2;
        return { r: f, g: 1.0 - f * 0.3, b: 0.0 };
    }
    const f = (clamped - 0.5) * 2;
    return { r: 1.0, g: 0.7 * (1.0 - f), b: 0.0 };
}

/**
 * Master orchestrator function that computes all sail trim outputs
 * from the current wind data and slider state.
 *
 * @param {Object} params
 * @param {number} params.tws - True wind speed in m/s
 * @param {number} params.twa - True wind angle in radians
 * @param {number} params.awa - Apparent wind angle in radians
 * @param {number} params.mainCar - Mainsail car position (0–1)
 * @param {number} params.jibCar - Jib car position (0–1)
 * @param {number} params.tension - General tension (0–1)
 * @returns {Object} Computed trim outputs
 */
export function updateSailTrim({ tws = 0, twa = 0, awa = 0, mainCar = 0.5, jibCar = 0.5, tension = 0.5 }) {
    const reefLevel = computeReefLevel(tws);
    const reefHeightFactor = getReefHeightFactor(reefLevel);

    const mainCamber = computeCamber(mainCar, tension);
    const jibCamber = computeCamber(jibCar, tension);

    const mainTwist = computeTwist(mainCar, tws);
    const jibTwist = computeTwist(jibCar, tws);

    const windData = { tws, twa, awa };
    const sailTrim = { mainCar, jibCar, tension };

    const tensions = {
        mainSheet: computeTension(windData, sailTrim, 'mainSheet'),
        jibSheet: computeTension(windData, sailTrim, 'jibSheet'),
        vang: computeTension(windData, sailTrim, 'vang'),
        cunningham: computeTension(windData, sailTrim, 'cunningham'),
    };

    const tensionColors = {
        mainSheet: tensionToColor(tensions.mainSheet),
        jibSheet: tensionToColor(tensions.jibSheet),
        vang: tensionToColor(tensions.vang),
        cunningham: tensionToColor(tensions.cunningham),
    };

    return {
        reefLevel,
        reefHeightFactor,
        mainCamber,
        jibCamber,
        mainTwist,
        jibTwist,
        tensions,
        tensionColors,
    };
}
