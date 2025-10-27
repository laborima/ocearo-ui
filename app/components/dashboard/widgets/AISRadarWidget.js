'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from '../../3dview/ais/AISContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTowerBroadcast, faShip, faLocationDot } from '@fortawesome/free-solid-svg-icons';

const AISRadarWidget = React.memo(() => {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const { aisData: aisDataRaw, vesselIds } = useAIS();
  const [radarRange, setRadarRange] = useState(5); // nautical miles
  const [sweepAngle, setSweepAngle] = useState(0);
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  // Simulate radar sweep animation
  useEffect(() => {
    let animationId;

    const animate = () => {
      setSweepAngle(prev => (prev + 2) % 360);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []); // Empty dependency array is correct - animation should run continuously

  const aisData = useMemo(() => {
    if (!aisDataRaw || Object.keys(aisDataRaw).length === 0) {
      return [];
    }

    const myPosition = getSignalKValue('navigation.position');
    const myHeading = getSignalKValue('navigation.headingTrue') || getSignalKValue('navigation.headingMagnetic') || 0;

    if (!myPosition) return [];

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
        
        // Calculate CPA (simplified - actual implementation would need course and speed)
        const cpa = distanceNM * Math.abs(Math.sin((absoluteBearing - myHeading) * Math.PI / 180));

        return {
          id: vessel.mmsi,
          name: vessel.name || `MMSI ${vessel.mmsi}`,
          distance: Math.round(distanceNM * 10) / 10,
          bearing: Math.round(absoluteBearing),
          type: vessel.shipType || 'unknown',
          cpa: Math.round(cpa * 10) / 10
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [aisDataRaw, vesselIds, radarRange, getSignalKValue]);

  const getTargetColor = (target) => {
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

  // Check if we should show N/A
  const showNA = !debugMode && aisData.length === 0;

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faTowerBroadcast} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>AIS Radar</span>
        </div>
        
        {/* Range selector */}
        <select 
          value={radarRange} 
          onChange={(e) => setRadarRange(Number(e.target.value))}
          className="bg-oBlue text-white text-xs font-semibold rounded px-3 py-1 border border-white shadow focus:outline-none focus:ring-2 focus:ring-white/70 hover:bg-oBlue/80 transition"
        >
          <option value={1}>1 NM</option>
          <option value={2}>2 NM</option>
          <option value={5}>5 NM</option>
          <option value={10}>10 NM</option>
        </select>
      </div>
      
      {/* Radar Display */}
      <div className="flex-1 relative min-h-0">
        {showNA ? (
          <div className="w-full h-full min-h-24 flex items-center justify-center bg-black rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
              <div className={`text-sm ${mutedTextClass}`}>No AIS data available</div>
            </div>
          </div>
        ) : (
        <div className="w-full h-full min-h-24 relative bg-black rounded-lg overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Radar circles */}
            {[1, 2, 3, 4].map(ring => (
              <circle
                key={ring}
                cx="100"
                cy="100"
                r={ring * 20}
                fill="none"
                stroke="#0f4c75"
                strokeWidth="0.5"
                opacity="0.6"
              />
            ))}
            
            {/* Radar lines */}
            <line x1="100" y1="20" x2="100" y2="180" stroke="#0f4c75" strokeWidth="0.5" opacity="0.6" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="#0f4c75" strokeWidth="0.5" opacity="0.6" />
            
            {/* Radar sweep */}
            <line
              x1="100"
              y1="100"
              x2={100 + 80 * Math.cos((sweepAngle - 90) * Math.PI / 180)}
              y2={100 + 80 * Math.sin((sweepAngle - 90) * Math.PI / 180)}
              stroke="#00ff00"
              strokeWidth="1"
              opacity="0.8"
            />
            
            {/* AIS Targets */}
            {aisData.map(target => {
              const distance = (target.distance / radarRange) * 80;
              const x = 100 + distance * Math.cos((target.bearing - 90) * Math.PI / 180);
              const y = 100 + distance * Math.sin((target.bearing - 90) * Math.PI / 180);
              
              return (
                <g key={target.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r="2"
                    fill={target.cpa < 0.5 ? '#ff4444' : target.cpa < 1.0 ? '#ffaa00' : '#44ff44'}
                  />
                  <text
                    x={x + 5}
                    y={y - 5}
                    fill="white"
                    fontSize="6"
                    className="font-mono"
                  >
                    {target.name.substring(0, 8)}
                  </text>
                </g>
              );
            })}
            
            {/* Own ship */}
            <polygon
              points="100,95 105,105 100,100 95,105"
              fill="#00aaff"
              stroke="white"
              strokeWidth="0.5"
            />
          </svg>
        </div>
        )}
        
        {/* Range indicators */}
        {!showNA && (
        <div className={`absolute top-2 left-2 text-sm ${secondaryTextClass}`}>
          <div>Range: {radarRange} NM</div>
          <div>Targets: {aisData.length}</div>
        </div>
        )}
      </div>

      {/* Target List */}
      {!showNA && aisData.length > 0 && (
      <div className="mt-4 space-y-2">
        <div className={`text-base ${secondaryTextClass} mb-2`}>Closest Targets</div>
        {aisData.slice(0, 3).map(target => (
          <div key={target.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon 
                icon={getTargetIcon(target.type)} 
                className={`${getTargetColor(target)} text-xs`} 
              />
              <span className={`${primaryTextClass} text-base`}>{target.name}</span>
            </div>
            <div className={`flex space-x-3 ${secondaryTextClass}`}>
              <span>{target.distance.toFixed(1)} NM</span>
              <span>{target.bearing}°</span>
              <span className={getTargetColor(target)}>
                CPA: {target.cpa.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
});

AISRadarWidget.displayName = 'AISRadarWidget';

export default AISRadarWidget;
