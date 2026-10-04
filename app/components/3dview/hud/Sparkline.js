import React from 'react';

/**
 * Minimal SVG line chart: values left (oldest) to right, optional marker at
 * fraction `marker` of the width, area fill under the line.
 */
const Sparkline = ({ values, width = 240, height = 60, color = 'var(--color-oBlue)', marker = null, invert = false }) => {
    const points = values.filter(Number.isFinite);
    if (points.length < 2) return <svg width={width} height={height} />;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const step = width / (values.length - 1);
    // invert: larger values drawn lower (depth reads downwards)
    const y = (v) => (invert ? (v - min) / span : 1 - (v - min) / span) * (height - 6) + 3;
    let d = '';
    values.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        d += `${d ? 'L' : 'M'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`;
    });
    const area = `${d}L${width},${invert ? 0 : height}L0,${invert ? 0 : height}Z`;
    return (
        <svg width={width} height={height} className="block overflow-visible">
            <path d={area} fill={color} opacity="0.12" />
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {marker !== null && (
                <line x1={marker * width} x2={marker * width} y1="0" y2={height} stroke="var(--hud-text-secondary)" strokeWidth="1" strokeDasharray="3 3" />
            )}
        </svg>
    );
};

export default Sparkline;
