import React from 'react';

/**
 * Minimal SVG line chart: values left (oldest) to right, area fill under the
 * line. `marker` (0..1) draws a solid "now" line with a dot on the curve;
 * `endDot` marks the latest value at the right end.
 */
const Sparkline = ({ values, width = 240, height = 60, color = 'var(--color-oBlue)', marker = null, endDot = false, invert = false }) => {
    const points = values.filter(Number.isFinite);
    if (points.length < 2) return <svg width={width} height={height} />;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const step = width / (values.length - 1);
    // invert: larger values drawn lower (depth reads downwards)
    const y = (v) => (invert ? (v - min) / span : 1 - (v - min) / span) * (height - 8) + 4;
    let d = '';
    values.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        d += `${d ? 'L' : 'M'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`;
    });
    const area = `${d}L${width},${invert ? 0 : height}L0,${invert ? 0 : height}Z`;

    // Value under the "now" line, interpolated between the two nearest samples
    let markerDot = null;
    if (marker !== null) {
        const pos = marker * (values.length - 1);
        const i = Math.min(values.length - 2, Math.floor(pos));
        const a = values[i];
        const b = values[i + 1];
        if (Number.isFinite(a) && Number.isFinite(b)) markerDot = { x: marker * width, y: y(a + (b - a) * (pos - i)) };
    }
    const last = values[values.length - 1];

    return (
        <svg width={width} height={height} className="block overflow-visible">
            <path d={area} fill={color} opacity="0.12" />
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {marker !== null && (
                <line x1={marker * width} x2={marker * width} y1="0" y2={height} stroke="var(--hud-text-main)" strokeWidth="1.5" />
            )}
            {markerDot && <circle cx={markerDot.x} cy={markerDot.y} r="4" fill={color} stroke="var(--hud-text-main)" strokeWidth="1.5" />}
            {endDot && Number.isFinite(last) && <circle cx={width} cy={y(last)} r="3.5" fill={color} />}
        </svg>
    );
};

export default Sparkline;
