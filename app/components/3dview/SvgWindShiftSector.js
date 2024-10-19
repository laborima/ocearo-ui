import React from 'react';

const SvgWindShiftSector = ({ 
  windSectorEnable = true, 
  portWindSectorPath = 'none', 
  stbdWindSectorPath = 'none' 
}) => {
  return (
    <g
      style={{ display: windSectorEnable ? 'inline' : 'none' }}
      id="layerLayline"
    >
      {portWindSectorPath !== 'none' && (
        <path
          d={portWindSectorPath}
          id="portSectorShift"
          className="wind-sector-port"
          style={{
            fillOpacity: 0.3,
            stroke: 'none',
            strokeWidth: 1.90858,
            strokeLinecap: 'butt',
            strokeLinejoin: 'round',
            strokeMiterlimit: 4,
            strokeDasharray: 'none',
            strokeOpacity: 0.483517,
          }}
        />
      )}
      {stbdWindSectorPath !== 'none' && (
        <path
          d={stbdWindSectorPath}
          id="StbdSectorShift"
          className="wind-sector-stbd"
          style={{
            fillOpacity: 0.3,
            stroke: 'none',
            strokeWidth: 1.90858,
            strokeLinecap: 'butt',
            strokeLinejoin: 'round',
            strokeMiterlimit: 4,
            strokeDasharray: 'none',
            strokeOpacity: 0.483517,
          }}
        />
      )}
    </g>
  );
};

export default SvgWindShiftSector;
