import React, { useEffect, useRef } from 'react';

const SvgWindIndicator = ({ windSpeed, oldDegreeIndicator, newDegreeIndicator }) => {
  const needleRef = useRef(null);
  const valueRef = useRef(null);

  useEffect(() => {
    if (needleRef.current) {
      needleRef.current.beginElement();
    }
  }, [newDegreeIndicator]);

  return (
    <svg x="0" y="0" width="33" height="83" viewBox="0 0 33 83" style={{ overflow: 'visible' }} id="AppWindCoord">
      <g id="layerWindAngle" style={{ display: 'inline' }}>
        <path
          id="NeddleAWA"
          className="app-wind"
          style={{
            display: 'inline',
            fillOpacity: 1,
            stroke: '#afafaf',
            strokeWidth: 0,
            strokeDasharray: 'none',
            strokeOpacity: 1,
          }}
          d="m 231,7.2483045 a 16.130346,16.130346 0 0 0 -16.13086,16.1308605 16.130346,16.130346 0 0 0 4.87109,11.494141 l 11.40039,54.181641 0.006,0.01367 11.27539,-54.357423 A 16.130346,16.130346 0 0 0 247.13086,23.379165 16.130346,16.130346 0 0 0 231,7.2483045 Z"
        />
        <text
          className="wind-text"
          xmlSpace="preserve"
          style={{
            fontStyle: 'normal',
            fontVariant: 'normal',
            fontWeight: 'bold',
            fontStretch: 'normal',
            fontSize: '12px',
            fontFamily: 'Arial',
            textAnchor: 'middle',
            display: 'inline',
            fillOpacity: 1,
            stroke: 'none',
            strokeWidth: 0,
            strokeDasharray: 'none',
            strokeOpacity: 1,
          }}
          x="233"
          y="52.233677"
          id="LabelAWS"
        >
          A
        </text>
        <svg viewBox="-231.5 -8 33 53" style={{ overflow: 'visible' }} id="AWSCoord">
          <g>
            <text
              xmlSpace="preserve"
              alignmentBaseline="middle"
              className="wind-text"
              style={{
                fontStyle: 'normal',
                fontVariant: 'normal',
                fontWeight: 'bold',
                fontStretch: 'normal',
                fontSize: '14.3px',
                fontFamily: 'Arial',
                textAnchor: 'middle',
                display: 'inline',
                fillOpacity: 1,
                stroke: 'none',
                strokeWidth: 0,
                strokeDasharray: 'none',
                strokeOpacity: 1,
              }}
              x="0"
              y="0"
              id="ValueAWS"
              ref={valueRef}
              transform="scale(1.0128481,0.98731488)"
            >
              {windSpeed}
            </text>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={oldDegreeIndicator}
              to={newDegreeIndicator}
              begin="indefinite"
              dur="0.5s"
              additive="replace"
              fill="freeze"
            />
          </g>
        </svg>
        <animateTransform
          ref={needleRef}
          attributeName="transform"
          type="rotate"
          from={`${oldDegreeIndicator} 231 231`}
          to={`${newDegreeIndicator} 231 231`}
          begin="indefinite"
          dur="0.5s"
          additive="replace"
          fill="freeze"
        />
      </g>
    </svg>
  );
};

export default SvgWindIndicator;
