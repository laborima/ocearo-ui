'use client';
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toDegrees, MS_TO_KNOTS, convertSpeedUnit, getSpeedUnitLabel, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faTachometerAlt, faCompass, faWater, faWind } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const SpeedWidget = React.memo(() => {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const sogValue = useSignalKPath('navigation.speedOverGround');
  const stwValue = useSignalKPath('navigation.speedThroughWater');
  const headingValue = useSignalKPath('navigation.headingTrue');
  const cogValue = useSignalKPath('navigation.courseOverGroundTrue');
  const windSpeedValue = useSignalKPath('environment.wind.speedApparent');

  const { nightMode } = useOcearoContext();
  const speedData = useMemo(() => {
    const hasData = sogValue !== null || stwValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    const sog = sogValue || (debugMode ? 5.2 : null);
    const stw = stwValue || (debugMode ? 4.8 : null);
    const heading = headingValue || (debugMode ? 0.52 : null);
    const cog = cogValue || (debugMode ? 0.61 : null);
    const windSpeed = windSpeedValue || (debugMode ? 12.5 : null);
    
    return {
      hasData: true,
      sog: sog !== null ? convertSpeedUnit(sog) : null,
      stw: stw !== null ? convertSpeedUnit(stw) : null,
      heading: heading !== null ? Math.round(toDegrees(heading)) : null,
      cog: cog !== null ? Math.round(toDegrees(cog)) : null,
      windSpeed: windSpeed !== null ? convertSpeedUnit(windSpeed) : null,
      drift: sog !== null && stw !== null ? convertSpeedUnit(sog - stw) : null,
      speedUnitLabel: getSpeedUnitLabel()
    };
  }, [sogValue, stwValue, headingValue, cogValue, windSpeedValue, debugMode]);

  const getSpeedColor = (speed) => {
    if (speed < 2) return 'text-hud-secondary';
    if (speed < 5) return 'text-oBlue';
    if (speed < 8) return 'text-oGreen';
    return 'text-oYellow';
  };

  const getSpeedStatus = (speed) => {
    if (speed < 1) return t('widgets.stationary');
    if (speed < 3) return t('widgets.slow');
    if (speed < 6) return t('widgets.moderate');
    if (speed < 10) return t('widgets.fast');
    return t('widgets.veryFast');
  };

  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-hud-secondary';

  return (
    <BaseWidget
      title={t('widgets.speed')}
      icon={faTachometerAlt}
      hasData={speedData.hasData}
      noDataMessage={t('widgets.noSpeedData')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main speed display - centered */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="text-5xl font-black text-hud-main leading-none gliding-value tracking-tighter">
              {speedData.sog !== null ? speedData.sog : t('common.na')}
              {speedData.sog !== null && <span className="text-xl text-hud-secondary ml-2 uppercase font-black tracking-widest">{speedData.speedUnitLabel}</span>}
            </div>
            <div className={`text-xs font-black uppercase tracking-[0.3em] mt-3 ${speedData.sog !== null ? getSpeedColor(speedData.sog) : 'text-hud-muted'}`}>
              {speedData.sog !== null ? getSpeedStatus(speedData.sog) : t('widgets.offline')}
            </div>
          </div>

          {/* SOG / STW / Heading / COG grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="tesla-card p-2 text-center tesla-hover bg-hud-bg">
              <div className="text-hud-secondary text-xs uppercase font-black tracking-widest opacity-60">SOG</div>
              <div className={`text-xl font-black gliding-value ${speedData.sog !== null ? getSpeedColor(speedData.sog) : 'text-hud-muted'}`}>
                {speedData.sog !== null ? speedData.sog : '--'}
              </div>
            </div>
            <div className="tesla-card p-2 text-center tesla-hover bg-hud-bg">
              <div className="text-hud-secondary text-xs uppercase font-black tracking-widest opacity-60">STW</div>
              <div className={`text-xl font-black gliding-value ${speedData.stw !== null ? getSpeedColor(speedData.stw) : 'text-hud-muted'}`}>
                {speedData.stw !== null ? speedData.stw : '--'}
              </div>
            </div>
            <div className="tesla-card p-2 text-center tesla-hover bg-hud-bg">
              <div className="text-hud-secondary text-xs uppercase font-black tracking-widest opacity-60">HDG</div>
              <div className="text-hud-main text-xl font-black gliding-value">{speedData.heading !== null ? `${speedData.heading}°` : '--'}</div>
            </div>
            <div className="tesla-card p-2 text-center tesla-hover bg-hud-bg">
              <div className="text-hud-secondary text-xs uppercase font-black tracking-widest opacity-60">COG</div>
              <div className="text-hud-main text-xl font-black gliding-value">{speedData.cog !== null ? `${speedData.cog}°` : '--'}</div>
            </div>
          </div>
        </div>

        {/* Speed gauge bar */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="text-hud-muted text-xs font-black tracking-tighter">0</div>
            <div className="flex-1 bg-hud-elevated rounded-full h-1 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                  speedData.sog < 2 ? 'bg-hud-bg' : 
                  speedData.sog < 5 ? 'bg-oBlue' : 
                  speedData.sog < 8 ? 'bg-oGreen' : 'bg-oYellow'
                }`}
                style={{ width: `${speedData.sog !== null ? Math.min(100, (speedData.sog / 15) * 100) : 0}%` }}
              />
            </div>
            <div className="text-hud-muted text-xs font-black tracking-tighter">15+</div>
          </div>
        </div>

        {/* Drift + Wind info */}
        <div className="tesla-card p-3 bg-hud-bg tesla-hover shrink-0">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
            <div className="flex items-center space-x-2">
              <span className="text-hud-secondary">{t('widgets.driftEffect')}</span>
              <span className={`gliding-value ${speedData.drift !== null && speedData.drift > 0 ? 'text-oGreen' : speedData.drift !== null && speedData.drift < 0 ? 'text-oRed' : 'text-hud-muted'}`}>
                {speedData.drift !== null ? `${speedData.drift > 0 ? '+' : ''}${speedData.drift} ${speedData.speedUnitLabel}` : t('common.na')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faWind} className="text-oBlue text-xs opacity-50" />
              <span className="text-hud-main gliding-value">{speedData.windSpeed !== null ? `${speedData.windSpeed} ${speedData.speedUnitLabel}` : t('common.na')}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
});

SpeedWidget.displayName = 'SpeedWidget';

export default SpeedWidget;
