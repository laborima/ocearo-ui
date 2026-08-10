'use client';
import React, { useMemo } from 'react';
import BaseWidget from './BaseWidget';
import { useSignalKPath } from '../../hooks/useSignalK';
import { useOcearoContext } from '../../context/OcearoContext';
import { toDegrees, radToDeg, convertSpeedUnit, getSpeedUnitLabel, finite } from '../../utils/UnitConversions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * CompassWidget — KIP-style rotating card compass.
 *
 * Replaces the 3D boat widget that used to sit in this slot. The 3D version
 * spun a full WebGL canvas (its own renderer, HDR environment and orbit
 * controls) to show a heading number that a flat card reads far better, and it
 * did so permanently on a Raspberry Pi already fighting for CPU. This is pure
 * SVG: no GPU context, no animation loop, one repaint per heading delta.
 *
 * Reading convention, as on a real card compass: the rose turns, the lubber
 * line at the top is fixed, so what sits under the lubber line is the heading.
 */

/** Geometry of the SVG viewBox. */
const CX = 100;
const CY = 100;
const R_OUTER = 92;
const R_TICK_MAJOR = 74;
const R_TICK_MINOR = 82;
const R_LABEL = 62;
const R_MARKER = 88;

const CARDINALS = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W' },
    { deg: 315, label: 'NW' }
];

/**
 * Point on the rose at `deg` (0 = up, clockwise) and radius `r`.
 * @returns {[number, number]}
 */
const polar = (deg, r) => {
    const rad = (deg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
};

/** Normalise any angle to [0, 360). */
const norm = (deg) => ((deg % 360) + 360) % 360;

/**
 * A triangular index marker pinned to the rim.
 *
 * No text label: the marker sits inside two nested rotations, so keeping a
 * glyph upright would need counter-rotating about its own centre for every
 * frame. Shape and colour carry the meaning instead, and the exact figures are
 * spelled out in the info bar below the dial.
 */
const RimMarker = ({ angle, color, inward = false }) => {
    if (!Number.isFinite(angle)) return null;
    const a = norm(angle);
    const points = inward
        // Pointing inward (wind: where it blows from, towards the boat)
        ? `${CX},${CY - R_MARKER + 12} ${CX - 5},${CY - R_MARKER + 1} ${CX + 5},${CY - R_MARKER + 1}`
        // Pointing outward (course made good)
        : `${CX},${CY - R_MARKER} ${CX - 5},${CY - R_MARKER + 11} ${CX + 5},${CY - R_MARKER + 11}`;
    return (
        <polygon
            transform={`rotate(${a} ${CX} ${CY})`}
            points={points}
            fill={color}
            opacity={0.9}
        />
    );
};

export default function CompassWidget() {
    const { t } = useTranslation();
    const { nightMode } = useOcearoContext();

    const headingTrue = useSignalKPath('navigation.headingTrue');
    const headingMagnetic = useSignalKPath('navigation.headingMagnetic');
    const cog = useSignalKPath('navigation.courseOverGroundTrue');
    const sog = useSignalKPath('navigation.speedOverGround');
    const awa = useSignalKPath('environment.wind.angleApparent');
    const aws = useSignalKPath('environment.wind.speedApparent');

    const data = useMemo(() => {
        // True heading preferred; magnetic is the honest fallback and is
        // labelled as such rather than silently passed off as true.
        const hdgTrue = toDegrees(headingTrue);
        const hdgMag = toDegrees(headingMagnetic);
        const heading = hdgTrue !== null ? hdgTrue : hdgMag;

        // AWA is signed relative to the bow: keep it in [-180, 180] so port
        // shows as negative, the way every wind instrument reads it. toDegrees()
        // would fold -45° into 315°.
        const awaRaw = radToDeg(awa);
        const awaDeg = awaRaw === null ? null : ((awaRaw % 360) + 540) % 360 - 180;
        const cogDeg = toDegrees(cog);

        return {
            heading,
            isMagnetic: hdgTrue === null && hdgMag !== null,
            cog: cogDeg,
            sog: convertSpeedUnit(sog),
            // Apparent wind is relative to the bow, so it is drawn on the rim
            // by adding the heading — the marker then points where the wind
            // actually comes from on the card.
            windAngle: awaDeg !== null && heading !== null ? norm(heading + awaDeg) : null,
            windAngleRelative: awaDeg,
            windSpeed: convertSpeedUnit(aws)
        };
    }, [headingTrue, headingMagnetic, cog, sog, awa, aws]);

    const hasData = data.heading !== null;
    const rose = hasData ? -data.heading : 0;

    const accent = nightMode ? 'text-oNight' : 'text-oBlue';
    const roseColor = nightMode ? '#ef4444' : '#e8e8e8';
    const northColor = nightMode ? '#ef4444' : '#cc000c';
    const cogColor = nightMode ? '#ef4444' : '#09bfff';
    const windColor = nightMode ? '#ef4444' : '#ffbe00';

    // 5° ticks, every third one long. Precomputed once — the rose only rotates.
    const ticks = useMemo(() => {
        const out = [];
        for (let deg = 0; deg < 360; deg += 5) {
            const major = deg % 15 === 0;
            const [x1, y1] = polar(deg, major ? R_TICK_MAJOR : R_TICK_MINOR);
            const [x2, y2] = polar(deg, R_OUTER - 4);
            out.push({ deg, x1, y1, x2, y2, major });
        }
        return out;
    }, []);

    return (
        <BaseWidget
            title={t('widgets.compassHeading')}
            icon={faCompass}
            hasData={hasData}
            noDataMessage={t('widgets.signalLossHeading')}
        >
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-3">
                {data.isMagnetic && (
                    <span className="text-xs px-2 py-0.5 rounded-sm uppercase font-black tracking-widest text-hud-main bg-hud-elevated border border-hud">
                        MAG
                    </span>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0">
                <svg
                    viewBox="0 0 200 200"
                    className="h-full w-full max-h-full"
                    style={{ maxWidth: '100%' }}
                    role="img"
                    aria-label={t('widgets.compassHeading')}
                >
                    {/* Bezel */}
                    <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="currentColor"
                        className="text-hud-muted" strokeOpacity="0.25" strokeWidth="1.5" />

                    {/* Rotating card */}
                    <g transform={`rotate(${rose} ${CX} ${CY})`} style={{ transition: 'transform 300ms linear' }}>
                        {ticks.map(tick => (
                            <line
                                key={tick.deg}
                                x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                                stroke={tick.deg === 0 ? northColor : roseColor}
                                strokeWidth={tick.major ? 1.8 : 0.8}
                                strokeOpacity={tick.major ? 0.8 : 0.35}
                            />
                        ))}

                        {CARDINALS.map(({ deg, label }) => {
                            const [x, y] = polar(deg, R_LABEL);
                            const isPrimary = deg % 90 === 0;
                            return (
                                <text
                                    key={label}
                                    x={x} y={y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={isPrimary ? 14 : 9}
                                    fontWeight="900"
                                    letterSpacing="0.5"
                                    fill={deg === 0 ? northColor : roseColor}
                                    fillOpacity={isPrimary ? 0.95 : 0.5}
                                    transform={`rotate(${-rose} ${x} ${y})`}
                                >
                                    {label}
                                </text>
                            );
                        })}

                        {/* COG and apparent wind ride the card: they are absolute
                            bearings, so they must turn with the rose. */}
                        <RimMarker angle={data.cog} color={cogColor} />
                        <RimMarker angle={data.windAngle} color={windColor} inward />
                    </g>

                    {/* Fixed lubber line */}
                    <polygon
                        points={`${CX},${CY - R_OUTER + 2} ${CX - 7},${CY - R_OUTER - 10} ${CX + 7},${CY - R_OUTER - 10}`}
                        fill={nightMode ? '#ef4444' : '#ffffff'}
                        opacity="0.9"
                    />
                    <line x1={CX} y1={CY - R_OUTER + 2} x2={CX} y2={CY - 30}
                        stroke={nightMode ? '#ef4444' : '#ffffff'} strokeWidth="1" strokeOpacity="0.3" />

                    {/* Digital readout */}
                    <text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="central"
                        fontSize="38" fontWeight="900" letterSpacing="-1"
                        fill="currentColor" className="text-hud-main">
                        {hasData ? `${Math.round(data.heading).toString().padStart(3, '0')}°` : '---'}
                    </text>
                    <text x={CX} y={CY + 22} textAnchor="middle" dominantBaseline="central"
                        fontSize="9" fontWeight="900" letterSpacing="2"
                        fill="currentColor" className="text-hud-secondary" fillOpacity="0.6">
                        {data.isMagnetic ? 'HDG MAG' : 'HDG TRUE'}
                    </text>
                </svg>
            </div>

            {/* Bottom info bar */}
            <div className="flex justify-between items-center mt-2 shrink-0 text-xs font-black uppercase tracking-widest">
                <div className="flex items-center space-x-3">
                    <span className="text-hud-main gliding-value">
                        {data.cog !== null ? `${Math.round(data.cog)}°` : '---'}
                        <span className="text-hud-secondary ml-1">COG</span>
                    </span>
                    <span className="text-hud-main gliding-value">
                        {data.sog !== null ? data.sog.toFixed(1) : '--'}
                        <span className="text-hud-secondary ml-1">{getSpeedUnitLabel()}</span>
                    </span>
                    <span className="text-hud-main gliding-value">
                        {finite(data.windAngleRelative) !== null ? `${Math.round(data.windAngleRelative)}°` : '--'}
                        <span className="text-hud-secondary ml-1">AWA</span>
                    </span>
                    <span className="text-hud-main gliding-value">
                        {data.windSpeed !== null ? data.windSpeed.toFixed(1) : '--'}
                        <span className="text-hud-secondary ml-1">AWS</span>
                    </span>
                </div>
                <div className={`flex items-center space-x-1 ${accent}`}>
                    <FontAwesomeIcon icon={faCompass} className="text-xs opacity-50" />
                </div>
            </div>
        </BaseWidget>
    );
}
