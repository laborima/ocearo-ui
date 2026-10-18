import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import FlowArrows from './FlowArrows';

const KNOTS = 1.943844;
// Below this the flow has no direction worth an arrow (m/s)
const SLACK = 0.1 / KNOTS;
// Trend shown when the speed changes by more than this within the hour (m/s)
const TREND = 0.05;
const BUILDING = [0.86, 0.22, 0.2];
const EASING = [0.16, 0.48, 0.86];

/**
 * Flow markers in the way chart plotters draw tidal streams: few arrows,
 * each pointing where the flow goes, as long as it is strong, the speed in
 * knots written upright on it, and a border that tells whether it is
 * building (red) or easing (blue) over the next hour. Slack water gets a
 * label instead of an arrow. Used by the current and wind layers.
 *
 * Coordinates are those of the parent: x east, y north, z up.
 *
 * @param {Array<{key:string,x:number,y:number,z:number,u:number,v:number,speed:number,trend:number,color:number[],len:number}>} items
 *   speed and trend (change over the next hour) in m/s, colour RGB 0..1
 * @param {number} width - arrow width, scene units (or a share of the distance, with `screen`)
 * @param {number} screen - screen-sized arrows (see FlowArrows)
 * @param {number} fadeNear - fade the arrows closer to the camera than this
 * @param {(kn:number) => string} format - the speed as written on the arrow
 * @param {'slack'|'calm'} slackLabel - the word for no flow
 */
const FlowMarkers = ({ items, width, screen = 0, fadeNear = 0, format = (kn) => kn.toFixed(1), slackLabel = 'slack', renderOrder = 3 }) => {
    const { t } = useTranslation();
    const { borders, fills } = useMemo(() => {
        const moving = items.filter((it) => it.speed >= SLACK);
        return {
            borders: moving.map((it) => ({
                ...it,
                len: it.len + width * 0.5,
                color: it.trend > TREND ? BUILDING : it.trend < -TREND ? EASING : [0.06, 0.09, 0.12],
            })),
            fills: moving,
        };
    }, [items, width]);

    return (
        <>
            <FlowArrows items={borders} width={width * 1.35} screen={screen} still fadeNear={fadeNear} opacity={0.95} renderOrder={renderOrder} />
            <FlowArrows items={fills} width={width} screen={screen} still fadeNear={fadeNear} opacity={0.95} renderOrder={renderOrder + 1} />
            {items.map((it) => {
                const slack = it.speed < SLACK;
                return (
                    <Html key={it.key} position={[it.x, it.y, it.z]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
                        {slack ? (
                            <div className="rounded-md border-2 border-oBlue bg-hud-bg/80 px-1.5 text-caption font-semibold uppercase tracking-wide text-hud-main whitespace-nowrap">
                                {t(`meteo.${slackLabel}`)}
                            </div>
                        ) : (
                            <div className="rounded px-1 bg-black/60 text-caption font-bold tabular-nums leading-tight text-white whitespace-nowrap">
                                {format(it.speed * KNOTS)}
                            </div>
                        )}
                    </Html>
                );
            })}
        </>
    );
};

export default FlowMarkers;
