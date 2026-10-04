import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { computeSunEvents, formatClockTime, parseSunTime } from '../../utils/SunUtils';
import { vesselNow } from '../../utils/VesselClock';

const PATHS = [
    'navigation.position',
    'environment.sun.sunrise',
    'environment.sun.sunset',
    'environment.outside.uvIndex',
];

// WHO UV index bands: low (< 3), moderate (3-5), high and above (6+)
const uvClass = (uv) => {
    if (uv < 3) return 'text-oGreen';
    if (uv < 6) return 'text-oYellow';
    return 'text-oRed';
};

/**
 * Clock of the 3D view header, with what the toolbar does not show: the next
 * sunrise or sunset (from the server when it publishes them, else computed
 * from the position) and the UV index when a sensor or forecast provides it.
 */
const SkyClock = ({ compact = false }) => {
    const { t } = useTranslation();
    const v = useSignalKPaths(PATHS);
    const [now, setNow] = useState(() => vesselNow());

    useEffect(() => {
        const id = setInterval(() => setNow(vesselNow()), 30000);
        return () => clearInterval(id);
    }, []);

    const position = v['navigation.position'];
    const computed = computeSunEvents(position?.latitude, position?.longitude, now);
    const sunrise = parseSunTime(v['environment.sun.sunrise'], now) ?? computed?.sunrise;
    const sunset = parseSunTime(v['environment.sun.sunset'], now) ?? computed?.sunset;
    const nextSun = [
        { at: sunrise, rise: true },
        { at: sunset, rise: false },
    ].filter(e => e.at && e.at > now).sort((a, b) => a.at - b.at)[0];
    const uv = v['environment.outside.uvIndex'];

    return (
        <div className="flex items-center gap-3 text-label font-semibold tracking-[0.15em] text-hud-muted">
            {nextSun && !compact && (
                <span className="flex items-center gap-1.5" title={nextSun.rise ? t('hud.sunrise') : t('hud.sunset')}>
                    <FontAwesomeIcon icon={nextSun.rise ? faSun : faMoon} className="text-oYellow text-sm" />
                    {formatClockTime(nextSun.at)}
                </span>
            )}
            {Number.isFinite(uv) && !compact && (
                <span className="flex items-center gap-1" title={t('environmental.uvIndex')}>
                    <span className={`text-caption ${uvClass(uv)}`}>UV</span>
                    {uv.toFixed(0)}
                </span>
            )}
            <span className="uppercase tracking-[0.2em]">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};

export default SkyClock;
