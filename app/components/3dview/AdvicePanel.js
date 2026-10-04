'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCourseAdvice from '../hooks/useCourseAdvice';
import { useSignalKPaths } from '../hooks/useSignalK';
import signalKService from '../services/SignalKService';
import { formatAdvice } from './fsd/adviceText';

// Same two-tap window as tack / gybe in the autopilot view
const CONFIRM_WINDOW_MS = 4000;
// The heading adjustment only means "turn by N°" in heading-holding modes
const HEADING_MODES = ['compass', 'gps', 'heading', 'auto'];
const PILOT_PATHS = ['steering.autopilot.engaged', 'steering.autopilot.state', 'steering.autopilot.mode'];

/**
 * Course advice card under the 3D view: what to do, why it is only advice,
 * and an optional "apply to autopilot" with a confirming second tap.
 */
const AdvicePanel = () => {
    const { t } = useTranslation();
    const advice = useCourseAdvice();
    const pilot = useSignalKPaths(PILOT_PATHS);
    const [armed, setArmed] = useState(false);
    const [status, setStatus] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    if (!advice) return null;

    const engaged = pilot['steering.autopilot.engaged'] ?? pilot['steering.autopilot.state'] === 'enabled';
    const mode = pilot['steering.autopilot.mode'];
    const canApply = engaged === true && (!mode || HEADING_MODES.includes(mode)) && advice.change !== null;
    const changeDeg = Math.round((advice.change ?? 0) * 180 / Math.PI);

    const onApply = async () => {
        if (!armed) {
            setArmed(true);
            timerRef.current = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
            return;
        }
        clearTimeout(timerRef.current);
        setArmed(false);
        try {
            await signalKService.adjustAutopilotTarget(changeDeg);
            setStatus({ ok: true, text: t('advice.applied') });
        } catch (error) {
            setStatus({ ok: false, text: error?.message || String(error) });
        }
        setTimeout(() => setStatus(null), 4000);
    };

    const danger = advice.kind === 'avoid';
    const standOn = advice.kind === 'standOn';

    return (
        <div className={`tesla-card !p-3 flex items-center gap-3 max-w-[30rem] ${danger ? 'border-oRed/60' : ''}`}>
            <div className="min-w-0 flex-1">
                <div className={`text-label font-semibold ${danger ? 'text-oRed' : standOn ? 'text-oGreen' : 'text-oYellow'}`}>
                    {formatAdvice(advice, t)}
                </div>
                <div className="text-caption text-hud-muted truncate">
                    {status ? status.text : advice.reason
                        ? `${t(`colregs.${advice.reason}`, { name: advice.targetName || 'AIS' })} · ${t('colregs.rule', { rule: advice.lastMoment ? '17b' : advice.rule })}`
                        : (danger ? t('advice.avoidHint', { name: advice.targetName || 'AIS' }) : t('advice.vmgHint'))}
                </div>
            </div>
            {canApply && !standOn && (
                <button
                    type="button"
                    onClick={onApply}
                    className={`shrink-0 px-3 py-2 rounded-lg text-caption font-semibold uppercase tracking-wider border transition-colors ${armed
                        ? 'bg-oYellow text-black border-oYellow'
                        : 'border-hud text-hud-main tesla-hover'}`}
                >
                    {armed ? t('advice.confirm') : t('advice.apply')}
                </button>
            )}
        </div>
    );
};

export default AdvicePanel;
