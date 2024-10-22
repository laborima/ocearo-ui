import React from 'react';

const SvgWindLayLines = ({ 
  closeHauledLineEnable, 
  trueWindAngle, 
  closeHauledLineStbdPath, 
  closeHauledLinePortPath 
}) => {
  return (
    <g 
      id="LayerLayline" 
      style={{ display: closeHauledLineEnable ? 'inline' : 'none' }}
    >
      {trueWindAngle != null && (
        <>
          <path
            id="PortLayline"
            d={closeHauledLinePortPath}
            style={{
              display: 'inline',
              fill: 'none',
              strokeWidth: 3,
              strokeLinecap: 'square',
              strokeLinejoin: 'miter',
              strokeMiterlimit: 0,
              strokeDasharray: '4px',
              strokeOpacity: 0.6,
            }}
            className="laylines"
          />
          <path
            id="StbdLayline"
            d={closeHauledLineStbdPath}
            style={{
              display: 'inline',
              fill: 'none',
              strokeWidth: 3,
              strokeLinecap: 'square',
              strokeLinejoin: 'miter',
              strokeMiterlimit: 0,
              strokeDasharray: '4px',
              strokeOpacity: 0.6,
            }}
            className="laylines"
          />
        </>
      )}
    </g>
  );
};

export default SvgWindLayLines;
