import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSignalKPaths } from '../hooks/useSignalK';
import { toDegrees, toKnots } from '../utils/UnitConversions';
import configService from '../settings/ConfigService';
import useTheme from '../theme/useTheme';
import { useAIS } from './ais/AISContext';
import useColregs from '../hooks/useColregs';
import { targetCategory } from '../utils/Colregs';

/** 46°8.364'N */
export const formatCoordinate = (value, isLatitude) => {
    if (!Number.isFinite(value)) return '--';
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutes = ((absolute - degrees) * 60).toFixed(3);
    const hemisphere = isLatitude ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${hemisphere}`;
};

/**
 * Card shown when a vessel (AIS target or our boat) is tapped in the 3D view.
 * `card`: { title, subtitle, status: { tone, text }, primary: [{ label, value, unit }],
 * details: [{ label, value }] }; empty values are left out.
 */
const VesselCard = ({ card, onClose }) => {
    const { t } = useTranslation();
    const { scene } = useTheme();
    // Status colours: the same as the hulls in the scene (see the legend)
    const tones = { giveWay: scene.vesselDanger, yields: scene.vesselYields, close: scene.vesselClose };
    const primary = card.primary.filter(item => item.value != null && item.value !== '');
    const details = (card.details || []).filter(item => item.value != null && item.value !== '');

    return (
        <div className="tesla-card !p-0 !rounded-2xl overflow-hidden select-none flex flex-col min-h-0 max-h-full">
            <div className="flex items-start gap-3 px-4 pt-3 pb-2 shrink-0">
                <div className="min-w-0 flex-1">
                    <div className="text-label font-semibold text-hud-main truncate">{card.title}</div>
                    {card.subtitle && <div className="text-caption text-hud-muted truncate">{card.subtitle}</div>}
                    {card.status && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-caption font-semibold text-white"
                            style={{ background: tones[card.status.tone] || scene.vessel }}>
                            {card.status.text}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                    aria-label={t('common.close')}
                    className="shrink-0 -mr-1 w-10 h-10 flex items-center justify-center rounded-full bg-hud-elevated text-hud-secondary hover:text-hud-main"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className="overflow-y-auto min-h-0 px-4 pb-3">
                {/* The values that matter now, large */}
                <div className="grid grid-cols-4 gap-2">
                    {primary.map(item => (
                        <div key={item.label} className="rounded-xl bg-hud-elevated px-2 py-1.5 min-w-0">
                            {/* The unit beside the label leaves the whole width to the number */}
                            <div className="text-[0.65rem] font-semibold uppercase text-hud-muted truncate">
                                {item.label}{item.unit && <span className="normal-case font-normal"> · {item.unit}</span>}
                            </div>
                            <div className="text-value font-semibold text-hud-main leading-tight truncate">{item.value}</div>
                        </div>
                    ))}
                </div>
                {details.length > 0 && (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                        {details.map(item => (
                            <div key={item.label} className="flex items-baseline justify-between gap-2 min-w-0">
                                <dt className="text-caption text-hud-muted whitespace-nowrap">{item.label}</dt>
                                <dd className="text-caption font-semibold text-hud-main truncate text-right">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </div>
    );
};

/** Our boat, live; wind and heading from the paths chosen in the settings */
const OwnBoatCard = ({ onClose }) => {
    const { t } = useTranslation();
    const config = configService.getAll();
    const windSpeedPath = `environment.wind.${config.preferredWindSpeedPath || 'speedTrue'}`;
    const windAnglePath = `environment.wind.${config.preferredWindDirectionPath || 'angleTrueWater'}`;
    const paths = useMemo(() => [
        'navigation.speedOverGround', 'navigation.speedThroughWater', 'navigation.headingTrue',
        'navigation.headingMagnetic', 'navigation.courseOverGroundTrue', 'performance.velocityMadeGood',
        'performance.polarSpeedRatio', windSpeedPath, windAnglePath,
        'environment.wind.speedApparent', 'environment.wind.angleApparent', 'navigation.position', 'name',
    ], [windSpeedPath, windAnglePath]);
    const v = useSignalKPaths(paths);
    const deg = (rad) => { const d = toDegrees(rad); return d === null ? null : String(d).padStart(3, '0'); };
    const wind = (speed, angle) => {
        const kn = toKnots(speed);
        if (kn === null) return null;
        const a = Number.isFinite(angle) ? Math.round(Math.abs(angle) * 180 / Math.PI) : null;
        return a === null ? `${kn} kn` : `${kn} kn · ${a}°${angle < 0 ? t('hud.portShort') : t('hud.starboardShort')}`;
    };
    const ratio = v['performance.polarSpeedRatio'];
    const ownName = typeof v.name === 'string' ? v.name : v.name?.value;
    const position = v['navigation.position'];
    // The vessel's name from Signal K, the 3D model under it
    const model = configService.getSelectedBoat?.() || configService.get('selectedBoat');
    const modelName = typeof model === 'string' ? model : model?.name;

    return (
        <VesselCard onClose={onClose} card={{
            title: ownName || t('infoPanel.ownBoat'),
            subtitle: ownName ? `${t('infoPanel.ownBoat')} · ${modelName || ''}`.replace(/ · $/, '') : modelName,
            primary: [
                { label: 'SOG', value: toKnots(v['navigation.speedOverGround']), unit: 'kn' },
                { label: 'STW', value: toKnots(v['navigation.speedThroughWater']), unit: 'kn' },
                { label: t('infoPanel.heading'), value: deg(v['navigation.headingTrue'] ?? v['navigation.headingMagnetic']), unit: '°' },
                { label: 'COG', value: deg(v['navigation.courseOverGroundTrue']), unit: '°' },
            ],
            details: [
                { label: 'VMG', value: toKnots(v['performance.velocityMadeGood']) && `${toKnots(v['performance.velocityMadeGood'])} kn` },
                { label: t('hud.polar'), value: Number.isFinite(ratio) && ratio > 0 ? `${Math.round(ratio * 100)} %` : null },
                { label: t('hud.tws'), value: wind(v[windSpeedPath], v[windAnglePath]) },
                { label: t('hud.aws'), value: wind(v['environment.wind.speedApparent'], v['environment.wind.angleApparent']) },
                { label: t('infoPanel.latitude'), value: position && formatCoordinate(position.latitude, true) },
                { label: t('infoPanel.longitude'), value: position && formatCoordinate(position.longitude, false) },
            ],
        }} />
    );
};

const stripUrn = (id) => String(id).replace(/^urn:mrn:(imo:mmsi|signalk:uuid):/, '');

/** An AIS target, live: what the rules of the road expect, range and closest approach */
const AisVesselCard = ({ mmsi, onClose }) => {
    const { t } = useTranslation();
    const { aisData } = useAIS({ passive: true });
    const { statuses, encounters } = useColregs();
    const target = aisData[mmsi];
    if (!target) return null;

    const name = target.name && target.name !== 'unknown' ? target.name : stripUrn(mmsi);
    const encounter = encounters.find(e => e.target.mmsi === mmsi);
    const tone = statuses[mmsi];
    let status = null;
    if (encounter) {
        const { role } = encounter;
        status = {
            tone: role.ownRole === 'stand-on' ? 'yields' : 'giveWay',
            text: `${t(`colregs.${role.reason}`, { name })} · ${t('colregs.rule', { rule: role.rule })}`,
        };
    } else if (tone) {
        status = { tone, text: t(`infoPanel.status.${tone}`) };
    }

    const range = target.distanceMeters;
    const rangeValue = !Number.isFinite(range) ? null : range < 1852 ? { value: Math.round(range), unit: 'm' } : { value: (range / 1852).toFixed(1), unit: 'NM' };
    const tcpa = target.tcpaSeconds;
    const course = target.cog ?? target.cogMagnetic;
    const heading = target.heading ?? target.headingMagnetic;
    const deg = (rad) => { const d = toDegrees(rad); return d === null ? null : `${String(d).padStart(3, '0')}°`; };

    return (
        <VesselCard onClose={onClose} card={{
            title: name,
            subtitle: [t(`infoPanel.category.${targetCategory(target)}`), Number.isFinite(target.length) ? `${Math.round(target.length)} m` : null]
                .filter(Boolean).join(' · '),
            status,
            primary: [
                { label: t('infoPanel.range'), value: rangeValue?.value, unit: rangeValue?.unit },
                { label: 'CPA', value: Number.isFinite(target.cpaMeters) ? (target.cpaMeters / 1852).toFixed(2) : null, unit: 'NM' },
                { label: 'TCPA', value: Number.isFinite(tcpa) && tcpa > 0 ? Math.round(tcpa / 60) : null, unit: 'min' },
                { label: 'SOG', value: toKnots(target.sog), unit: 'kn' },
            ],
            details: [
                { label: 'COG', value: deg(course) },
                { label: t('infoPanel.heading'), value: deg(heading) },
                { label: 'MMSI', value: stripUrn(mmsi) },
                { label: t('infoPanel.callsign'), value: target.callsign },
                { label: t('infoPanel.beam'), value: Number.isFinite(target.beam) ? `${target.beam} m` : null },
                { label: t('infoPanel.state'), value: target.navState && t(`infoPanel.navState.${String(target.navState).replace(/[^a-z]+(.)/gi, (_, c) => c.toUpperCase())}`, { defaultValue: target.navState }) },
            ],
        }} />
    );
};

/**
 * What was tapped in the 3D view, live: `{ kind: 'own' }` our boat,
 * `{ kind: 'ais', mmsi }` an AIS target.
 */
const InfoPanel = ({ content, onClose }) => {
    if (content?.kind === 'own') return <OwnBoatCard onClose={onClose} />;
    if (content?.kind === 'ais') return <AisVesselCard mmsi={content.mmsi} onClose={onClose} />;
    return null;
};

export default InfoPanel;
