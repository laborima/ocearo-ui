'use client';
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { getForecastHour, setForecastHour, subscribeForecast } from './forecastStore';
import { WINDY_SCALE } from './windField';

const KN = 1.943844;
const MAX_HOURS = 47;

/**
 * Meteo mode controls: the forecast hour (now .. +47 h) and the wind speed
 * legend in Windy's colours (knots).
 */
const MeteoBar = () => {
    const { t } = useTranslation();
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const at = new Date(Date.now() + hour * 3600000);
    const gradient = WINDY_SCALE
        .filter(([s]) => s <= 25)
        .map(([s, [r, g, b]]) => `rgb(${r},${g},${b}) ${(s / 25) * 100}%`).join(', ');

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
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(to right, ${gradient})` }} />
                <span className="text-caption text-hud-muted tabular-nums shrink-0">0 – {Math.round(25 * KN)} kn</span>
            </div>
        </div>
    );
};

export default MeteoBar;
