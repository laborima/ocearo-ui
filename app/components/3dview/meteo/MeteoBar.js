'use client';
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { getForecastHour, setForecastHour, subscribeForecast } from './forecastStore';
import { WINDY_SCALE } from './windField';
import { cssGradient } from './colorMaps';
import configService from '../../settings/ConfigService';
import { DEFAULT_CURRENT_MAP } from '../ocean/CurrentVolume';
import { WIND_MAP_TOP } from './WindLayer3D';
import { getCurrentScale, subscribeCurrentScale } from './currentField';

const KN = 1.943844;
const MAX_HOURS = 47;

/**
 * Forecast controls: the forecast hour (now .. +47 h), shared by the wind and
 * current layers, and the legend of each layer shown (knots).
 */
const MeteoBar = ({ wind = true, current = false }) => {
    const { t } = useTranslation();
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const currentTop = useSyncExternalStore(subscribeCurrentScale, getCurrentScale, getCurrentScale);
    const at = new Date(Date.now() + hour * 3600000);
    // Windy's scale, or the colour map chosen for the wind (0 .. WIND_MAP_TOP)
    const windMap = configService.get('windColorMap') || 'windy';
    const windTop = windMap === 'windy' ? 25 : WIND_MAP_TOP;
    const gradient = windMap === 'windy'
        ? `linear-gradient(to right, ${WINDY_SCALE.filter(([s]) => s <= 25).map(([s, [r, g, b]]) => `rgb(${r},${g},${b}) ${(s / 25) * 100}%`).join(', ')})`
        : cssGradient(windMap);

    return (
        <div className="hud-halo flex flex-col gap-1 px-3 py-2 rounded-2xl bg-hud-bg/80 backdrop-blur select-none w-[min(30rem,100%)]">
            <div className="flex items-center gap-3">
                <span className="text-caption font-semibold uppercase tracking-widest text-hud-muted shrink-0">{t('meteo.forecast')}</span>
                <input type="range" min={0} max={MAX_HOURS} step={1} value={hour}
                    onChange={(e) => setForecastHour(Number(e.target.value))}
                    aria-label={t('meteo.forecast')} className="flex-1 min-w-0 accent-oBlue" />
                <span className="text-label font-semibold tabular-nums text-hud-main shrink-0">
                    {hour === 0 ? t('meteo.now') : `+${hour} h · ${at.toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </span>
            </div>
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
