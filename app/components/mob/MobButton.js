'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLifeRing } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import signalKService from '../services/SignalKService';
import { useActiveMobs, useMobSupport } from './useMob';

// Long enough that a brushed touchscreen never raises it, short enough for an emergency
const HOLD_MS = 1000;
const MESSAGE_MS = 4000;

/**
 * Bottom-bar Person Overboard button: hold to raise a MOB alarm on the
 * Signal K server. Hidden when the server has no Notifications API.
 */
const MobButton = () => {
  const { t } = useTranslation();
  const support = useMobSupport();
  const activeMobs = useActiveMobs();
  const [holding, setHolding] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const holdTimerRef = useRef(null);
  const messageTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(holdTimerRef.current);
    clearTimeout(messageTimerRef.current);
  }, []);

  if (!support.raise) return null;

  const flash = (text, isError = false) => {
    clearTimeout(messageTimerRef.current);
    setMessage({ text, isError });
    messageTimerRef.current = setTimeout(() => setMessage(null), MESSAGE_MS);
  };

  const raise = async () => {
    setSending(true);
    try {
      await signalKService.raiseMob();
      setMessage(null);
    } catch (error) {
      // Typically 401/403: the display is not logged in with write access
      flash(t('mob.raiseFailed', { error: error?.message || error }), true);
    } finally {
      setSending(false);
    }
  };

  const startHold = () => {
    if (sending || holdTimerRef.current) return;
    setHolding(true);
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setHolding(false);
      raise();
    }, HOLD_MS);
  };

  const cancelHold = () => {
    if (!holdTimerRef.current) return;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    setHolding(false);
    flash(t('mob.holdHint'));
  };

  const active = activeMobs.length > 0;

  return (
    <div className="flex-shrink-0">
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); startHold(); } }}
        onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') cancelHold(); }}
        onContextMenu={(e) => e.preventDefault()}
        disabled={sending}
        className="text-oRed flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl tesla-hover transition-all duration-300 group select-none touch-none disabled:opacity-60"
        aria-label={t('mob.buttonLabel')}
        title={t('mob.holdHint')}
      >
        <div className={`relative w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center rounded-full overflow-hidden border-2 border-oRed ${active ? 'animate-pulse bg-oRed/30' : ''}`}>
          {/* Fills up while held; the alarm is raised when it is full */}
          <span
            className={`absolute inset-0 rounded-full bg-oRed origin-center ${holding ? 'scale-100 duration-1000 ease-linear' : 'scale-0 duration-150'} transition-transform`}
            aria-hidden="true"
          />
          <FontAwesomeIcon icon={faLifeRing} className={`relative text-base sm:text-xl ${holding ? 'text-white' : ''}`} />
        </div>
        <span className="ocearo-large-label text-caption font-semibold uppercase tracking-[0.2em] mt-1">
          {t('mob.short')}
        </span>
      </button>
      {/* Portal: the bottom bar clips its overflow */}
      {message && createPortal(
        <div
          role="status"
          className={`fixed bottom-20 left-4 max-w-[20rem] px-3 py-2 rounded-lg border text-label z-50 shadow-lg ${message.isError ? 'bg-oRed text-white border-oRed' : 'bg-hud-elevated text-hud-main border-hud'}`}
        >
          {message.text}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MobButton;
