import React from 'react';
import { useTranslation } from 'react-i18next';
import useTideCurve, { formatTideTime } from '../../hooks/useTideCurve';
import { vesselNow } from '../../utils/VesselClock';
import GlassPanel from './GlassPanel';
import Sparkline from './Sparkline';

/** Full-screen tide panel: height now, the day's curve with "now", next HW / LW */
const TidePanel = () => {
    const { t } = useTranslation();
    const { hasData, level, high, low, timeHigh, timeLow, coefficient, isRising, chartData } = useTideCurve();
    if (!hasData || chartData.length < 2) return null;

    const start = chartData[0].ms;
    const end = chartData[chartData.length - 1].ms;
    const marker = Math.min(1, Math.max(0, (vesselNow().getTime() - start) / (end - start)));

    return (
        <GlassPanel
            title={t('hud.tide')}
            right={coefficient ? <span className="text-caption font-semibold text-hud-secondary">C{Math.round(coefficient)}</span> : null}
            className="w-[19rem]"
        >
            <div className="flex items-baseline gap-2">
                <span className="text-value font-semibold text-hud-main">{Number.isFinite(level) ? level.toFixed(1) : '--'}</span>
                <span className="text-caption text-hud-secondary">m</span>
                <span className={`text-caption font-semibold uppercase tracking-widest ${isRising ? 'text-oGreen' : 'text-oBlue'}`}>
                    {isRising ? t('widgets.rising') : t('widgets.ebb')}
                </span>
            </div>
            <div className="my-2">
                <Sparkline values={chartData.map(p => p.height)} width={272} height={56}
                    color={isRising ? 'var(--color-oGreen)' : 'var(--color-oBlue)'} marker={marker} />
            </div>
            <div className="flex justify-between text-caption">
                <span className="text-hud-muted">{t('widgets.high')} <span className="text-hud-main font-semibold">{formatTideTime(timeHigh) || '--:--'}</span> {Number.isFinite(high) ? `${high.toFixed(1)} m` : ''}</span>
                <span className="text-hud-muted">{t('widgets.low')} <span className="text-hud-main font-semibold">{formatTideTime(timeLow) || '--:--'}</span> {Number.isFinite(low) ? `${low.toFixed(1)} m` : ''}</span>
            </div>
        </GlassPanel>
    );
};

export default TidePanel;
