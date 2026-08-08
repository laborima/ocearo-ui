'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHardDrive, faTemperatureHalf, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { makeOcearoCoreApiCall } from '../utils/OcearoCoreUtils';

const POLL_MS = 5000;

/** Bytes to a compact human string. */
const gb = (bytes) => (Number.isFinite(bytes) ? `${(bytes / 1e9).toFixed(1)} GB` : '--');
const mb = (bytes) => (Number.isFinite(bytes) ? `${Math.round(bytes / 1e6)} MB` : '--');

/** Uptime seconds to "3d 4h 17m". */
const formatUptime = (s) => {
  if (!Number.isFinite(s)) return '--';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean).join(' ');
};

/**
 * Colour thresholds shared by every meter: green below warn, yellow up to
 * critical, red beyond. Keeps the tab readable at a glance from the helm.
 */
const meterColor = (value, warn, critical) => {
  if (!Number.isFinite(value)) return 'text-hud-muted';
  if (value >= critical) return 'text-oRed';
  if (value >= warn) return 'text-oYellow';
  return 'text-oGreen';
};

const Meter = ({ label, value, unit, percent, warn, critical, icon }) => {
  const color = meterColor(percent ?? value, warn, critical);
  return (
    <div className="tesla-card p-4 bg-hud-elevated rounded-sm border border-hud">
      <div className="flex items-center justify-between mb-2">
        <span className="text-hud-secondary text-xs font-black uppercase tracking-widest">
          <FontAwesomeIcon icon={icon} className="mr-2 opacity-60" />
          {label}
        </span>
      </div>
      <div className={`text-3xl font-black gliding-value ${color}`}>
        {Number.isFinite(value) ? value : '--'}
        <span className="text-sm ml-1 opacity-60">{unit}</span>
      </div>
      {Number.isFinite(percent) && (
        <div className="mt-3 h-1 bg-hud rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Host metrics for the Raspberry Pi running the stack: temperature, CPU, memory,
 * disk, firmware throttling flags and the heaviest processes.
 */
const RaspberryPiTab = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await makeOcearoCoreApiCall('/system/metrics?top=8');
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, POLL_MS);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  if (error && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center text-hud-muted text-sm font-black uppercase tracking-widest">
        {t('battery.rpiUnavailable')}
      </div>
    );
  }

  const cpu = metrics?.cpu ?? {};
  const mem = metrics?.memory ?? {};
  const disk = metrics?.disk ?? {};
  const thr = cpu.throttling;

  // Only the "now" flags are actionable; the since-boot ones are history.
  const throttlingNow = thr && (thr.underVoltageNow || thr.throttledNow || thr.softTempLimitNow || thr.frequencyCappedNow);
  const throttlingPast = thr && (thr.underVoltageSinceBoot || thr.throttledSinceBoot || thr.softTempLimitSinceBoot || thr.frequencyCappedSinceBoot);

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-hud-main text-sm font-black uppercase tracking-widest">
          {metrics?.hostname ?? '--'}
        </span>
        <span className="text-hud-muted text-xs font-black uppercase tracking-widest">
          {t('battery.rpiUptime')} {formatUptime(metrics?.uptimeSeconds)}
        </span>
      </div>

      {throttlingNow && (
        <div className="flex items-center p-3 rounded-sm border border-oRed/40 bg-oRed/10 text-oRed text-xs font-black uppercase tracking-widest">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
          {thr.softTempLimitNow || thr.throttledNow ? t('battery.rpiThrottlingHeat') : t('battery.rpiThrottlingPower')}
        </div>
      )}
      {!throttlingNow && throttlingPast && (
        <div className="flex items-center p-3 rounded-sm border border-oYellow/40 bg-oYellow/10 text-oYellow text-xs font-black uppercase tracking-widest">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
          {t('battery.rpiThrottlingPast')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Meter
          label={t('battery.rpiTemperature')} icon={faTemperatureHalf}
          value={cpu.temperature} unit="°C" percent={cpu.temperature}
          warn={70} critical={80}
        />
        <Meter
          label={t('battery.rpiCpu')} icon={faMicrochip}
          value={cpu.percent} unit="%" percent={cpu.percent}
          warn={70} critical={90}
        />
        <Meter
          label={t('battery.rpiMemory')} icon={faMemory}
          value={mem.usedPercent} unit="%" percent={mem.usedPercent}
          warn={75} critical={90}
        />
        <Meter
          label={t('battery.rpiDisk')} icon={faHardDrive}
          value={disk.usedPercent} unit="%" percent={disk.usedPercent}
          warn={80} critical={92}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: t('battery.rpiLoad'), value: cpu.loadAverage ? cpu.loadAverage.join('  ') : '--' },
          { label: t('battery.rpiRam'), value: `${gb(mem.used)} / ${gb(mem.total)}` },
          { label: t('battery.rpiSwap'), value: gb(mem.swapUsed) }
        ].map((s) => (
          <div key={s.label} className="tesla-card p-3 bg-hud-elevated rounded-sm border border-hud">
            <div className="text-hud-muted text-[10px] font-black uppercase tracking-widest">{s.label}</div>
            <div className="text-hud-main text-sm font-black gliding-value mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="tesla-card bg-hud-elevated rounded-sm border border-hud overflow-hidden">
        <div className="px-4 py-2 border-b border-hud text-hud-secondary text-xs font-black uppercase tracking-widest">
          {t('battery.rpiTopProcesses')}
        </div>
        <table className="w-full text-xs font-black">
          <tbody className="divide-y divide-hud">
            {(metrics?.processes ?? []).map((p) => (
              <tr key={p.pid} className="text-hud-main">
                <td className="px-4 py-2 truncate max-w-[10rem] normal-case">{p.name}</td>
                <td className="px-2 py-2 text-hud-muted font-mono">{p.pid}</td>
                <td className={`px-2 py-2 text-right gliding-value ${meterColor(p.cpuPercent, 50, 100)}`}>
                  {Number.isFinite(p.cpuPercent) ? `${p.cpuPercent}%` : '--'}
                </td>
                <td className="px-4 py-2 text-right text-hud-secondary gliding-value">{mb(p.memoryBytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RaspberryPiTab;
