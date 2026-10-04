import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faTemperatureHalf, faWater, faBatteryHalf, faGauge } from '@fortawesome/free-solid-svg-icons';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { useWeather } from '../../context/WeatherContext';
import { computeSunEvents, formatClockTime } from '../../utils/SunUtils';
import { vesselNow } from '../../utils/VesselClock';
import { convertTemperatureUnit, getTemperatureUnitLabel, convertPressure } from '../../utils/UnitConversions';

const PATHS = [
    'navigation.position',
    'environment.water.temperature',
    'electrical.batteries.1.capacity.stateOfCharge',
    'electrical.batteries.1.voltage',
    'electrical.batteries.0.voltage',
];

const Chip = ({ icon, iconClass = 'text-hud-secondary', label, value, unit }) => (
    <div className="flex items-center gap-3 rounded-xl border border-hud bg-hud-bg backdrop-blur-md shadow-soft px-3 py-2 min-w-[11rem]">
        <FontAwesomeIcon icon={icon} className={`${iconClass} text-sm w-4`} />
        <div className="leading-tight">
            <div className="text-caption font-semibold uppercase tracking-widest text-hud-muted">{label}</div>
            <div className="text-label font-semibold text-hud-main">
                {value}{unit && <span className="text-caption text-hud-secondary ml-1">{unit}</span>}
            </div>
        </div>
    </div>
);

/**
 * Dashlets of the full-screen 3D view, as a column of translucent chips:
 * next sunrise / sunset, air and water temperature, pressure, battery.
 * Only what has data is shown.
 */
const InfoStack = () => {
    const { t } = useTranslation();
    const v = useSignalKPaths(PATHS);
    const { getCurrentWeather } = useWeather();
    const [now, setNow] = useState(() => vesselNow());

    useEffect(() => {
        const timer = setInterval(() => setNow(vesselNow()), 60000);
        return () => clearInterval(timer);
    }, []);

    const position = v['navigation.position'];
    const sun = computeSunEvents(position?.latitude, position?.longitude, now);
    const nextSun = sun && [
        { at: sun.sunrise, rise: true },
        { at: sun.sunset, rise: false },
    ].filter(e => e.at && e.at > now).sort((a, b) => a.at - b.at)[0];

    const weather = getCurrentWeather();
    const air = convertTemperatureUnit(weather?.temperature);
    const water = convertTemperatureUnit(v['environment.water.temperature']);
    const pressure = convertPressure(weather?.pressure);
    const soc = v['electrical.batteries.1.capacity.stateOfCharge'];
    const voltage = v['electrical.batteries.1.voltage'] ?? v['electrical.batteries.0.voltage'];

    const chips = [
        nextSun && { key: 'sun', icon: nextSun.rise ? faSun : faMoon, iconClass: 'text-oYellow', label: nextSun.rise ? t('hud.sunrise') : t('hud.sunset'), value: formatClockTime(nextSun.at) },
        Number.isFinite(air) && { key: 'air', icon: faTemperatureHalf, label: t('hud.air'), value: air.toFixed(0), unit: getTemperatureUnitLabel() },
        Number.isFinite(water) && { key: 'water', icon: faWater, iconClass: 'text-oBlue', label: t('hud.water'), value: water.toFixed(0), unit: getTemperatureUnitLabel() },
        Number.isFinite(pressure) && { key: 'pressure', icon: faGauge, label: t('hud.pressure'), value: Math.round(pressure), unit: 'hPa' },
        (Number.isFinite(soc) || Number.isFinite(voltage)) && {
            key: 'battery', icon: faBatteryHalf, iconClass: 'text-oGreen', label: t('hud.battery'),
            value: Number.isFinite(soc) ? `${Math.round(soc * 100)} %` : voltage.toFixed(1), unit: Number.isFinite(soc) ? null : 'V',
        },
    ].filter(Boolean);

    return (
        <div className="flex flex-col gap-2 items-end">
            {chips.map(({ key, ...chip }) => <Chip key={key} {...chip} />)}
        </div>
    );
};

export default InfoStack;
