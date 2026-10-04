import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import useTheme from '../../theme/useTheme';
import useColregs from '../../hooks/useColregs';

/**
 * Unmistakable cue when the rules of the road make us keep clear: a banner
 * in the boat's alert colour (the whole hull takes it too) naming the vessel
 * and the rule. Nothing when we stand on or have no risk of collision.
 */
const GiveWayBanner = () => {
    const { t } = useTranslation();
    const { scene } = useTheme();
    const { giveWayTo, encounters } = useColregs();
    if (!giveWayTo) return null;
    const { target, role } = giveWayTo;
    const others = encounters.filter(e => e.role.ownRole !== 'stand-on').length - 1;

    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl select-none text-white backdrop-blur"
            style={{ background: `color-mix(in srgb, ${scene.giveWay} 82%, transparent)` }} role="alert">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg" />
            <div className="leading-tight">
                <div className="text-label font-bold uppercase tracking-widest">{t('colregs.youGiveWay')}</div>
                <div className="text-caption font-semibold opacity-95">
                    {t(`colregs.${role.reason}`, { name: target.name })} · {t('colregs.rule', { rule: role.rule })}
                    {others > 0 && ` · +${others}`}
                </div>
            </div>
        </div>
    );
};

export default GiveWayBanner;
