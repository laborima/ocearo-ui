'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

// Scene units per metre around the boat (AIS positions, seamarks, seabed,
// charts). The boat and the AIS models keep their size: a smaller scale brings
// the world closer, a larger one spreads it out and deepens the seabed.
export const DEFAULT_SCENE_SCALE = 0.7;
export const SCENE_SCALES = [0.25, 0.35, 0.5, 0.7, 1.0, 1.4, 2.0];

const nearestIndex = (value) => {
    let best = 0;
    SCENE_SCALES.forEach((s, i) => {
        if (Math.abs(s - value) < Math.abs(SCENE_SCALES[best] - value)) best = i;
    });
    return best;
};

/**
 * Zoom of the world around the boat, under the battery gauge: − and + step
 * through SCENE_SCALES, the label shows the factor against the default.
 *
 * @param {{ value: number, onChange: (scale: number) => void }} props
 */
const SceneScaleControl = ({ value, onChange }) => {
    const { t } = useTranslation();
    const index = nearestIndex(value);
    const factor = SCENE_SCALES[index] / DEFAULT_SCENE_SCALE;
    const label = factor >= 1 ? `×${Number(factor.toFixed(1))}` : `÷${Number((1 / factor).toFixed(1))}`;
    const step = (delta) => {
        const next = SCENE_SCALES[Math.max(0, Math.min(SCENE_SCALES.length - 1, index + delta))];
        if (next !== SCENE_SCALES[index]) onChange(next);
    };
    const button = 'w-9 h-9 flex items-center justify-center rounded-lg text-hud-main hover:bg-hud-elevated/60 disabled:opacity-30';

    return (
        <div className="flex items-center gap-1 rounded-xl bg-hud-bg/70 backdrop-blur-sm px-1 py-1"
            title={t('sceneScale.help')}>
            <button type="button" className={button} onClick={() => step(-1)} disabled={index === 0}
                aria-label={t('sceneScale.closer')}>
                <FontAwesomeIcon icon={faMinus} />
            </button>
            <span className="min-w-[3rem] text-center text-caption font-semibold tabular-nums text-hud-main"
                onDoubleClick={() => onChange(DEFAULT_SCENE_SCALE)}>
                {index === SCENE_SCALES.indexOf(DEFAULT_SCENE_SCALE) ? '1:1' : label}
            </span>
            <button type="button" className={button} onClick={() => step(1)} disabled={index === SCENE_SCALES.length - 1}
                aria-label={t('sceneScale.wider')}>
                <FontAwesomeIcon icon={faPlus} />
            </button>
        </div>
    );
};

export default SceneScaleControl;
