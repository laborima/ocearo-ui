import React, { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench, faCheckCircle, faExclamationTriangle, faClock, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import {
  ENGINE_PRESETS, DEFAULT_ENGINE_PRESET,
  loadMaintenanceState, saveMaintenanceState, computeMaintenanceStatus
} from './MaintenanceData';

const STATUS_STYLES = {
  overdue: { dot: 'bg-oRed', text: 'text-oRed' },
  due: { dot: 'bg-oYellow', text: 'text-oYellow' },
  ok: { dot: 'bg-oGreen', text: 'text-oGreen' },
  unknown: { dot: 'bg-hud-muted', text: 'text-hud-muted' },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const MaintenanceView = ({ currentEngineHours }) => {
  const { t } = useTranslation();
  const [state, setState] = useState(() => loadMaintenanceState());
  const [editingItem, setEditingItem] = useState(null);
  const [editHours, setEditHours] = useState('');
  const [editDate, setEditDate] = useState(todayISO());

  const preset = ENGINE_PRESETS[state.engineModel] || ENGINE_PRESETS[DEFAULT_ENGINE_PRESET];

  const updateState = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev);
      saveMaintenanceState(next);
      return next;
    });
  }, []);

  const handleModelChange = (e) => {
    updateState(prev => ({ ...prev, engineModel: e.target.value }));
  };

  const openEditor = (item) => {
    const last = state.lastDone[item.id];
    setEditingItem(item.id);
    setEditHours(last?.hours != null ? String(last.hours) : (currentEngineHours != null ? currentEngineHours.toFixed(1) : ''));
    setEditDate(last?.date || todayISO());
  };

  const saveEditor = () => {
    const hours = parseFloat(editHours);
    updateState(prev => ({
      ...prev,
      lastDone: {
        ...prev.lastDone,
        [editingItem]: {
          hours: Number.isFinite(hours) ? hours : null,
          date: editDate || todayISO(),
        },
      },
    }));
    setEditingItem(null);
  };

  const rows = useMemo(() => preset.items.map(item => ({
    item,
    lastDone: state.lastDone[item.id] || null,
    ...computeMaintenanceStatus(item, state.lastDone[item.id], currentEngineHours),
  })), [preset, state.lastDone, currentEngineHours]);

  const overdueCount = rows.filter(r => r.status === 'overdue').length;
  const dueCount = rows.filter(r => r.status === 'due').length;

  return (
    <div className="space-y-4">
      {/* Header: engine model selector + summary */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
          <div className="w-2 h-2 rounded-full bg-oBlue mr-3 animate-soft-pulse" />
          {t('maintenance.title')}
        </h3>
        <select
          value={state.engineModel}
          onChange={handleModelChange}
          className="bg-hud-elevated px-4 py-1.5 rounded-sm text-hud-main text-xs font-black uppercase border border-hud focus:outline-none tesla-hover transition-all duration-500 shadow-soft"
        >
          {Object.entries(ENGINE_PRESETS).map(([id, p]) => (
            <option key={id} value={id} className="bg-leftPaneBg text-hud-main">{p.name}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="tesla-card p-3 text-center bg-hud-bg border border-hud">
          <div className="text-2xl font-black text-hud-main gliding-value">
            {currentEngineHours != null ? currentEngineHours.toFixed(1) : t('common.na')}
          </div>
          <div className="text-hud-secondary text-xs font-black uppercase tracking-widest mt-1">{t('motor.currentEngineHours')}</div>
        </div>
        <div className={`tesla-card p-3 text-center border ${overdueCount > 0 ? 'bg-oRed/10 border-oRed/30' : 'bg-hud-bg border-hud'}`}>
          <div className={`text-2xl font-black gliding-value ${overdueCount > 0 ? 'text-oRed' : 'text-hud-main'}`}>{overdueCount}</div>
          <div className="text-hud-secondary text-xs font-black uppercase tracking-widest mt-1">{t('maintenance.overdue')}</div>
        </div>
        <div className={`tesla-card p-3 text-center border ${dueCount > 0 ? 'bg-oYellow/10 border-oYellow/30' : 'bg-hud-bg border-hud'}`}>
          <div className={`text-2xl font-black gliding-value ${dueCount > 0 ? 'text-oYellow' : 'text-hud-main'}`}>{dueCount}</div>
          <div className="text-hud-secondary text-xs font-black uppercase tracking-widest mt-1">{t('maintenance.dueSoon')}</div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {rows.map(({ item, lastDone, status, hoursLeft, daysLeft, dueHours, dueDate }) => {
          const style = STATUS_STYLES[status];
          const isEditing = editingItem === item.id;
          return (
            <div key={item.id} className="tesla-card p-3 bg-hud-bg border border-hud tesla-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <span className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${style.dot} ${status === 'overdue' ? 'animate-soft-pulse' : ''}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-hud-main uppercase tracking-widest truncate">
                      {t(`maintenance.items.${item.id}`)}
                    </div>
                    <div className="text-xs text-hud-muted font-black uppercase tracking-tight mt-0.5">
                      {[
                        item.intervalHours != null ? `${item.intervalHours} h` : null,
                        item.intervalMonths != null ? t('maintenance.everyMonths', { count: item.intervalMonths }) : null,
                      ].filter(Boolean).join(' / ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    {status === 'unknown' ? (
                      <div className="text-xs font-black text-hud-muted uppercase tracking-widest">{t('maintenance.neverDone')}</div>
                    ) : (
                      <>
                        <div className={`text-xs font-black uppercase tracking-widest ${style.text}`}>
                          {status === 'overdue' ? t('maintenance.overdueLabel') :
                            [
                              hoursLeft != null ? `${hoursLeft.toFixed(0)} h` : null,
                              daysLeft != null ? t('maintenance.inDays', { count: daysLeft }) : null,
                            ].filter(Boolean).join(' · ')}
                        </div>
                        <div className="text-xs text-hud-muted font-black tracking-tight mt-0.5">
                          {[
                            dueHours != null ? `→ ${dueHours.toFixed(0)} h` : null,
                            dueDate ? `→ ${dueDate.toLocaleDateString('fr-FR')}` : null,
                          ].filter(Boolean).join(' · ')}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => isEditing ? setEditingItem(null) : openEditor(item)}
                    className="px-3 py-1.5 text-xs bg-hud-elevated text-hud-secondary rounded-sm font-black uppercase tracking-widest tesla-hover border border-hud transition-all duration-500"
                  >
                    <FontAwesomeIcon icon={faWrench} className="text-xs" />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 pt-3 border-t border-hud flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-hud-muted font-black uppercase tracking-widest mb-1">
                      <FontAwesomeIcon icon={faClock} className="mr-1 text-xs" />{t('maintenance.doneAtHours')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      className="bg-hud-elevated px-3 py-1.5 rounded-sm text-hud-main text-xs font-black border border-hud focus:outline-none w-28"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-hud-muted font-black uppercase tracking-widest mb-1">
                      <FontAwesomeIcon icon={faCalendarDays} className="mr-1 text-xs" />{t('maintenance.doneOnDate')}
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-hud-elevated px-3 py-1.5 rounded-sm text-hud-main text-xs font-black border border-hud focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={saveEditor}
                    className="bg-oGreen/80 hover:bg-oGreen text-black px-4 py-1.5 rounded-sm text-xs font-black uppercase tracking-widest transition-all duration-500"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-xs" />
                    {t('maintenance.markDone')}
                  </button>
                  {lastDone && (
                    <div className="text-xs text-hud-muted font-black uppercase tracking-tight ml-auto">
                      {t('maintenance.lastDone')}: {lastDone.hours != null ? `${lastDone.hours} h` : '—'} · {lastDone.date ? new Date(lastDone.date).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-hud-muted font-black uppercase tracking-tight flex items-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-xs opacity-50" />
        {t('maintenance.disclaimer')}
      </div>
    </div>
  );
};

export default MaintenanceView;
