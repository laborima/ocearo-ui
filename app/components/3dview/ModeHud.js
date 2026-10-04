'use client';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import usePolarPerformance from '../hooks/usePolarPerformance';
import {
    convertSpeedUnit, getSpeedUnitLabel, convertDepthUnit, getDepthUnitLabel,
    convertDistanceUnit, getDistanceUnitLabel, toDegrees, radToDeg,
} from '../utils/UnitConversions';

const PATHS = [
    'navigation.headingTrue',
    'navigation.courseOverGroundTrue',
    'navigation.speedThroughWater',
    'environment.wind.speedTrue',
    'environment.wind.angleTrueWater',
    'environment.wind.speedApparent',
    'environment.wind.angleApparent',
    'environment.depth.belowKeel',
    'environment.depth.belowTransducer',
    'navigation.courseGreatCircle.nextPoint.distance',
    'navigation.courseGreatCircle.nextPoint.timeToGo',
    'performance.velocityMadeGood',
    'performance.polarSpeedRatio',
    'environment.current',
    'navigation.anchor.currentRadius',
    'navigation.anchor.maxRadius',
];

const fmt = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '--');
const fmtAngle = (rad) => (Number.isFinite(rad) ? `${String(toDegrees(rad)).padStart(3, '0')}°` : '--');
// Wind angle off the bow, with the side: 42°S / 42°P
const fmtWindAngle = (rad, t) => {
    if (!Number.isFinite(rad)) return '--';
    const deg = Math.round(Math.abs(radToDeg(rad)));
    return `${deg}°${rad >= 0 ? t('hud.starboardShort') : t('hud.portShort')}`;
};
const fmtDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
};

/** Mode shown by the HUD, from the toolbar / logbook states */
export const hudMode = (states) => {
    if (states.anchorWatch) return 'anchor';
    if (states.parkingMode) return 'harbour';
    if (states.racing) return 'racing';
    return 'route';
};

/**
 * Minimal HUD: four values that matter in the current mode, under the big
 * speed readout. Replaces the depth / tide / rudder / attitude gauges when the
 * HUD style is 'minimal' (the default).
 */
const ModeHud = ({ omitDepth = false }) => {
    const { t } = useTranslation();
    const { states } = useOcearoContext();
    const v = useSignalKPaths(PATHS);
    const perf = usePolarPerformance();
    const mode = hudMode(states);

    const items = useMemo(() => {
        const depth = v['environment.depth.belowKeel'] ?? v['environment.depth.belowTransducer'];
        const depthItem = { id: 'depth', label: t('hud.depth'), value: fmt(convertDepthUnit(depth)), unit: getDepthUnitLabel(), warn: Number.isFinite(depth) && depth < 3 };
        const tws = { label: t('hud.tws'), value: fmt(convertSpeedUnit(v['environment.wind.speedTrue'])), unit: getSpeedUnitLabel() };
        const heading = v['navigation.headingTrue'] ?? v['navigation.courseOverGroundTrue'];

        switch (mode) {
            case 'racing':
                return [
                    {
                        label: t('hud.polar'),
                        value: Number.isFinite(perf.ratio) ? Math.round(perf.ratio * 100) : '--',
                        unit: '%',
                        // e.g. −0.4 kn: what is missing to reach the polar
                        sub: Number.isFinite(perf.deltaKn) ? `${perf.deltaKn >= 0 ? '+' : '−'}${Math.abs(perf.deltaKn).toFixed(1)} kn` : null,
                        warn: Number.isFinite(perf.ratio) && perf.ratio < 0.8,
                    },
                    { label: t('hud.vmg'), value: fmt(convertSpeedUnit(v['performance.velocityMadeGood'])), unit: getSpeedUnitLabel() },
                    { label: t('hud.twa'), value: fmtWindAngle(v['environment.wind.angleTrueWater'], t) },
                    tws,
                ];
            case 'harbour':
                return [
                    depthItem,
                    { label: t('hud.stw'), value: fmt(convertSpeedUnit(v['navigation.speedThroughWater'])), unit: getSpeedUnitLabel() },
                    { label: t('hud.aws'), value: fmt(convertSpeedUnit(v['environment.wind.speedApparent'])), unit: getSpeedUnitLabel() },
                    { label: t('hud.awa'), value: fmtWindAngle(v['environment.wind.angleApparent'], t) },
                ];
            case 'anchor':
                return [
                    depthItem,
                    tws,
                    { label: t('hud.swing'), value: fmt(v['navigation.anchor.currentRadius'], 0), unit: 'm' },
                    { label: t('hud.alarmRadius'), value: fmt(v['navigation.anchor.maxRadius'], 0), unit: 'm' },
                ];
            default: {
                const wptDistance = v['navigation.courseGreatCircle.nextPoint.distance'];
                return [
                    { label: t('hud.heading'), value: fmtAngle(heading) },
                    tws,
                    depthItem,
                    Number.isFinite(wptDistance)
                        ? { label: t('hud.waypoint'), value: fmt(convertDistanceUnit(wptDistance)), unit: getDistanceUnitLabel(), sub: fmtDuration(v['navigation.courseGreatCircle.nextPoint.timeToGo']) }
                        : { label: t('hud.awa'), value: fmtWindAngle(v['environment.wind.angleApparent'], t) },
                ];
            }
        }
    }, [v, perf, mode, t]);
    // The full-screen depth panel already shows it
    const shown = omitDepth ? items.filter(item => item.id !== 'depth') : items;

    return (
        <div className="ml-3 mt-4 flex flex-col gap-3 select-none">
            {shown.map((item) => (
                <div key={item.label} className="leading-none">
                    <div className="text-caption font-semibold uppercase tracking-widest text-hud-muted">{item.label}</div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-value font-semibold ${item.warn ? 'text-oRed' : 'text-hud-main'}`}>{item.value}</span>
                        {item.unit && <span className="text-caption font-semibold text-hud-secondary">{item.unit}</span>}
                        {item.sub && item.sub !== '--' && <span className="text-caption text-hud-muted ml-1">{item.sub}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ModeHud;
