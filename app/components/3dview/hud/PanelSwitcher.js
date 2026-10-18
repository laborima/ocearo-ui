import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import configService from '../../settings/ConfigService';

/**
 * One HUD card in a corner of the full-screen 3D view that changes on a tap:
 * depth, wind, speed and tide in turn, skipping the one the other corner
 * shows. The dots under it tell which card of the round it is; the choice
 * is kept.
 *
 * @param {'left'|'right'} side
 * @param {Object<string, React.ComponentType>} panels - card per id, in the order of the round
 * @param {{left: string, right: string}} defaults
 * @param {{left: string, right: string}} shown - the card of each corner now
 * @param {(side: string, id: string) => void} onChange
 */
const PanelSwitcher = ({ side, panels, defaults, shown, onChange }) => {
    const { t } = useTranslation();
    const ids = Object.keys(panels);
    const other = shown[side === 'left' ? 'right' : 'left'];
    const current = shown[side];
    const Panel = panels[current] || panels[defaults[side]];
    const nextId = (() => {
        const start = ids.indexOf(current);
        for (let k = 1; k <= ids.length; k++) {
            const id = ids[(start + k) % ids.length];
            if (id !== other) return id;
        }
        return current;
    })();
    return (
        <button type="button" onClick={() => onChange(side, nextId)} aria-label={t('hud.switchTo', { name: t(`hud.panel_${nextId}`) })}
            className={`flex flex-col gap-1 text-left cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-oBlue ${side === 'right' ? 'items-end' : 'items-start'}`}>
            <Panel />
            <span className="flex gap-1.5 px-1" aria-hidden="true">
                {ids.map((id) => (
                    <span key={id} className={`h-1.5 rounded-full transition-all ${id === current ? 'w-4 bg-hud-main' : id === other ? 'w-1.5 bg-hud-muted opacity-30' : 'w-1.5 bg-hud-muted opacity-60'}`} />
                ))}
            </span>
        </button>
    );
};

/** The two corners' cards, kept in the config */
export const useHudPanels = (defaults) => {
    const [shown, setShown] = useState(() => ({ ...defaults, ...(configService.get('hudPanels') || {}) }));
    const change = (side, id) => {
        setShown((s) => {
            const n = { ...s, [side]: id };
            configService.set('hudPanels', n);
            return n;
        });
    };
    return [shown, change];
};

export default PanelSwitcher;
