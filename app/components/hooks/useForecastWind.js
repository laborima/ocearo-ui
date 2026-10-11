'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSignalKPath } from './useSignalK';
import { fetchWindField, sampleWind } from '../3dview/meteo/windField';
import signalKService from '../services/SignalKService';

const R = 6371000;

/**
 * Forecast true wind at the boat now, a stand-in while the anemometer gives
 * nothing: the Open-Meteo grid of the meteo layer, else the weather
 * observation of the boat's Signal K server (weather provider plugin).
 *
 * @returns {null|{ tws: number, twd: number }}  m/s, and the direction the
 *   wind comes FROM in radians (0..2π)
 */
const useForecastWind = () => {
    const position = useSignalKPath('navigation.position');
    const lat = position?.latitude;
    const lon = position?.longitude;
    const key = Number.isFinite(lat) ? `${lat.toFixed(1)},${lon.toFixed(1)}` : null;
    const [field, setField] = useState(null);
    const [observed, setObserved] = useState(null);

    useEffect(() => {
        if (!key) return undefined;
        let cancelled = false;
        const [la, lo] = key.split(',').map(Number);
        fetchWindField(la, lo).then((f) => { if (!cancelled) setField(f); }).catch(() => {
            signalKService.apiCall(`/signalk/v2/api/weather/observations?lat=${la}&lon=${lo}`)
                .then((obs) => {
                    const wind = (Array.isArray(obs) ? obs[0] : obs)?.wind;
                    if (!cancelled && wind && Number.isFinite(wind.speedTrue) && Number.isFinite(wind.directionTrue)) {
                        setObserved({ tws: wind.speedTrue, twd: wind.directionTrue });
                    }
                })
                .catch(() => {});
        });
        return () => { cancelled = true; };
    }, [key]);

    // Sampled again every ~10 minutes of forecast time at most (hourly data)
    const tenMinutes = Math.floor(Date.now() / 600000);
    return useMemo(() => {
        if (!field || field.source !== 'open-meteo' || !Number.isFinite(lat)) return observed && observed.tws > 0 ? observed : null;
        const east = (lon - field.origin.lon) * Math.PI / 180 * R * Math.cos(field.origin.lat * Math.PI / 180);
        const north = (lat - field.origin.lat) * Math.PI / 180 * R;
        const hour = Math.max(0, (Date.now() - field.start) / 3600000);
        const { u, v } = sampleWind(field, east, north, hour);
        const tws = Math.hypot(u, v);
        if (!(tws > 0)) return null;
        // (u, v) is where the wind blows to; it comes from the opposite side
        const twd = (Math.atan2(-u, -v) + 2 * Math.PI) % (2 * Math.PI);
        return { tws, twd };
    }, [field, observed, lat, lon, tenMinutes]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useForecastWind;
