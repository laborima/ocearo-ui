import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { fetchCurrentField, uniformCurrent, setCurrentScale } from './currentField';
import { getForecastHour, subscribeForecast, setSeries } from './forecastStore';
import { sampleWind } from './windField';
import { colorAt } from './colorMaps';
import { markerLattice } from './markerLattice';
import { getRenderProfile } from '../../utils/RenderProfile';

const PATHS = ['navigation.position', 'environment.current'];
export const DEFAULT_CURRENT_MAP = 'thermal';
// Arrow size on screen: shares of its distance to the camera
export const CURRENT_ARROW_LENGTH = 0.16;
export const CURRENT_ARROW_WIDTH = 0.028;
// Below this the field has no value at all: a land cell of the model
const NO_DATA = 0.005;

/**
 * The current forecast around the boat for the current layer, whatever the
 * base: the field (Open-Meteo / SMOC, or the boat's measured current
 * offline), the forecast hour, the top of the colour scale, and the speed at
 * the boat over the forecast for the curve of the forecast bar.
 */
export const useCurrentField = () => {
    const v = useSignalKPaths(PATHS);
    const position = v['navigation.position'];
    const measured = v['environment.current'];
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const [field, setField] = useState(null);
    const [top, setTop] = useState(1);
    const lat = position?.latitude;
    const lon = position?.longitude;
    const roundedKey = Number.isFinite(lat) ? `${lat.toFixed(1)},${lon.toFixed(1)}` : null;

    useEffect(() => {
        if (!roundedKey) return undefined;
        let cancelled = false;
        const [la, lo] = roundedKey.split(',').map(Number);
        fetchCurrentField(la, lo)
            .then((f) => { if (!cancelled) setField(f); })
            .catch(() => {
                if (!cancelled && Number.isFinite(measured?.drift) && Number.isFinite(measured?.setTrue)) {
                    setField(uniformCurrent(la, lo, measured.drift, measured.setTrue));
                }
            });
        return () => { cancelled = true; };
    }, [roundedKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Top of the colour scale, shared with the legend
    useEffect(() => {
        setTop(setCurrentScale(field) ?? 1); // eslint-disable-line react-hooks/set-state-in-effect
    }, [field]);
    useEffect(() => () => setCurrentScale(null), []);

    // Speed at the boat over the forecast, for the curve of the forecast bar
    const latKey = Number.isFinite(lat) ? Math.round(lat * 100) : null;
    const lonKey = Number.isFinite(lon) ? Math.round(lon * 100) : null;
    useEffect(() => {
        if (!field || latKey === null) return undefined;
        const east = (lon - field.origin.lon) * Math.PI / 180 * 6371000 * Math.cos(field.origin.lat * Math.PI / 180);
        const north = (lat - field.origin.lat) * Math.PI / 180 * 6371000;
        const values = Array.from({ length: field.hours }, (_, h) => {
            const f = sampleWind(field, east, north, h);
            return Math.hypot(f.u, f.v);
        });
        setSeries('current', { start: field.start, values, top: field.max });
        return () => setSeries('current', null);
    }, [field, latKey, lonKey]); // eslint-disable-line react-hooks/exhaustive-deps

    return { field, hour, top, lat, lon };
};

/**
 * Current markers (see FlowMarkers) fixed to the ground and spread evenly on
 * screen around the camera.
 *
 * @param {object} o
 * @param {object} o.field, o.hour, o.top - from useCurrentField
 * @param {string} o.mapName - colour map
 * @param {number} o.refE, o.refN - field metres of the frame's origin
 * @param {number} o.cx, o.cy, o.heightM - camera over the ground (field metres) and its height (m)
 * @param {number} o.scale - scene units per metre
 * @param {number} o.radius - metres around the origin
 * @param {number} o.z - height of the arrows in the frame (scene units)
 * @param {(x:number, y:number) => boolean} [o.isWater] - where the frame knows the seabed
 */
export const currentMarkers = ({ field, hour, top, mapName, refE, refN, cx, cy, heightM, scale, radius, z, isWater = () => true }) => {
    const step = Math.min(400, Math.max(25, Math.round(heightM * 0.9 / 5) * 5));
    // Fewer on a Pi
    const max = getRenderProfile().id === 'pi' ? 20 : 40;
    const nodes = markerLattice({ cx, cy, radius, step, near: step * 3, originE: refE, originN: refN, max });
    const items = [];
    nodes.forEach(({ e, n }) => {
        // None on the boat itself
        if (Math.hypot(e - refE, n - refN) < 15) return;
        const x = (e - refE) * scale;
        const y = (n - refN) * scale;
        if (!isWater(x, y)) return;
        const f = sampleWind(field, e, n, hour);
        const speed = Math.hypot(f.u, f.v);
        if (speed < NO_DATA) return;
        const later = sampleWind(field, e, n, hour + 1);
        const t = Math.min(1, speed / top);
        const [r, g, b] = colorAt(mapName, 0.28 + 0.72 * t);
        items.push({ key: `${e},${n}`, x, y, z, u: f.u, v: f.v, speed,
            trend: Math.hypot(later.u, later.v) - speed, color: [r / 255, g / 255, b / 255],
            len: CURRENT_ARROW_LENGTH * (0.4 + 0.6 * t) });
    });
    return items;
};
