'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRoute } from '@fortawesome/free-solid-svg-icons';
import { getSamples, listVoyages } from './voyageStore';
import { startReplay } from './replayEngine';

const NM = 1852;
const KN = 1.943844;

const duration = (ms) => {
    const min = Math.round(ms / 60000);
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
};

/**
 * Voyages recorded on this display (see VoyageRecorder), newest first, each
 * with a Replay button that plays it back in the 3D view.
 */
const VoyageList = () => {
    const { t, i18n } = useTranslation();
    const [voyages, setVoyages] = useState(null);
    const [error, setError] = useState(null);
    const [loadingId, setLoadingId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        listVoyages()
            .then((v) => { if (!cancelled) setVoyages(v); })
            .catch((e) => { if (!cancelled) { setError(e.message); setVoyages([]); } });
        return () => { cancelled = true; };
    }, []);

    const replay = useCallback(async (voyage) => {
        setLoadingId(voyage.id);
        try {
            const samples = await getSamples(voyage.start, voyage.end);
            startReplay(voyage, samples);
        } finally {
            setLoadingId(null);
        }
    }, []);

    const dateFmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="p-4 flex flex-col gap-4">
            <h3 className="text-caption font-semibold text-hud-main uppercase tracking-widest flex items-center">
                <FontAwesomeIcon icon={faRoute} className="mr-2 text-oBlue text-xs" />
                {t('replay.voyages')}
            </h3>
            <p className="text-caption text-hud-muted max-w-prose">{t('replay.explain')}</p>
            {error && <div className="text-caption text-oRed">{error}</div>}
            {voyages && voyages.length === 0 && (
                <div className="tesla-card p-4 text-label text-hud-secondary">{t('replay.none')}</div>
            )}
            <ul className="flex flex-col gap-2">
                {voyages?.map((v) => (
                    <li key={v.id} className="tesla-card px-4 py-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="text-label font-semibold text-hud-main">{dateFmt.format(new Date(v.start))}</div>
                            <div className="text-caption text-hud-muted tabular-nums">
                                {duration(v.end - v.start)} · {(v.distanceM / NM).toFixed(1)} NM · {t('replay.max')} {(v.maxSog * KN).toFixed(1)} kn
                            </div>
                        </div>
                        <button type="button" onClick={() => replay(v)} disabled={loadingId === v.id}
                            className="bg-oBlue hover:bg-oBlue/80 text-white px-3 py-1.5 rounded text-caption font-semibold uppercase flex items-center gap-2 disabled:opacity-50">
                            <FontAwesomeIcon icon={faPlay} />
                            {t('replay.replay')}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default VoyageList;
