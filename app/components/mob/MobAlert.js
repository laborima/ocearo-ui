'use client';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLifeRing, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import signalKService from '../services/SignalKService';
import { useSignalKPath } from '../hooks/useSignalK';
import { convertDistanceUnit, getDistanceUnitLabel } from '../utils/UnitConversions';
import { vesselNow } from '../utils/VesselClock';
import { useActiveMobs, useMobSupport, distanceAndBearing } from './useMob';

// Under this the boat is close: metres read better than 0.05 nm
const SHORT_RANGE_M = 200;
const CONFIRM_MS = 5000;

const formatElapsed = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '--:--';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const formatDistance = (metres) => {
  if (metres < SHORT_RANGE_M) return `${Math.round(metres)} m`;
  return `${convertDistanceUnit(metres)} ${getDistanceUnitLabel()}`;
};

const actionClass = 'px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-sm border-2 border-white/80 disabled:opacity-40 transition-colors';

const MobEntry = ({ mob, now, ownPosition, heading, canNavigate }) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState(null);
  const confirmTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  const status = mob.status || {};
  const createdAt = mob.createdAt ? Date.parse(mob.createdAt) : NaN;
  const range = distanceAndBearing(ownPosition, mob.position);

  const run = async (name, action) => {
    setPending(name);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setPending(null);
    }
  };

  const onClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      confirmTimerRef.current = setTimeout(() => setConfirmClear(false), CONFIRM_MS);
      return;
    }
    clearTimeout(confirmTimerRef.current);
    setConfirmClear(false);
    run('clear', () => signalKService.clearNotification(mob.id));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={faLifeRing} className="text-3xl animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="text-xl sm:text-2xl font-black uppercase tracking-wider leading-tight">{t('mob.title')}</div>
          {mob.message && mob.message !== 'Person Overboard!' && (
            <div className="text-sm opacity-90 truncate">{mob.message}</div>
          )}
        </div>
        <div className="text-right font-mono">
          <div className="text-2xl font-bold">{formatElapsed(now - createdAt)}</div>
          <div className="text-xs uppercase opacity-80">{t('mob.elapsed')}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 font-mono text-lg">
        {range ? (
          <>
            <span>{formatDistance(range.distance)}</span>
            <span className="flex items-center gap-2">
              {/* Relative to the bow, like the boat-up 3D view */}
              {Number.isFinite(heading) && (
                <FontAwesomeIcon icon={faArrowUp} title={t('mob.relativeBearing')}
                  style={{ transform: `rotate(${range.bearing - heading * 180 / Math.PI}deg)` }} />
              )}
              {String(Math.round(range.bearing) % 360).padStart(3, '0')}°T
            </span>
          </>
        ) : (
          <span className="text-sm opacity-80">{t('mob.noPosition')}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {status.canAcknowledge && !status.acknowledged && (
          <button type="button" className={`${actionClass} bg-white text-oRed`} disabled={pending !== null}
            onClick={() => run('ack', () => signalKService.notificationAction(mob.id, 'acknowledge'))}>
            {t('mob.acknowledge')}
          </button>
        )}
        {canNavigate && mob.position && (
          <button type="button" className={`${actionClass} hover:bg-white/20`} disabled={pending !== null}
            onClick={() => run('goto', () => signalKService.setDestinationPosition(mob.position.latitude, mob.position.longitude))}>
            {t('mob.navigateTo')}
          </button>
        )}
        {status.canClear !== false && mob.id && (
          <button type="button" className={`${actionClass} ${confirmClear ? 'bg-white text-oRed' : 'hover:bg-white/20'}`} disabled={pending !== null}
            onClick={onClear}>
            {confirmClear ? t('mob.confirmClear') : t('mob.clear')}
          </button>
        )}
      </div>
      {error && <div className="text-sm bg-black/30 rounded px-2 py-1">{error}</div>}
    </div>
  );
};

// Mounted only while an alarm is active, so the clock starts fresh each time
const MobBanner = ({ mobs, canNavigate }) => {
  const ownPosition = useSignalKPath('navigation.position');
  const headingTrue = useSignalKPath('navigation.headingTrue');
  const cog = useSignalKPath('navigation.courseOverGroundTrue');
  const heading = Number.isFinite(headingTrue) ? headingTrue : cog;
  const [now, setNow] = useState(() => vesselNow().getTime());

  useEffect(() => {
    const timer = setInterval(() => setNow(vesselNow().getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="alert"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-[min(32rem,calc(100%-2rem))] max-h-[70%] overflow-y-auto bg-oRed text-white rounded-2xl shadow-2xl border-2 border-white/60 p-4 flex flex-col gap-4 divide-y divide-white/30"
    >
      {mobs.map((mob) => (
        <div key={mob.path} className="pt-4 first:pt-0">
          <MobEntry mob={mob} now={now} ownPosition={ownPosition} heading={heading} canNavigate={canNavigate} />
        </div>
      ))}
    </div>
  );
};

/**
 * Banner shown over every view while a Person Overboard alarm is active,
 * whichever display raised it.
 */
const MobAlert = () => {
  const mobs = useActiveMobs();
  const support = useMobSupport();
  if (mobs.length === 0) return null;
  return <MobBanner mobs={mobs} canNavigate={support.navigate} />;
};

export default MobAlert;
