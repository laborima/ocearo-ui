'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRadar, faShip, faLocationDot } from '@fortawesome/free-solid-svg-icons';

export default function AISRadarWidget() {
  const { getSignalKValue } = useOcearoContext();
  const [radarRange, setRadarRange] = useState(5); // nautical miles
  const [sweepAngle, setSweepAngle] = useState(0);
  
  // Simulate radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle(prev => (prev + 6) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const aisData = useMemo(() => {
    // Mock AIS targets - in real implementation, this would come from SignalK
    return [
      { id: 1, name: 'VESSEL_A', distance: 2.3, bearing: 45, type: 'cargo', cpa: 0.8 },
      { id: 2, name: 'VESSEL_B', distance: 4.1, bearing: 120, type: 'fishing', cpa: 1.2 },
      { id: 3, name: 'VESSEL_C', distance: 1.8, bearing: 280, type: 'pleasure', cpa: 0.3 },
    ];
  }, []);

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

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faRadar} className="text-oBlue" />
          <span className="text-white font-medium">AIS Radar</span>
        </div>
        
        {/* Range selector */}
        <select 
          value={radarRange} 
          onChange={(e) => setRadarRange(Number(e.target.value))}
          className="bg-oGray1 text-white text-xs rounded px-2 py-1 border border-gray-600"
        >
          <option value={1}>1 NM</option>
          <option value={2}>2 NM</option>
          <option value={5}>5 NM</option>
          <option value={10}>10 NM</option>
        </select>
      </div>
      
      {/* Radar Display */}
      <div className="flex-1 relative">
        <div className="w-full h-32 relative bg-black rounded-lg overflow-hidden">
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
        
        {/* Range indicators */}
        <div className="absolute top-2 left-2 text-xs text-gray-400">
          <div>Range: {radarRange} NM</div>
          <div>Targets: {aisData.length}</div>
        </div>
      </div>

      {/* Target List */}
      <div className="mt-4 space-y-2">
        <div className="text-sm text-gray-400 mb-2">Closest Targets</div>
        {aisData.slice(0, 3).map(target => (
          <div key={target.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon 
                icon={getTargetIcon(target.type)} 
                className={`${getTargetColor(target)} text-xs`} 
              />
              <span className="text-white">{target.name}</span>
            </div>
            <div className="flex space-x-3 text-gray-400">
              <span>{target.distance.toFixed(1)} NM</span>
              <span>{target.bearing}°</span>
              <span className={getTargetColor(target)}>
                CPA: {target.cpa.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
