'use client';
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getReplayState, seekReplay, setReplaySpeed, stopReplay, subscribeReplay, togglePlay } from './replayEngine';

const SPEEDS = [10, 30, 60, 120];

const clock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Replay state as a React value */
export const useReplay = () => useSyncExternalStore(subscribeReplay, getReplayState, getReplayState);

/**
 * Playback bar over the 3D view while a voyage is replayed: play / pause,
 * speed, a timeline to scrub, the replayed time, and close (back to live).
 */
const ReplayBar = () => {
    const { t } = useTranslation();
    const replay = useReplay();
    if (!replay.active) return null;
    const span = Math.max(1, replay.end - replay.start);

    return (
        <div className="hud-halo flex items-center gap-3 px-3 py-2 rounded-2xl bg-hud-bg/80 backdrop-blur select-none w-[min(40rem,100%)] flex-wrap">
            <span className="text-caption font-semibold uppercase tracking-widest text-oBlue shrink-0">{t('replay.title')}</span>
            <button type="button" onClick={togglePlay} aria-label={replay.playing ? t('replay.pause') : t('replay.play')}
                className="w-9 h-9 rounded-full bg-hud-elevated text-hud-main flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={replay.playing ? faPause : faPlay} />
            </button>
            <input type="range" min={replay.start} max={replay.end} step={1000} value={replay.time}
                onChange={(e) => seekReplay(Number(e.target.value))}
                aria-label={t('replay.timeline')} className="flex-1 min-w-0 accent-oBlue" />
            <span className="text-label font-semibold tabular-nums text-hud-main shrink-0">{clock(replay.time)}</span>
            <span className="text-caption text-hud-muted tabular-nums shrink-0">{Math.round(((replay.time - replay.start) / span) * 100)}%</span>
            <div className="flex gap-1 shrink-0">
                {SPEEDS.map((s) => (
                    <button key={s} type="button" onClick={() => setReplaySpeed(s)}
                        className={`px-2 py-1 rounded-lg text-caption font-semibold ${replay.speed === s ? 'bg-oBlue text-white' : 'text-hud-muted hover:text-hud-main'}`}>
                        ×{s}
                    </button>
                ))}
            </div>
            <button type="button" onClick={stopReplay} aria-label={t('replay.close')}
                className="w-8 h-8 rounded-full text-hud-muted hover:text-hud-main flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faXmark} />
            </button>
        </div>
    );
};

export default ReplayBar;
