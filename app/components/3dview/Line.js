'use client';
import React, { forwardRef, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Vector2, Vector3, Vector4, Color } from 'three';
import { useThree } from '@react-three/fiber';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

/**
 * Drop-in replacement for drei's <Line> (same props).
 *
 * drei rebuilds the geometry whenever the `points` array is a new object, and
 * its cleanup then disposes the material as well, although the same material
 * stays in use: three.js recompiles its shader on the next frame. Callers pass
 * points built inline, so every re-render recompiled every line — 35 lines on
 * the boat view, a few seconds of shader compilation each time on the
 * Raspberry Pi (0.5 frame per second). Here the geometry is rebuilt only when
 * the point values change, and the material is disposed on unmount only.
 */
const toXYZ = (p) => {
    if (p instanceof Vector3 || p instanceof Vector4) return [p.x, p.y, p.z];
    if (p instanceof Vector2) return [p.x, p.y, 0];
    if (Array.isArray(p)) return p.length === 2 ? [p[0], p[1], 0] : [p[0], p[1], p[2]];
    return [p, 0, 0];
};
const toColor = (c) => (c instanceof Color ? c.toArray() : c);

const Line = forwardRef(function Line({ points, color = 0xffffff, vertexColors, linewidth, lineWidth, segments, dashed, ...rest }, ref) {
    const size = useThree((state) => state.size);
    const line2 = useMemo(() => (segments ? new LineSegments2() : new Line2()), [segments]);
    const [lineMaterial] = useState(() => new LineMaterial());
    const itemSize = vertexColors?.[0]?.length === 4 ? 4 : 3;

    // Value keys: an inline array with the same coordinates is the same line
    const positions = points.flatMap(toXYZ);
    const positionsKey = positions.join(',');
    const colors = vertexColors ? vertexColors.flatMap(toColor) : null;
    const colorsKey = colors ? colors.join(',') : '';

    const lineGeom = useMemo(() => {
        const geom = segments ? new LineSegmentsGeometry() : new LineGeometry();
        geom.setPositions(positions);
        if (colors) geom.setColors(colors, itemSize);
        return geom;
    }, [positionsKey, colorsKey, segments, itemSize]); // eslint-disable-line react-hooks/exhaustive-deps

    useLayoutEffect(() => {
        line2.computeLineDistances();
    }, [lineGeom, line2]);

    useLayoutEffect(() => {
        if (dashed) lineMaterial.defines.USE_DASH = '';
        else delete lineMaterial.defines.USE_DASH;
        lineMaterial.needsUpdate = true;
    }, [dashed, lineMaterial]);

    // The geometry goes with its points; the material lives as long as the line
    useEffect(() => () => lineGeom.dispose(), [lineGeom]);
    useEffect(() => () => lineMaterial.dispose(), [lineMaterial]);

    return (
        <primitive object={line2} ref={ref} {...rest}>
            <primitive object={lineGeom} attach="geometry" />
            <primitive
                object={lineMaterial}
                attach="material"
                color={vertexColors ? 0xffffff : color}
                vertexColors={Boolean(vertexColors)}
                resolution={[size.width, size.height]}
                linewidth={linewidth ?? lineWidth ?? 1}
                dashed={dashed}
                transparent={itemSize === 4}
                {...rest}
            />
        </primitive>
    );
});

export { Line };
export default Line;
