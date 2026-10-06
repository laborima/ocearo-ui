import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import { tensionToColor } from '../sail/SailTrimUtils';

// The load colours of the sheets, vang and backstay (eased, medium, hard on)
const LOAD_COLORS = [0, 0.5, 1].map((x) => {
    const { r, g, b } = tensionToColor(x);
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
});

/** A colour sample shaped like what it stands for in the scene */
const Swatch = ({ kind, colors }) => {
    const [a, b, c] = colors;
    if (kind === 'chevrons') {
        return (
            <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
                <rect x="0" y="2" width="28" height="10" rx="2" fill={a} opacity="0.35" />
                {[4, 13, 22].map(x => <path key={x} d={`M${x} 4 l4 3 l-4 3`} stroke={a} strokeWidth="2" fill="none" />)}
            </svg>
        );
    }
    if (kind === 'bands') {
        return (
            <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
                {[a, b, c].filter(Boolean).map((col, i, all) => (
                    <rect key={col} x={(28 / all.length) * i} y="4" width={28 / all.length} height="6" fill={col} />
                ))}
            </svg>
        );
    }
    if (kind === 'dashed') {
        return (
            <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
                <line x1="1" y1="7" x2="27" y2="7" stroke={a} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
        );
    }
    if (kind === 'hull') {
        return (
            <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
                <path d="M2 7 Q8 1 22 2 L26 7 L22 12 Q8 13 2 7 Z" fill={a} stroke={b} strokeWidth="1" />
            </svg>
        );
    }
    if (kind === 'arrow') {
        return (
            <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
                <path d="M3 7 H20 M15 2 L21 7 L15 12" stroke={a} strokeWidth="2.5" fill="none" />
            </svg>
        );
    }
    return null;
};

/** What each ribbon, band and colour of the scene means, in theme colours */
export const useLegendRows = () => {
    const { t } = useTranslation();
    const { scene, accent } = useTheme();
    return [
        { kind: 'chevrons', colors: [scene.route], label: t('legend.route') },
        { kind: 'bands', colors: [scene.wakeGood, scene.wakeFair, scene.wakeBad], label: t('legend.wake') },
        { kind: 'bands', colors: [scene.laylinePort, scene.laylineStarboard], label: t('legend.laylines') },
        { kind: 'dashed', colors: [scene.compass], label: t('legend.isochrones') },
        { kind: 'hull', colors: [scene.ghost, scene.ghost], label: t('legend.ghost') },
        { kind: 'hull', colors: [scene.vessel, scene.vessel], label: t('legend.vessel') },
        { kind: 'hull', colors: [scene.vesselDanger, scene.vesselDanger], label: t('legend.danger') },
        { kind: 'hull', colors: [scene.vesselYields, scene.vesselYields], label: t('legend.yields') },
        { kind: 'hull', colors: [scene.vesselClose, scene.vesselClose], label: t('legend.close') },
        { kind: 'dashed', colors: [scene.vesselDanger], label: t('legend.cpa') },
        { kind: 'hull', colors: [scene.giveWay, scene.giveWay], label: t('legend.giveWay') },
        { kind: 'dashed', colors: [scene.target], label: t('legend.advice') },
        { kind: 'bands', colors: [accent], label: t('legend.trim') },
        { kind: 'bands', colors: LOAD_COLORS, label: t('legend.loads') },
    ];
};

/** The legend rows with their swatches (3D view chip and the guide) */
export const LegendList = ({ className = 'gap-1 text-caption' }) => {
    const rows = useLegendRows();
    return (
        <ul className={`flex flex-col text-hud-main leading-tight ${className}`}>
            {rows.map(row => (
                <li key={row.label} className="flex items-center gap-2">
                    <span className="shrink-0 w-7 flex justify-center"><Swatch kind={row.kind} colors={row.colors} /></span>
                    <span>{row.label}</span>
                </li>
            ))}
        </ul>
    );
};

/**
 * Legend of the 3D scene: what each ribbon, band and colour means. Closed
 * by default (a small "Legend" chip); remembers whether it was left open.
 */
const SceneLegend = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(() => configService.get('sceneLegendOpen') === true);

    const toggle = () => {
        configService.set('sceneLegendOpen', !open);
        setOpen(!open);
    };

    if (!open) {
        return (
            <button type="button" onClick={toggle}
                className="hud-halo flex items-center gap-2 px-2 py-1 text-caption font-semibold uppercase tracking-widest text-hud-muted hover:text-hud-main">
                <FontAwesomeIcon icon={faCircleInfo} />
                {t('legend.title')}
            </button>
        );
    }

    return (
        <div className="relative z-40 px-3 py-2 max-w-[19rem] max-h-[45vh] overflow-y-auto select-none rounded-2xl bg-hud-bg/90 backdrop-blur shadow-soft">
            <div className="flex items-center justify-between mb-1">
                <span className="text-caption font-semibold uppercase tracking-widest text-hud-muted">{t('legend.title')}</span>
                <button type="button" onClick={toggle} aria-label={t('common.close')} className="text-hud-muted hover:text-hud-main px-1">
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
            <LegendList />
        </div>
    );
};

export default SceneLegend;
