import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { convertSpeedUnit, getSpeedUnitLabel } from '../../utils/UnitConversions';
import GlassPanel from './GlassPanel';
import Sparkline from './Sparkline';

const PATHS = [
    'environment.wind.speedTrue',
    'environment.wind.speedApparent',
    'environment.wind.directionTrue',
];
const SAMPLE_MS = 5000;
const WINDOW_SAMPLES = 120; // 10 minutes

/** Arrow pointing where the wind blows to, from its true direction (radians, FROM) */
const WindArrow = ({ from, size = 14 }) => (
    <svg width={size} height={size} viewBox="-8 -8 16 16" className="inline-block shrink-0"
        style={{ transform: `rotate(${(from * 180 / Math.PI + 180) % 360}deg)` }}>
        <path d="M0,-7 L5,5 L0,2 L-5,5 Z" fill="currentColor" />
    </svg>
);

/**
 * Wind panel, the third card next to the depth and the tide: true wind speed
 * (the apparent one when no true wind is computed), where it comes from, the
 * strongest gust and the last 10 minutes as a curve. `compact`: a small card
 * for phones and the split view, as wide as its slot.
 */
const WindPanel = ({ compact = false }) => {
    const { t } = useTranslation();
    const v = useSignalKPaths(PATHS);
    const trueSpeed = v['environment.wind.speedTrue'];
    const apparent = !Number.isFinite(trueSpeed);
    const speed = apparent ? v['environment.wind.speedApparent'] : trueSpeed;
    const from = v['environment.wind.directionTrue'];
    const speedRef = useRef(speed);
    const [history, setHistory] = useState([]);

    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => {
        const timer = setInterval(() => {
            const s = speedRef.current;
            if (!Number.isFinite(s)) return;
            setHistory(h => [...h.slice(-(WINDOW_SAMPLES - 1)), s]);
        }, SAMPLE_MS);
        return () => clearInterval(timer);
    }, []);

    if (!Number.isFinite(speed)) return null;

    const unit = getSpeedUnitLabel();
    const value = convertSpeedUnit(speed);
    const gust = history.length ? convertSpeedUnit(Math.max(...history, speed)) : null;
    const showGust = Number.isFinite(gust) && Number.isFinite(value) && gust - value >= 1;
    const direction = Number.isFinite(from) && (
        <span className="inline-flex items-center gap-1 text-caption font-semibold text-hud-secondary whitespace-nowrap">
            <WindArrow from={from} />
            {Math.round(((from * 180 / Math.PI) % 360 + 360) % 360)}°
        </span>
    );
    const label = apparent ? t('hud.windApparent') : t('hud.wind');

    if (compact) {
        return (
            <div className="tesla-card !p-3 !rounded-2xl select-none">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-caption font-semibold uppercase tracking-widest text-hud-muted truncate">{label}</span>
                    {direction}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-value font-semibold leading-tight text-hud-main">{value?.toFixed(1)}</span>
                    <span className="text-caption text-hud-secondary">{unit}</span>
                </div>
                <Sparkline fluid values={history} height={22} endDot />
            </div>
        );
    }

    return (
        <GlassPanel title={label} className="w-[17rem]">
            <div className="flex items-baseline gap-2">
                <span className="text-value font-semibold text-hud-main">{value?.toFixed(1)}</span>
                <span className="text-caption text-hud-secondary">{unit}</span>
                {direction}
                {showGust && <span className="text-caption text-hud-muted whitespace-nowrap">{t('hud.gust', { value: gust.toFixed(0) })}</span>}
            </div>
            <div className="mt-2">
                <Sparkline values={history} width={240} height={48} endDot />
            </div>
            <div className="text-caption text-hud-muted mt-1">{t('hud.depthHistory')}</div>
        </GlassPanel>
    );
};

export default WindPanel;
