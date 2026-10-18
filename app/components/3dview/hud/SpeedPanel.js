import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { convertSpeedUnit, getSpeedUnitLabel } from '../../utils/UnitConversions';
import GlassPanel from './GlassPanel';
import Sparkline from './Sparkline';

const PATHS = ['navigation.speedOverGround', 'navigation.speedThroughWater'];
const SAMPLE_MS = 5000;
const WINDOW_SAMPLES = 120; // 10 minutes

/**
 * Speed panel: speed over the ground, through the water beside it (their gap
 * is the current along the course), the best of the last 10 minutes and its
 * curve.
 */
const SpeedPanel = () => {
    const { t } = useTranslation();
    const v = useSignalKPaths(PATHS);
    const sog = v['navigation.speedOverGround'];
    const stw = v['navigation.speedThroughWater'];
    const sogRef = useRef(sog);
    const [history, setHistory] = useState([]);

    useEffect(() => { sogRef.current = sog; }, [sog]);
    useEffect(() => {
        const timer = setInterval(() => {
            const s = sogRef.current;
            if (!Number.isFinite(s)) return;
            setHistory(h => [...h.slice(-(WINDOW_SAMPLES - 1)), s]);
        }, SAMPLE_MS);
        return () => clearInterval(timer);
    }, []);

    const unit = getSpeedUnitLabel();
    if (!Number.isFinite(sog)) {
        return <GlassPanel title={t('hud.speed')} className="w-[17rem]"><span className="text-value font-semibold text-hud-muted">--</span></GlassPanel>;
    }
    const best = history.length ? convertSpeedUnit(Math.max(...history, sog)) : null;

    return (
        <GlassPanel title={t('hud.speed')} className="w-[17rem]">
            <div className="flex items-baseline gap-2">
                <span className="text-value font-semibold text-hud-main">{convertSpeedUnit(sog)?.toFixed(1)}</span>
                <span className="text-caption text-hud-secondary">{unit}</span>
                {Number.isFinite(stw) && (
                    <span className="text-caption text-hud-secondary whitespace-nowrap">{t('hud.stw')} {convertSpeedUnit(stw)?.toFixed(1)}</span>
                )}
                {Number.isFinite(best) && <span className="text-caption text-hud-muted whitespace-nowrap">{t('hud.best', { value: best.toFixed(1) })}</span>}
            </div>
            <div className="mt-2">
                <Sparkline values={history} width={240} height={48} endDot color="var(--color-oGreen)" />
            </div>
            <div className="text-caption text-hud-muted mt-1">{t('hud.depthHistory')}</div>
        </GlassPanel>
    );
};

export default SpeedPanel;
