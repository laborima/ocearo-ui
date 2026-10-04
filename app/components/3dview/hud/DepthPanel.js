import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { convertDepthUnit, getDepthUnitLabel } from '../../utils/UnitConversions';
import GlassPanel from './GlassPanel';
import Sparkline from './Sparkline';

const PATHS = ['environment.depth.belowKeel', 'environment.depth.belowTransducer', 'environment.depth.belowSurface'];
const SAMPLE_MS = 5000;
const WINDOW_SAMPLES = 120; // 10 minutes
const SHALLOW_M = 3;

/**
 * Full-screen depth panel: depth now, the last 10 minutes as a profile (the
 * seabed we just sailed over) and how fast it is shoaling.
 */
const DepthPanel = () => {
    const { t } = useTranslation();
    const v = useSignalKPaths(PATHS);
    const depth = v['environment.depth.belowKeel'] ?? v['environment.depth.belowTransducer'] ?? v['environment.depth.belowSurface'];
    const depthRef = useRef(depth);
    const [history, setHistory] = useState([]);

    useEffect(() => { depthRef.current = depth; }, [depth]);
    useEffect(() => {
        const timer = setInterval(() => {
            const d = depthRef.current;
            if (!Number.isFinite(d)) return;
            setHistory(h => [...h.slice(-(WINDOW_SAMPLES - 1)), d]);
        }, SAMPLE_MS);
        return () => clearInterval(timer);
    }, []);

    if (!Number.isFinite(depth)) return null;

    // Trend over the last minute, metres per minute (negative: shoaling)
    const recent = history.slice(-12);
    const trend = recent.length >= 2 ? (recent[recent.length - 1] - recent[0]) / ((recent.length - 1) * SAMPLE_MS / 60000) : null;
    const shallow = depth < SHALLOW_M;

    return (
        <GlassPanel title={t('hud.depth')} className="w-[17rem]">
            <div className="flex items-baseline gap-2">
                <span className={`text-value font-semibold ${shallow ? 'text-oRed' : 'text-hud-main'}`}>{convertDepthUnit(depth)?.toFixed(1)}</span>
                <span className="text-caption text-hud-secondary">{getDepthUnitLabel()}</span>
                {Number.isFinite(trend) && Math.abs(trend) >= 0.05 && (
                    <span className={`text-caption font-semibold ${trend < 0 ? 'text-oYellow' : 'text-hud-secondary'}`}>
                        {trend < 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)} m/min
                    </span>
                )}
            </div>
            <div className="mt-2">
                <Sparkline values={history} width={240} height={48} invert endDot
                    color={shallow ? 'var(--color-oRed)' : 'var(--color-oBlue)'} />
            </div>
            <div className="text-caption text-hud-muted mt-1">{t('hud.depthHistory')}</div>
        </GlassPanel>
    );
};

export default DepthPanel;
