'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { oBlue, oGreen, oRed, oYellow, useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from '../../3dview/ais/AISContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTowerBroadcast, faShip, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const RADAR_RANGES = [1, 2, 5, 10, 20];

/**
 * Closest point of approach, in nautical miles.
 *
 * Works in a local East/North frame in metres: the relative position comes from
 * range and bearing, the relative velocity from both vessels' COG/SOG. Returns
 * null unless every input is a finite number, so an unknown CPA stays unknown
 * instead of collapsing to a misleading 0.
 *
 * @param {{rangeMeters:number, bearingRad:number, ownSog:number, ownCog:number,
 *          targetSog:number, targetCog:number}} p - SI inputs (m, m/s, radians)
 * @returns {number|null} CPA in NM, or null when it cannot be computed
 */
function computeCpaNM({ rangeMeters, bearingRad, ownSog, ownCog, targetSog, targetCog }) {
  const nums = [rangeMeters, bearingRad, ownSog, ownCog, targetSog, targetCog];
  if (!nums.every(Number.isFinite)) return null;

  // Relative position of the target (East, North)
  const rx = rangeMeters * Math.sin(bearingRad);
  const ry = rangeMeters * Math.cos(bearingRad);

  // Relative velocity (target minus own)
  const vx = targetSog * Math.sin(targetCog) - ownSog * Math.sin(ownCog);
  const vy = targetSog * Math.cos(targetCog) - ownSog * Math.cos(ownCog);

  const vv = vx * vx + vy * vy;
  // Same course and speed: the range never changes.
  if (vv < 1e-9) return rangeMeters / 1852;

  // Time of closest approach; negative means it is already behind us.
  const t = Math.max(0, -(rx * vx + ry * vy) / vv);
  const cx = rx + vx * t;
  const cy = ry + vy * t;
  return Math.hypot(cx, cy) / 1852;
}

const AISRadarWidget = React.memo(() => {
  const { t } = useTranslation();
  const { aisData: aisDataRaw, vesselIds } = useAIS();
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
  const mySog = useSignalKPath('navigation.speedOverGround');
  // Radians, as published by SignalK — never mix with the degree bearings below.
  const myHeading = headingTrue ?? headingMagnetic ?? 0;
  
  // The radar sweep is animated purely via SVG <animateTransform> (compositor-driven)
  // instead of React state, so it no longer re-renders the whole widget every frame.

  const aisData = useMemo(() => {
    if (!aisDataRaw || Object.keys(aisDataRaw).length === 0 || !myPosition) {
      return [];
    }

    return vesselIds
      .filter(vessel => vessel.distanceMeters && vessel.distanceMeters <= radarRange * 1852)
      .map(vessel => {
        const distanceNM = vessel.distanceMeters / 1852;
        // Bearing calculation with 180° rotation to align with 3D view
        // sceneX=East(+)/West(-), sceneZ=South(+)/North(-)
        const bearing = Math.atan2(
          vessel.sceneX,
          -vessel.sceneZ
        ) * 180 / Math.PI;
        // Apply 180° rotation to match 3D view orientation
        const absoluteBearing = (bearing + 180 + 360) % 360;
        
        // Real closest point of approach. The previous formula ignored the
        // target's course and speed entirely and subtracted a heading in radians
        // from a bearing in degrees, so a moored boat abeam was flagged red.
        // Returns null when either vessel's motion is unknown — better no CPA
        // than a fabricated one.
        const cpa = computeCpaNM({
          rangeMeters: vessel.distanceMeters,
          bearingRad: absoluteBearing * Math.PI / 180,
          ownSog: mySog,
          ownCog: myCog ?? myHeading,
          targetSog: vessel.sog,
          targetCog: vessel.cog ?? vessel.cogMagnetic
        });

        return {
          id: vessel.mmsi,
          name: vessel.name || `MMSI ${vessel.mmsi}`,
          distance: Math.round(distanceNM * 10) / 10,
          bearing: Math.round(absoluteBearing),
          type: vessel.shipType || 'unknown',
          cpa: cpa === null ? null : Math.round(cpa * 10) / 10
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [aisDataRaw, vesselIds, radarRange, myPosition, myHeading, myCog, mySog]);

  const getTargetColor = (target) => {
    // No computable CPA (target not reporting course/speed) — fall back to plain
    // range rather than implying we assessed a collision risk.
    if (target.cpa === null) return target.distance < 0.5 ? 'text-oYellow' : 'text-hud-secondary';
    if (target.cpa < 0.5) return 'text-oRed';
    if (target.cpa < 1.0) return 'text-oYellow';
    return 'text-oGreen';
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case 'cargo': return faShip;
      case 'fishing': return faShip;
      default: return faLocationDot;
    }
  };

  // Check if we should show data
  const hasData = debugMode || aisData.length > 0;

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
          className="bg-hud-elevated text-hud-secondary text-xs font-black uppercase tracking-widest rounded-sm px-3 py-1 border border-hud shadow-soft focus:outline-none focus:ring-1 focus:ring-oBlue/50 hover:bg-hud-bg hover:text-hud-main transition-all duration-500"
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
              strokeOpacity="0.1"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Radar lines */}
          <line x1="100" y1="20" x2="100" y2="180" stroke="var(--color-oBlue)" strokeOpacity="0.05" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="var(--color-oBlue)" strokeOpacity="0.05" strokeWidth="0.5" />
          
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
          
          {/* AIS Targets */}
          {aisData.map(target => {
            const distance = (target.distance / radarRange) * 80;
            const x = 100 + distance * Math.cos((target.bearing - 90) * Math.PI / 180);
            const y = 100 + distance * Math.sin((target.bearing - 90) * Math.PI / 180);
            const isHazard = target.cpa !== null && target.cpa < 0.5;
            
            return (
              <g key={target.id} className={isHazard ? 'animate-soft-pulse' : ''}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHazard ? "3" : "2"}
                  fill={isHazard ? 'var(--color-oRed)' : (target.cpa !== null && target.cpa < 1.0) ? 'var(--color-oYellow)' : 'var(--color-oGreen)'}
                  className="transition-all duration-1000"
                />
                <text
                  x={x + 5}
                  y={y - 5}
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
        <div className="absolute top-2 left-2 text-xs text-hud-muted font-black pointer-events-none uppercase tracking-widest space-y-1">
          <div className="bg-hud-bg/40 px-1.5 py-0.5 rounded-sm">{t('widgets.range')} {radarRange} NM</div>
          <div className="bg-hud-bg/40 px-1.5 py-0.5 rounded-sm">{t('widgets.targets')} {aisData.length}</div>
        </div>
      </div>

      {/* Target List */}
      {aisData.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-hud-muted font-black uppercase tracking-[0.2em] px-1">{t('widgets.tacticalAnalysis')}</div>
          {aisData.slice(0, 2).map(target => (
            <div key={target.id} className="flex items-center justify-between text-xs tesla-card bg-hud-bg px-3 py-2 border border-hud tesla-hover">
              <div className="flex items-center space-x-3 min-w-0">
                <FontAwesomeIcon 
                  icon={getTargetIcon(target.type)} 
                  className={`${getTargetColor(target)} text-xs opacity-80 ${target.cpa !== null && target.cpa < 0.5 ? 'animate-soft-pulse' : ''}`} 
                />
                <span className="text-hud-main truncate font-black uppercase tracking-tight">{target.name}</span>
              </div>
              <div className="flex space-x-4 text-hud-secondary font-black tracking-tighter">
                <span className="gliding-value">{target.distance.toFixed(1)} NM</span>
                <span className={`${getTargetColor(target)} gliding-value`}>CPA: {target.cpa === null ? '--' : target.cpa.toFixed(1)}</span>
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
