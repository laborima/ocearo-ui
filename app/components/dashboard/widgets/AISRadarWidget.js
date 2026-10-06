'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { useAIS } from '../../3dview/ais/AISContext';
import useColregs from '../../hooks/useColregs';
import useTheme from '../../theme/useTheme';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTowerBroadcast, faShip, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import { atonKind } from '../../3dview/seamarks/aisAton';

const RADAR_RANGES = [1, 2, 5, 10, 20];

// Colour of an aid to navigation on the scope, from its AIS type (IALA A)
const ATON_COLOURS = { cardinal: '#f2c200', isolated_danger: '#e0483a', safe_water: '#f0f0f0', special_purpose: '#f2c200', station: '#8a9097' };
const atonColour = (type) => {
  const { kind, category = '' } = atonKind(type);
  if (kind === 'lateral') return category.endsWith('starboard') ? '#1fae5b' : '#e0483a';
  return ATON_COLOURS[kind] || ATON_COLOURS.station;
};

const AISRadarWidget = React.memo(() => {
  const { t } = useTranslation();
  // Every positioned target (not only the ones close enough for the 3D view),
  // so the 10 and 20 NM ranges actually show something
  const { targets, atons } = useAIS();
  const { statuses } = useColregs({ always: true });
  const { scene, id: themeId } = useTheme();
  const [radarRange, setRadarRange] = useState(5); // nautical miles
  const debugMode = configService.get('debugMode');

  const handleRadarWheel = useCallback((e) => {
    e.preventDefault();
    setRadarRange(prev => {
      const currentIdx = RADAR_RANGES.indexOf(prev);
      if (currentIdx === -1) return prev;
      if (e.deltaY < 0 && currentIdx > 0) return RADAR_RANGES[currentIdx - 1];
      if (e.deltaY > 0 && currentIdx < RADAR_RANGES.length - 1) return RADAR_RANGES[currentIdx + 1];
      return prev;
    });
  }, []);

  // Use specialized hooks for better performance
  const myPosition = useSignalKPath('navigation.position');
  const headingTrue = useSignalKPath('navigation.headingTrue');
  const headingMagnetic = useSignalKPath('navigation.headingMagnetic');
  const myCog = useSignalKPath('navigation.courseOverGroundTrue');
  // Radians, as published by SignalK — never mix with the degree bearings below.
  // Same fallback order as the 3D AIS view so both scopes rotate identically.
  const myHeading = headingTrue ?? headingMagnetic ?? myCog ?? 0;
  
  // The radar sweep is animated purely via SVG <animateTransform> (compositor-driven)
  // instead of React state, so it no longer re-renders the whole widget every frame.

  const aisData = useMemo(() => {
    if (!targets.length || !myPosition) {
      return [];
    }

    return targets
      .filter(vessel => vessel.distanceMeters && vessel.distanceMeters <= radarRange * 1852)
      .map(vessel => {
        const distanceNM = vessel.distanceMeters / 1852;
        // True bearing from East/North scene offsets (sceneZ points South)
        const trueBearing = (Math.atan2(vessel.sceneX, -vessel.sceneZ) * 180 / Math.PI + 360) % 360;
        // Head-up display, like the 3D view: own bow at the top of the scope
        const relativeBearing = (trueBearing - myHeading * 180 / Math.PI + 360) % 360;

        // CPA from the shared AIS store (utils/Collision); null when either
        // vessel's motion is unknown — better no CPA than a fabricated one
        const cpa = vessel.cpaMeters === null ? null : vessel.cpaMeters / 1852;

        return {
          id: vessel.mmsi,
          name: vessel.name || `MMSI ${vessel.mmsi}`,
          distance: Math.round(distanceNM * 10) / 10,
          bearing: Math.round(relativeBearing),
          type: vessel.shipType || 'unknown',
          cpa: cpa === null ? null : Math.round(cpa * 10) / 10
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [targets, radarRange, myPosition, myHeading]);

  // Aids to navigation (AIS message 21) within range, head-up like the targets
  const atonData = useMemo(() => {
    if (!atons.length || !myPosition) return [];
    return atons
      .filter(a => a.distanceMeters !== null && a.distanceMeters <= radarRange * 1852)
      .slice(0, 40)
      .map(a => {
        const trueBearing = (Math.atan2(a.east, a.north) * 180 / Math.PI + 360) % 360;
        return {
          id: a.id,
          name: a.name || `MMSI ${a.mmsi || ''}`,
          distance: a.distanceMeters / 1852,
          bearing: (trueBearing - myHeading * 180 / Math.PI + 360) % 360,
          // Night vision: one red, the shape tells the rest
          colour: themeId === 'night' ? scene.compass : atonColour(a.atonType),
          virtual: a.virtual,
        };
      });
  }, [atons, radarRange, myPosition, myHeading, themeId, scene.compass]);

  // Same colours as the 3D view: red we must keep clear, violet it must keep
  // clear of us, orange close without risk of collision, neutral otherwise
  const STATUS_COLOR = { giveWay: scene.vesselDanger, yields: scene.vesselYields, close: scene.vesselClose };
  const getTargetColor = (target) => STATUS_COLOR[statuses[target.id]] || 'var(--hud-text-secondary, #8a9097)';
  const isHazard = (target) => statuses[target.id] === 'giveWay' || statuses[target.id] === 'yields';

  // shipType is the numeric AIS code: ship icon for fishing, cargo and tankers
  const getTargetIcon = (type) => {
    const code = Number(type);
    return code === 30 || (code >= 70 && code <= 89) ? faShip : faLocationDot;
  };

  // Check if we should show data
  const hasData = debugMode || aisData.length > 0 || atonData.length > 0;

  return (
    <BaseWidget
      title={t('widgets.aisTacticalRadar')}
      icon={faTowerBroadcast}
      hasData={hasData}
      noDataMessage={t('widgets.signalLossAIS')}
    >
      {/* Range selector */}
      <div className="absolute top-4 right-4 z-10">
        <select 
          value={radarRange} 
          onChange={(e) => setRadarRange(Number(e.target.value))}
          className="bg-hud-elevated text-hud-secondary text-caption font-semibold uppercase tracking-widest rounded-sm px-3 py-1 border border-hud shadow-soft focus:outline-none focus:ring-1 focus:ring-oBlue/50 hover:bg-hud-bg hover:text-hud-main transition-all duration-500"
        >
          <option value={1}>1 NM</option>
          <option value={2}>2 NM</option>
          <option value={5}>5 NM</option>
          <option value={10}>10 NM</option>
          <option value={20}>20 NM</option>
        </select>
      </div>
      
      {/* Radar Display */}
      <div className="flex-1 relative min-h-0 bg-hud-bg rounded-sm overflow-hidden border border-hud shadow-inner group mt-2" onWheel={handleRadarWheel}>
        <svg className="w-full h-full p-2 transition-transform duration-700 group-hover:scale-[1.02]" viewBox="0 0 200 200">
          {/* Radar circles */}
          {[1, 2, 3, 4].map(ring => (
            <circle
              key={ring}
              cx="100"
              cy="100"
              r={ring * 20}
              fill="none"
              stroke="var(--color-oBlue)"
              strokeOpacity="0.28"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Radar lines */}
          <line x1="100" y1="20" x2="100" y2="180" stroke="var(--color-oBlue)" strokeOpacity="0.16" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="var(--color-oBlue)" strokeOpacity="0.16" strokeWidth="0.5" />
          
          {/* Radar sweep — rotated by the compositor (no React re-render per frame) */}
          <g>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="20"
              stroke="var(--color-oGreen)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="3s"
              repeatCount="indefinite"
            />
          </g>
          
          {/* Aids to navigation: a diamond, hollow when virtual */}
          {atonData.map(a => {
            const r = (a.distance / radarRange) * 80;
            const x = 100 + r * Math.cos((a.bearing - 90) * Math.PI / 180);
            const y = 100 + r * Math.sin((a.bearing - 90) * Math.PI / 180);
            return (
              <polygon
                key={a.id}
                points={`${x},${y - 2.6} ${x + 2},${y} ${x},${y + 2.6} ${x - 2},${y}`}
                fill={a.virtual ? 'none' : a.colour}
                stroke={a.colour}
                strokeWidth={a.virtual ? 0.7 : 0.4}
                strokeDasharray={a.virtual ? '1 0.6' : undefined}
                opacity="0.9"
              >
                <title>{a.virtual ? `${a.name} (V-AIS)` : a.name}</title>
              </polygon>
            );
          })}

          {/* AIS Targets */}
          {(() => {
            // Place labels so close targets don't print over each other
            const placed = [];
            return aisData.map(target => {
              const distance = (target.distance / radarRange) * 80;
              const x = 100 + distance * Math.cos((target.bearing - 90) * Math.PI / 180);
              const y = 100 + distance * Math.sin((target.bearing - 90) * Math.PI / 180);
              let ly = y - 5;
              while (placed.some(p => Math.abs(p.x - x) < 26 && Math.abs(p.y - ly) < 6)) ly += 6;
              placed.push({ x, y: ly });
              return { target, x, y, ly };
            });
          })().map(({ target, x, y, ly }) => {
            const hazard = isHazard(target);
            
            return (
              <g key={target.id} className={hazard ? 'animate-soft-pulse' : ''}>
                <circle
                  cx={x}
                  cy={y}
                  r={hazard ? "3" : "2"}
                  fill={getTargetColor(target)}
                  className="transition-all duration-1000"
                />
                <text
                  x={x + 5}
                  y={ly}
                  fill="currentColor"
                  fontSize="5"
                  className="font-black pointer-events-none uppercase tracking-tighter opacity-60 text-hud-main"
                >
                  {target.name.substring(0, 8)}
                </text>
              </g>
            );
          })}
          
          {/* Own ship */}
          <polygon
            points="100,95 105,105 100,102 95,105"
            fill="var(--color-oBlue)"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.8"
            className="text-hud-main"
          />
        </svg>
        
        {/* Range indicators overlay */}
        <div className="absolute top-2 left-2 text-caption text-hud-muted font-semibold pointer-events-none uppercase tracking-widest space-y-1">
          <div className="bg-hud-bg/40 px-1.5 py-0.5 rounded-sm">{t('widgets.range')} {radarRange} NM</div>
          <div className="bg-hud-bg/40 px-1.5 py-0.5 rounded-sm">{t('widgets.targets')} {aisData.length}</div>
        </div>
      </div>

      {/* Target List */}
      {aisData.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-caption text-hud-muted font-semibold uppercase tracking-[0.2em] px-1">{t('widgets.tacticalAnalysis')}</div>
          {aisData.slice(0, 2).map(target => (
            <div key={target.id} className="flex items-center justify-between text-caption tesla-card px-3 py-2 tesla-hover">
              <div className="flex items-center space-x-3 min-w-0">
                <FontAwesomeIcon 
                  icon={getTargetIcon(target.type)} 
                  style={{ color: getTargetColor(target) }}
                  className={`text-xs opacity-80 ${isHazard(target) ? 'animate-soft-pulse' : ''}`} 
                />
                <span className="text-hud-main truncate font-black uppercase tracking-tight">{target.name}</span>
              </div>
              <div className="flex space-x-4 text-hud-secondary font-black tracking-tighter">
                <span className="gliding-value">{target.distance.toFixed(1)} NM</span>
                <span className="gliding-value" style={{ color: getTargetColor(target) }}>CPA: {target.cpa === null ? '--' : target.cpa.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  );
});

AISRadarWidget.displayName = 'AISRadarWidget';

export default AISRadarWidget;
