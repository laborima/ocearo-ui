import React from 'react';
import { useTranslation } from 'react-i18next';
import useTideCurve, { formatTideTime } from '../../hooks/useTideCurve';
import { vesselNow } from '../../utils/VesselClock';
import GlassPanel from './GlassPanel';
import Sparkline from './Sparkline';

/**
 * Tide panel: height now, the day's curve with "now", next HW / LW.
 * `compact`: a small card for phones and the split view.
 */
const TidePanel = ({ compact = false }) => {
    const { t } = useTranslation();
    const { hasData, level, high, low, timeHigh, timeLow, coefficient, isRising, chartData } = useTideCurve();
    if (!hasData || chartData.length < 2) return null;

    const start = chartData[0].ms;
    const end = chartData[chartData.length - 1].ms;
    const marker = Math.min(1, Math.max(0, (vesselNow().getTime() - start) / (end - start)));
    // Without a measured height, read the curve at "now"
    const pos = marker * (chartData.length - 1);
    const i = Math.min(chartData.length - 2, Math.floor(pos));
    const estimated = chartData[i].height + (chartData[i + 1].height - chartData[i].height) * (pos - i);
    const shown = Number.isFinite(level) ? level : estimated;

    const color = isRising ? 'var(--color-oGreen)' : 'var(--color-oBlue)';
    const direction = (
        <span className={`text-caption font-semibold uppercase tracking-wide whitespace-nowrap ${isRising ? 'text-oGreen' : 'text-oBlue'}`}>
            {isRising ? t('widgets.rising') : t('widgets.ebb')}
        </span>
    );

    if (compact) {
        // The next turn of the tide, when the times are known
        const next = isRising ? { label: t('widgets.high'), time: formatTideTime(timeHigh) } : { label: t('widgets.low'), time: formatTideTime(timeLow) };
        return (
            <div className="tesla-card !p-3 !rounded-2xl select-none">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-caption font-semibold uppercase tracking-widest text-hud-muted truncate">
                        {t('hud.tide')}{coefficient ? ` · C${Math.round(coefficient)}` : ''}
                    </span>
                    {next.time && <span className="text-caption text-hud-muted whitespace-nowrap">{next.label} <span className="font-semibold text-hud-main">{next.time}</span></span>}
                </div>
                <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-value font-semibold leading-tight text-hud-main">{Number.isFinite(shown) ? shown.toFixed(1) : '--'}</span>
                    <span className="text-caption text-hud-secondary mr-1">m</span>
                    {direction}
                </div>
                <Sparkline fluid values={chartData.map(p => p.height)} height={22} color={color} marker={marker} />
            </div>
        );
    }

    return (
        <GlassPanel
            title={t('hud.tide')}
            right={coefficient ? <span className="text-caption font-semibold text-hud-secondary">C{Math.round(coefficient)}</span> : null}
            className="w-[19rem]"
        >
            <div className="flex items-baseline gap-2">
                <span className="text-value font-semibold text-hud-main">{Number.isFinite(shown) ? shown.toFixed(1) : '--'}</span>
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
