'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import useOwnTrack from '../fsd/useOwnTrack';
import useBerthGuidance from './useBerthGuidance';
import { BERTH_TYPES, useBerth, setBerth, placeVirtualBerth } from './parkingStore';

const DEG = 180 / Math.PI;
const ALIGNED = 4;      // degrees
const CENTRED = 0.4;    // metres

/**
 * Harbour view controls and guidance, floating over the scene: the kind of
 * mooring, which side goes alongside, re-placing the virtual berth, and what
 * to do next to line up with it.
 */
const ParkingPanel = () => {
    const { t } = useTranslation();
    const berth = useBerth();
    const guidance = useBerthGuidance();
    const { heading, offset } = useOwnTrack();

    const chip = (active) => `px-3 py-1.5 rounded-full text-caption font-semibold uppercase tracking-wider border transition-colors ${active
        ? 'bg-oBlue text-white border-oBlue'
        : 'border-hud text-hud-secondary hover:text-hud-main'}`;

    let advice = null;
    if (guidance) {
        const turn = Math.round(guidance.headingError * DEG);
        const lateral = guidance.lateral;
        const side = (v) => t(v >= 0 ? 'parking.starboard' : 'parking.port');
        if (Math.abs(guidance.bearing) > Math.PI * 0.6) {
            advice = t('parking.behind');
        } else if (Math.abs(lateral) > CENTRED) {
            // Off the axis: move across first (the opposite way of the offset)
            advice = t('parking.moveAcross', { metres: Math.abs(lateral).toFixed(1), side: side(-lateral) });
        } else if (Math.abs(turn) > ALIGNED) {
            advice = t('parking.turn', { deg: Math.abs(turn), side: side(turn) });
        } else {
            advice = t(guidance.astern ? 'parking.alignedAstern' : 'parking.aligned');
        }
    }

    return (
        <div className="hud-halo flex flex-col items-center gap-2 select-none">
            {guidance && (
                <div className="text-center leading-tight">
                    <div className="text-value font-semibold text-hud-main">{advice}</div>
                    <div className="text-caption text-hud-secondary">
                        {t('parking.entry', { metres: guidance.distance.toFixed(0) })}
                        {guidance.astern ? ` · ${t('parking.astern')}` : ''}
                        {berth.source === 'virtual' ? ` · ${t('parking.virtual')}` : ''}
                    </div>
                </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
                {BERTH_TYPES.map(type => (
                    <button key={type} type="button" className={chip(berth.type === type)} onClick={() => (berth.source === 'virtual' ? placeVirtualBerth(offset, heading, type) : setBerth({ type }))}>
                        {t(`parking.type_${type}`)}
                    </button>
                ))}
                {berth.type === 'side' && (
                    <button type="button" className={chip(false)}
                        onClick={() => setBerth({ side: berth.side === 'port' ? 'starboard' : 'port' })}>
                        {t(berth.side === 'port' ? 'parking.portSide' : 'parking.starboardSide')}
                    </button>
                )}
                <button type="button" className={chip(false)} onClick={() => placeVirtualBerth(offset, heading)}>
                    {t('parking.placeAhead')}
                </button>
            </div>
        </div>
    );
};

export default ParkingPanel;
