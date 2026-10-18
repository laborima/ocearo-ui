'use client';
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { getForecastHour, setForecastHour, subscribeForecast, getSeries, subscribeSeries } from './forecastStore';
import { WINDY_SCALE } from './windField';
import { cssGradient } from './colorMaps';
import configService from '../../settings/ConfigService';
import { DEFAULT_CURRENT_MAP } from '../ocean/CurrentVolume';
import { WIND_MAP_TOP } from './WindLayer3D';
import { getCurrentScale, subscribeCurrentScale } from './currentField';

const KN = 1.943844;
const MAX_HOURS = 47;

/** Polyline points of a series over 0..MAX_HOURS (x) and 0..1 (y, top at 0) */
const curve = (values, top) => values.slice(0, MAX_HOURS + 1)
    .map((v, h) => `${h},${(1 - Math.min(1, v / (top || 1)) * 0.9).toFixed(3)}`).join(' ');

/**
 * Forecast controls: the forecast hour (now .. +47 h), shared by the wind and
 * current layers, the speed at the boat over the two days for each layer
 * shown (its own scale: the shape of the tide or of a front, at a glance),
 * and the legend of each layer (knots).
 */
const MeteoBar = ({ wind = true, current = false }) => {
    const { t } = useTranslation();
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const currentTop = useSyncExternalStore(subscribeCurrentScale, getCurrentScale, getCurrentScale);
    const series = useSyncExternalStore(subscribeSeries, getSeries, getSeries);
    // A curve needs a forecast: not the boat's own single value when offline
    const windSeries = wind && series.wind?.values.length > 1 ? series.wind : null;
    const currentSeries = current && series.current?.values.length > 1 ? series.current : null;
    const at = new Date(Date.now() + hour * 3600000);
    // Windy's scale, or the colour map chosen for the wind (0 .. WIND_MAP_TOP)
    const windMap = configService.get('windColorMap') || 'windy';
    const windTop = windMap === 'windy' ? 25 : WIND_MAP_TOP;
    const gradient = windMap === 'windy'
        ? `linear-gradient(to right, ${WINDY_SCALE.filter(([s]) => s <= 25).map(([s, [r, g, b]]) => `rgb(${r},${g},${b}) ${(s / 25) * 100}%`).join(', ')})`
        : cssGradient(windMap);

    return (
        <div className="hud-halo flex flex-col gap-1 px-3 py-2 rounded-2xl bg-hud-bg/80 backdrop-blur select-none w-full">
            <div className="flex items-center gap-3">
                <span className="text-caption font-semibold uppercase tracking-widest text-hud-muted shrink-0">{t('meteo.forecast')}</span>
                <input type="range" min={0} max={MAX_HOURS} step={1} value={hour}
                    onChange={(e) => setForecastHour(Number(e.target.value))}
                    aria-label={t('meteo.forecast')} className="flex-1 min-w-0 accent-oBlue" />
                <span className="text-label font-semibold tabular-nums text-hud-main shrink-0">
                    {hour === 0 ? t('meteo.now') : `+${hour} h · ${at.toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </span>
            </div>
            {(windSeries || currentSeries) && (
                <div className="flex items-center gap-2">
                    <svg viewBox={`0 0 ${MAX_HOURS} 1`} preserveAspectRatio="none" className="flex-1 min-w-0 h-8" aria-hidden="true">
                        {windSeries && <polyline points={curve(windSeries.values, windSeries.top)} fill="none" className="stroke-oGreen" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                        {currentSeries && <polyline points={curve(currentSeries.values, currentSeries.top)} fill="none" className="stroke-oYellow" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                        <line x1={hour} x2={hour} y1="0" y2="1" className="stroke-hud-main" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <div className="flex flex-col items-end shrink-0 text-caption font-semibold tabular-nums leading-tight">
                        {windSeries && <span className="text-oGreen">{t('toolbar.layerWind')} {Math.round((windSeries.values[hour] ?? 0) * KN)} kn</span>}
                        {currentSeries && <span className="text-oYellow">{t('toolbar.layerCurrent')} {((currentSeries.values[hour] ?? 0) * KN).toFixed(1)} kn</span>}
                    </div>
                </div>
            )}
            {wind && (
                <div className="flex items-center gap-2">
                    {current && <span className="text-caption text-hud-muted w-14 shrink-0">{t('toolbar.layerWind')}</span>}
                    <div className="flex-1 h-2 rounded-full" style={{ background: gradient }} />
                    <span className="text-caption text-hud-muted tabular-nums shrink-0 w-14 text-right">0 – {Math.round(windTop * KN)} kn</span>
                </div>
            )}
            {current && currentTop && (
                <div className="flex items-center gap-2">
                    {wind && <span className="text-caption text-hud-muted w-14 shrink-0">{t('toolbar.layerCurrent')}</span>}
                    <div className="flex-1 h-2 rounded-full" style={{ background: cssGradient(configService.get('currentColorMap') || DEFAULT_CURRENT_MAP) }} />
                    <span className="text-caption text-hud-muted tabular-nums shrink-0 w-14 text-right">0 – {Number((currentTop * KN).toFixed(2))} kn</span>
                </div>
            )}
        </div>
    );
};

export default MeteoBar;
