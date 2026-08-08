import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook, faTimeline, faChartLine, faRobot, faPlus, faEdit, faTrash,
  faClock, faCompass, faTachometerAlt, faCloudSun, faThermometerHalf,
  faMapMarkerAlt, faLocationDot, faRuler, faCar, faUser, faStickyNote,
  faTimes, faSave, faTrophy, faFlag
} from '@fortawesome/free-solid-svg-icons';
import configService from '../settings/ConfigService';
import { msToKnots, toDegrees, convertPressure } from '../utils/UnitConversions';
import { 
  isOcearoCoreEnabled, 
  generateOcearoCoreLogbookEntry, 
  analyzeLogbookWithOcearoCore,
  collectCurrentVesselData,
  handleOcearoCoreError,
  fetchLogbookEntries,
  addLogbookEntry,
  requestAnalysis
} from '../utils/OcearoCoreUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * LogbookView component with three tabs: Timeline, Logbook, and Analysis
 * Integrates with SignalK logbook API and includes OcearoCore functionality
 */
const LogbookView = () => {
  const { t } = useTranslation();
  const { nightMode, states, toggleState } = useOcearoContext();
  const racingMode = states?.racing ?? false;
  const [activeTab, setActiveTab] = useState('logbook');
  
  // Define paths for capturing vessel state during entry creation
  const logbookPaths = useMemo(() => [
    'navigation.position',
    'navigation.courseOverGroundTrue',
    'navigation.headingTrue',
    'navigation.speedOverGround',
    'environment.wind.speedTrue',
    'environment.wind.angleTrueWater',
    'environment.wind.speedApparent',
    'environment.wind.angleApparent',
    'environment.outside.pressure',
    'environment.outside.temperature',
    'environment.depth.belowKeel',
    'environment.depth.belowTransducer',
    'navigation.log',
    'propulsion.main.runTime'
  ], []);

  const skValues = useSignalKPaths(logbookPaths);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayTimeZone, setDisplayTimeZone] = useState('UTC');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({
    text: '',
    author: 'manual'
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [aiEntryLoading, setAiEntryLoading] = useState(false);

  // Check if OcearoCore is enabled from config
  const config = configService.getAll();
  const ocearoCoreEnabled = isOcearoCoreEnabled();

  /**
   * Fetch logbook entries through OcearoCore proxy
   */
  const fetchLogbookEntriesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use OcearoCore proxy to fetch logbook entries
      const rawEntries = await fetchLogbookEntries();
      
      // Transform entries to ensure correct data types (Date objects, etc.)
      const transformedEntries = rawEntries.map(entry => ({
        ...entry,
        date: new Date(entry.datetime || entry.date),
        point: entry.point ? {
          ...entry.point,
          toString: () => {
            if (typeof entry.point.latitude === 'number' && typeof entry.point.longitude === 'number') {
              return `${entry.point.latitude.toFixed(6)}, ${entry.point.longitude.toFixed(6)}`;
            }
            return 'Invalid coordinates';
          }
        } : null
      }));

      setEntries(transformedEntries);
    } catch (err) {
      if (err.name !== 'NetworkError' && err.name !== 'TimeoutError') {
        console.warn('Error fetching logbook entries:', err);
      }
      const errorMessage = handleOcearoCoreError(err, 'Logbook fetch');
      setError(errorMessage);
      
      // Fallback to sample data only in debug mode
      const debugMode = configService.get('debugMode');
      if (debugMode) {
        setEntries(getSampleEntries());
      } else {
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sample entries for development/testing
   */
  const getSampleEntries = () => [
    {
      datetime: new Date().toISOString(),
      date: new Date(),
      course: 45,
      speed: { sog: 6.5 },
      wind: { speed: 12, direction: 180 },
      observations: { seaState: 2, cloudCoverage: 3, visibility: 7 },
      barometer: 1013.2,
      point: {
        latitude: 46.1591,
        longitude: -1.1522,
        toString: () => "46.159100, -1.152200"
      },
      position: { source: 'GPS', latitude: 46.1591, longitude: -1.1522 },
      log: 125.5,
      engine: { hours: 245.2 },
      author: 'Captain',
      text: 'Departing La Rochelle, good conditions'
    },
    {
      datetime: new Date(Date.now() - 3600000).toISOString(),
      date: new Date(Date.now() - 3600000),
      heading: 42,
      speed: { sog: 7.2 },
      wind: { speed: 15, direction: 200 },
      observations: { seaState: 3, cloudCoverage: 2, visibility: 8 },
      barometer: 1012.8,
      point: {
        latitude: 46.2591,
        longitude: -1.2522,
        toString: () => "46.259100, -1.252200"
      },
      position: { source: 'GPS', latitude: 46.2591, longitude: -1.2522 },
      log: 132.1,
      engine: { hours: 245.8 },
      author: 'auto',
      text: 'Wind picking up, adjusting course'
    }
  ];

  /**
   * Show add entry modal
   */
  const showAddEntryModal = useCallback(() => {
    setSelectedEntry(null); // ensure "Add" mode (otherwise the modal keeps the last edited entry's title)
    setEntryForm({
      text: '',
      author: 'manual'
    });
    setShowEntryModal(true);
  }, []);

  /**
   * Add a new logbook entry through OcearoCore proxy
   */
  const addEntry = useCallback(async () => {
    try {
      let payload;
      if (selectedEntry) {
        // Editing an existing entry: preserve its original timestamp/position/telemetry
        // and only override the user-editable fields. NB: the OcearoCore proxy only
        // exposes /logbook/add-entry, so this updates in place only if the backend
        // upserts by datetime.
        payload = {
          ...selectedEntry,
          author: entryForm.author || selectedEntry.author || 'manual',
          text: entryForm.text || selectedEntry.text || 'Manual entry'
        };
        // Drop client-only fields added during transform
        delete payload.date;
        delete payload.point;
      } else {
        const position = skValues['navigation.position'] || {};

        // Entries are stored in display units (knots / degrees / hPa / NM / hours /
        // metres) — that is what the server writes in getVesselContext() and what the
        // table renders. SignalK deltas are SI, so convert here; storing the raw SI
        // value made manual entries read 1852x too far and wind angles in radians.
        const heading = skValues['navigation.headingTrue'];
        const windSpeedTrue = skValues['environment.wind.speedTrue'];
        const windSpeedApp = skValues['environment.wind.speedApparent'];
        const useApparent = windSpeedTrue === null || windSpeedTrue === undefined;
        const windSpeedMs = useApparent ? windSpeedApp : windSpeedTrue;
        const windAngleRad = useApparent
          ? skValues['environment.wind.angleApparent']
          : skValues['environment.wind.angleTrueWater'];

        const wind = {};
        const windSpeedKts = msToKnots(windSpeedMs);
        if (windSpeedKts !== null) wind.speed = windSpeedKts;
        // The stored `direction` is a compass bearing, not a relative angle.
        if (heading !== null && heading !== undefined && windAngleRad !== null && windAngleRad !== undefined) {
          const dir = toDegrees(heading + windAngleRad);
          if (dir !== null) wind.direction = dir;
        }
        if (useApparent && Object.keys(wind).length) wind.apparent = true;

        const depthMetres = skValues['environment.depth.belowKeel']
          ?? skValues['environment.depth.belowTransducer'];
        const logMetres = skValues['navigation.log'];
        const runTimeSeconds = skValues['propulsion.main.runTime'];

        payload = {
          datetime: new Date().toISOString(),
          position: {
            latitude: position.latitude || 46.1591,
            longitude: position.longitude || -1.1522,
            source: 'GPS'
          },
          course: toDegrees(skValues['navigation.courseOverGroundTrue'] ?? heading),
          speed: {
            sog: msToKnots(skValues['navigation.speedOverGround'])
          },
          wind,
          barometer: convertPressure(skValues['environment.outside.pressure']),
          log: Number.isFinite(logMetres) ? parseFloat((logMetres / 1852).toFixed(1)) : null,
          depth: Number.isFinite(depthMetres) ? parseFloat(depthMetres.toFixed(1)) : null,
          engine: {
            hours: Number.isFinite(runTimeSeconds) ? parseFloat((runTimeSeconds / 3600).toFixed(1)) : null
          },
          author: entryForm.author || 'manual',
          text: entryForm.text || 'Manual entry'
        };
      }

      // Use OcearoCore proxy to persist the entry
      await addLogbookEntry(payload);

      // Close modal and refresh entries
      setShowEntryModal(false);
      setSelectedEntry(null);
      fetchLogbookEntriesData();
    } catch (err) {
      console.warn('Error saving entry:', err);
      const errorMessage = handleOcearoCoreError(err, 'Save logbook entry');
      setError(errorMessage);
    }
  }, [skValues, fetchLogbookEntriesData, entryForm, selectedEntry]);

  /**
   * Add entry using OcearoCore AI
   */
  const addOcearoCoreEntry = useCallback(async () => {
    if (!ocearoCoreEnabled) {
      setError(t('logbook.ocearoCoreNotEnabled'));
      return;
    }

    try {
      setAiEntryLoading(true);
      setError(null);
      
      // Collect current boat data for OcearoCore analysis using current values
      const currentData = {
        position: skValues['navigation.position'],
        course: skValues['navigation.courseOverGroundTrue'] || skValues['navigation.headingTrue'],
        speed: skValues['navigation.speedOverGround'],
        wind: {
          speed: skValues['environment.wind.speedTrue'],
          direction: skValues['environment.wind.angleTrueWater']
        },
        weather: {
          pressure: skValues['environment.outside.pressure'],
          temperature: skValues['environment.outside.temperature']
        },
        engine: {
          hours: skValues['propulsion.main.runTime']
        },
        log: skValues['navigation.log']
      };

      // Call OcearoCore API to generate intelligent logbook entry
      const result = await generateOcearoCoreLogbookEntry(currentData);
      
      // Refresh entries after successful generation
      await fetchLogbookEntriesData();

      if (result && result.analysis) {
        setAnalysisResult(result.analysis);
        setAnalysisType('auto-entry');
        setActiveTab('analysis');
      }
      
    } catch (err) {
      const errorMessage = handleOcearoCoreError(err, 'OcearoCore entry generation');
      setError(errorMessage);
    } finally {
      setAiEntryLoading(false);
    }
  }, [ocearoCoreEnabled, skValues, fetchLogbookEntriesData]);

  /**
   * Get OcearoCore analysis of logbook data
   */
  const getOcearoCoreAnalysis = useCallback(async (type) => {
    if (!ocearoCoreEnabled) {
      setError(t('logbook.ocearoCoreNotEnabled'));
      return;
    }

    try {
      setAnalysisLoading(true);
      setAnalysisResult(null);
      setAnalysisType(type);
      setError(null);
      setActiveTab('analysis');
      
      // Call OcearoCore /analyze endpoint with the selected type
      const analysis = await requestAnalysis(type);
      
      // Store analysis results
      setAnalysisResult(analysis);
      console.log('OcearoCore Analysis:', analysis);
      
    } catch (err) {
      const errorMessage = handleOcearoCoreError(err, 'OcearoCore analysis');
      setError(errorMessage);
    } finally {
      setAnalysisLoading(false);
    }
  }, [ocearoCoreEnabled]);

  /**
   * Get logbook-specific analysis
   */
  const getLogbookAnalysis = useCallback(async () => {
    if (!ocearoCoreEnabled) {
      setError(t('logbook.ocearoCoreNotEnabled'));
      return;
    }

    try {
      setAnalysisLoading(true);
      setAnalysisResult(null);
      setAnalysisType('logbook');
      setError(null);
      setActiveTab('analysis');
      
      // Call OcearoCore /logbook/analyze endpoint
      const analysis = await analyzeLogbookWithOcearoCore();
      
      // Store analysis results
      setAnalysisResult(analysis);
      console.log('Logbook Analysis:', analysis);
      
    } catch (err) {
      const errorMessage = handleOcearoCoreError(err, 'Logbook analysis');
      setError(errorMessage);
    } finally {
      setAnalysisLoading(false);
    }
  }, [ocearoCoreEnabled]);

  /**
   * Edit an existing entry
   */
  const editEntry = useCallback((entry) => {
    setSelectedEntry(entry);
    // Prefill the form with the entry's editable fields (otherwise the edit modal
    // opens blank and any save would lose the author/text).
    setEntryForm({
      text: entry.text || '',
      author: entry.author || 'manual'
    });
    setShowEntryModal(true);
  }, []);

  /**
   * Helper functions for data formatting
   */
  /**
   * Render a numeric entry field with its unit, or nothing when absent.
   *
   * The previous `!Number.isNaN(Number(x))` guards passed `null` through
   * (`Number(null) === 0`), which rendered literal "nullNM" / "nullkt" cells.
   */
  const fmt = (value, unit = '') => (
    Number.isFinite(value) ? `${value}${unit}` : ''
  );

  const getWeather = (entry) => {
    const weather = [];
    if (entry.wind) {
      const wind = [];
      if (Number.isFinite(entry.wind.speed)) {
        wind.push(`${entry.wind.speed}kt`);
      }
      if (Number.isFinite(entry.wind.direction)) {
        wind.push(`${entry.wind.direction}°`);
      }
      if (wind.length) {
        weather.push(`${entry.wind.apparent ? 'AWind' : 'Wind'} ${wind.join(' ')}`);
      }
    }
    if (entry.observations) {
      if (Number.isFinite(entry.observations.seaState)) {
        weather.push(`Sea state ${entry.observations.seaState}`);
      }
      if (Number.isFinite(entry.observations.cloudCoverage)) {
        weather.push(`Clouds ${entry.observations.cloudCoverage}/8`);
      }
      if (Number.isFinite(entry.observations.visibility)) {
        weather.push(`Visibility ${entry.observations.visibility + 1}`);
      }
    }
    return weather.join(', ');
  };

  const getCourse = (entry) => {
    if (Number.isFinite(entry.course)) {
      return `${entry.course}°`;
    }
    if (Number.isFinite(entry.heading)) {
      return `HDT ${entry.heading}°`;
    }
    return '';
  };

  // Load entries on component mount
  useEffect(() => {
    fetchLogbookEntriesData();
  }, [fetchLogbookEntriesData]);

  /**
   * Render logbook table view
   */
  const renderLogbookTable = () => (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black text-hud-main uppercase tracking-widest flex items-center">
          <FontAwesomeIcon icon={faBook} className="mr-2 text-oBlue text-xs" />
          {t('logbook.logbookEntries')}
        </h3>
        <div className="flex space-x-3">
          {ocearoCoreEnabled && (
            <button 
              className="bg-oGreen/10 text-oGreen hover:bg-oGreen/20 px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft border border-oGreen/20 disabled:opacity-50"
              onClick={addOcearoCoreEntry}
              disabled={aiEntryLoading || loading}
            >
              <FontAwesomeIcon icon={faRobot} className={`mr-2 ${aiEntryLoading ? 'animate-spin' : ''}`} />
              {aiEntryLoading ? t('logbook.aiEntryGenerating') : t('logbook.aiEntry')}
            </button>
          )}
          <button 
            className="bg-oBlue hover:bg-oBlue/80 text-hud-main px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft"
            onClick={showAddEntryModal}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {t('logbook.add')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-oRed/10 text-oRed p-3 rounded text-xs font-black uppercase mb-4 animate-soft-pulse border border-oRed/20">
          {error}
        </div>
      )}

      <div className="tesla-card flex-1 overflow-auto bg-hud-bg">
        <table className="w-full text-xs font-black uppercase tracking-tight">
          <thead className="sticky top-0 bg-hud-bg backdrop-blur-md z-10">
            <tr className="text-hud-secondary border-b border-hud">
              <th className="p-3 text-left">{t('logbook.time')}</th>
              <th className="p-3 text-left">{t('logbook.courseCol')}</th>
              <th className="p-3 text-left">{t('logbook.sog')}</th>
              <th className="p-3 text-left">{t('logbook.weatherCol')}</th>
              <th className="p-3 text-left">{t('logbook.baro')}</th>
              <th className="p-3 text-left">{t('logbook.depth')}</th>
              <th className="p-3 text-left">{t('logbook.position')}</th>
              <th className="p-3 text-left">{t('logbook.log')}</th>
              <th className="p-3 text-left">{t('logbook.eng')}</th>
              <th className="p-3 text-left">{t('logbook.by')}</th>
              <th className="p-3 text-left">{t('logbook.noteCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hud">
            {entries.map((entry, index) => (
              <tr 
                key={entry.datetime || index} 
                onClick={() => editEntry(entry)}
                className="tesla-hover cursor-pointer text-hud-main"
              >
                <td className="p-3 whitespace-nowrap opacity-60">
                  {entry.date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: displayTimeZone,
                  })}
                </td>
                <td className="p-3 gliding-value">{getCourse(entry)}</td>
                <td className="p-3 gliding-value">{fmt(entry.speed?.sog, 'kt')}</td>
                <td className="p-3 text-hud-secondary font-bold lowercase normal-case">{getWeather(entry)}</td>
                <td className="p-3 gliding-value opacity-60">{fmt(entry.barometer)}</td>
                <td className="p-3 gliding-value">{fmt(entry.depth, 'm')}</td>
                <td className="p-3 text-xs text-hud-muted font-mono tracking-tighter">{entry.point ? entry.point.toString() : 'n/a'}</td>
                <td className="p-3 gliding-value">{fmt(entry.log, 'NM')}</td>
                <td className="p-3 gliding-value">{fmt(entry.engine?.hours, 'h')}</td>
                <td className="p-3 text-oBlue opacity-80">{entry.author || 'auto'}</td>
                <td className="p-3 normal-case font-bold text-hud-secondary truncate max-w-xs">{entry.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /**
   * Render timeline view with cards
   */
  const ENTRY_TYPE_STYLES = {
    safety: { color: 'text-oRed', border: 'border-oRed/40', bg: 'bg-oRed/10' },
    alert: { color: 'text-oRed', border: 'border-oRed/40', bg: 'bg-oRed/10' },
    weather: { color: 'text-oYellow', border: 'border-oYellow/40', bg: 'bg-oYellow/10' },
    startup_analysis: { color: 'text-oGreen', border: 'border-oGreen/40', bg: 'bg-oGreen/10' },
    briefing: { color: 'text-oGreen', border: 'border-oGreen/40', bg: 'bg-oGreen/10' },
    racing: { color: 'text-oYellow', border: 'border-oYellow/40', bg: 'bg-oYellow/10' },
    maintenance: { color: 'text-oYellow', border: 'border-oYellow/40', bg: 'bg-oYellow/10' },
    hourly_entry: { color: 'text-oBlue', border: 'border-oBlue/40', bg: 'bg-oBlue/10' },
    navigation: { color: 'text-oBlue', border: 'border-oBlue/40', bg: 'bg-oBlue/10' },
    default: { color: 'text-hud-secondary', border: 'border-hud', bg: 'bg-hud-elevated' },
  };

  /**
   * Build the list of stat chips actually available on an entry — the old
   * fixed 4-column grid rendered N/A for every missing field.
   */
  const getEntryStats = (entry) => {
    const stats = [];
    const course = getCourse(entry);
    if (course) stats.push({ label: t('logbook.courseCol'), value: course });
    if (Number.isFinite(entry.speed?.sog)) {
      stats.push({ label: t('logbook.speed'), value: `${entry.speed.sog}kt` });
    }
    if (Number.isFinite(entry.wind?.speed)) {
      const dir = Number.isFinite(entry.wind.direction) ? ` ${entry.wind.direction}°` : '';
      stats.push({ label: t('logbook.weatherCol'), value: `${entry.wind.speed}kt${dir}` });
    }
    if (Number.isFinite(entry.barometer)) {
      stats.push({ label: t('logbook.baro'), value: `${entry.barometer}` });
    }
    if (Number.isFinite(entry.depth)) {
      stats.push({ label: t('logbook.depth'), value: `${entry.depth}m` });
    }
    if (Number.isFinite(entry.log)) {
      stats.push({ label: t('logbook.log'), value: `${entry.log}NM` });
    }
    if (Number.isFinite(entry.engine?.hours)) {
      stats.push({ label: t('logbook.eng'), value: `${entry.engine.hours}h` });
    }
    if (entry.point && typeof entry.point.latitude === 'number') {
      stats.push({ label: t('logbook.coord'), value: entry.point.toString(), mono: true });
    }
    return stats;
  };

  const renderTimeline = () => {
    const timelineEntries = [...entries].reverse();

    // Group by calendar day for a readable cruise chronology
    const groups = [];
    for (const entry of timelineEntries) {
      const dayKey = entry.date.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: displayTimeZone,
      });
      const last = groups[groups.length - 1];
      if (last && last.day === dayKey) {
        last.items.push(entry);
      } else {
        groups.push({ day: dayKey, items: [entry] });
      }
    }
    // Most recent day first, but keep each day's entries in chronological order
    groups.reverse();

    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-hud-main uppercase tracking-widest flex items-center">
            <FontAwesomeIcon icon={faTimeline} className="mr-2 text-oGreen text-xs" />
            {t('logbook.cruiseTimeline')}
          </h3>
          <div className="flex space-x-3">
            {ocearoCoreEnabled && (
              <button 
                className="bg-oGreen/10 text-oGreen hover:bg-oGreen/20 px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft border border-oGreen/20 disabled:opacity-50"
                onClick={addOcearoCoreEntry}
                disabled={aiEntryLoading || loading}
              >
                <FontAwesomeIcon icon={faRobot} className={`mr-2 ${aiEntryLoading ? 'animate-spin' : ''}`} />
                {aiEntryLoading ? t('logbook.aiEntryGenerating') : t('logbook.aiAuto')}
              </button>
            )}
            <button 
              className="bg-oBlue hover:bg-oBlue/80 text-hud-main px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft"
              onClick={showAddEntryModal}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('logbook.add')}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-oRed/10 text-oRed p-3 rounded text-xs font-black uppercase mb-4 animate-soft-pulse border border-oRed/20">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.day}>
              {/* Day header */}
              <div className="flex items-center mb-3">
                <div className="w-2 h-2 rounded-full bg-oBlue mr-3" />
                <span className="text-xs font-black text-hud-main uppercase tracking-widest">{group.day}</span>
                <div className="flex-1 h-px bg-hud-border ml-4 opacity-40" />
                <span className="text-xs font-black text-hud-muted ml-3">{group.items.length}</span>
              </div>

              <div className="space-y-2 ml-1 pl-4 border-l border-hud">
                {group.items.map((entry, index) => {
                  const type = entry.entryType || entry.analysis?.type || 'default';
                  const style = ENTRY_TYPE_STYLES[type] || ENTRY_TYPE_STYLES.default;
                  const stats = getEntryStats(entry);
                  return (
                    <div
                      key={entry.datetime || index}
                      onClick={() => editEntry(entry)}
                      className="tesla-card tesla-hover cursor-pointer group"
                    >
                      <div className="px-4 py-2 flex justify-between items-center border-b border-hud">
                        <div className="flex items-center min-w-0 gap-3">
                          <span className="text-sm font-black text-hud-main tracking-tight">
                            {entry.date.toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit',
                              timeZone: displayTimeZone,
                            })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-sm text-xs font-black uppercase tracking-widest border ${style.color} ${style.border} ${style.bg}`}>
                            {t(`logbook.types.${type}`, { defaultValue: type.replace(/_/g, ' ') })}
                          </span>
                        </div>
                        <div className="text-xs font-black text-hud-muted uppercase tracking-tighter truncate ml-3">
                          {entry.author || 'system'}
                        </div>
                      </div>
                      <div className="p-4">
                        {entry.text && (
                          <div className="text-xs font-bold text-hud-secondary normal-case leading-relaxed mb-3">
                            {entry.text}
                          </div>
                        )}

                        {stats.length > 0 && (
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-black uppercase tracking-tight text-hud-secondary">
                            {stats.map((stat) => (
                              <div key={stat.label} className="flex items-baseline gap-2">
                                <span className="text-hud-dim">{stat.label}</span>
                                <span className={`text-hud-main ${stat.mono ? 'font-mono text-xs' : 'gliding-value'}`}>{stat.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render analysis view
   */
  const renderAnalysis = () => (
    <div className="p-4 space-y-6">
      <div className="mb-6">
        <h3 className="text-xs font-black text-hud-main uppercase tracking-widest flex items-center mb-2">
          <FontAwesomeIcon icon={faChartLine} className="mr-2 text-oBlue text-xs" />
          {t('logbook.fleetIntelligence')}
        </h3>
        <p className="text-hud-secondary text-xs font-black uppercase tracking-tighter">{t('logbook.aiPoweredAnalysis')}</p>
      </div>

      {ocearoCoreEnabled && (
        <div className="tesla-card p-4 mb-6 bg-hud-bg">
          <h4 className="text-xs font-black text-hud-secondary mb-4 uppercase tracking-widest">{t('logbook.selectOperation')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'logbook', label: 'LOGBOOK', icon: faBook, color: 'bg-oBlue', action: getLogbookAnalysis },
              { id: 'weather', label: 'WEATHER', icon: faCloudSun, color: 'bg-oBlue', action: () => getOcearoCoreAnalysis('weather') },
              { id: 'sail', label: 'SAIL', icon: faCompass, color: 'bg-oGreen', action: () => getOcearoCoreAnalysis('sail') },
              { id: 'alerts', label: 'ALERTS', icon: faRobot, color: 'bg-oRed', action: () => getOcearoCoreAnalysis('alerts') },
              { id: 'status', label: 'STATUS', icon: faTachometerAlt, color: 'bg-hud-muted', action: () => getOcearoCoreAnalysis('status') },
              { id: 'racing', label: t('logbook.racingAdvice'), icon: faTrophy, color: racingMode ? 'bg-oYellow' : 'bg-oYellow/40', action: () => getOcearoCoreAnalysis('racing') }
            ].map((opt) => (
              <button
                key={opt.id}
                className="tesla-card tesla-hover p-4 flex flex-col items-center justify-center space-y-3 shadow-soft group border border-hud"
                onClick={opt.action}
                disabled={analysisLoading}
              >
                <div className={`${opt.color} w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <FontAwesomeIcon icon={opt.icon} className="text-hud-main text-sm" />
                </div>
                <span className="text-xs font-black text-hud-main tracking-widest">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-oRed/10 text-oRed p-3 rounded text-xs font-black uppercase mb-4 animate-soft-pulse border border-oRed/20">
          {error}
        </div>
      )}

      {/* Loading indicator with progress bar */}
      {analysisLoading && (
        <div className="tesla-card p-10 text-center bg-hud-bg">
          <FontAwesomeIcon icon={faRobot} className="text-4xl text-oGreen mb-6 animate-soft-pulse" />
          <h4 className="text-xs font-black text-hud-main uppercase tracking-widest mb-4">{t('logbook.neuralProcessing')}</h4>
          <div className="w-48 mx-auto bg-hud-elevated h-1 rounded-full overflow-hidden">
            <div className="bg-oGreen h-full animate-progress-indefinite rounded-full" style={{ width: '40%' }}></div>
          </div>
          <p className="text-hud-muted text-xs font-black uppercase mt-4 tracking-tighter italic">{t('logbook.processNode')} {analysisType}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !analysisLoading && (() => {
        // analysis field may be an object {speech, text, recommendations, expertAdvice, summary} (weather)
        // or a string (other types), or absent (sail: {course, settings, timestamp})
        const analysisObj = analysisResult.analysis && typeof analysisResult.analysis === 'object'
          ? analysisResult.analysis : null;
        const analysisStr = typeof analysisResult.analysis === 'string' ? analysisResult.analysis : null;

        const isSailResult = analysisResult.settings !== undefined && !analysisResult.analysis;

        const mainText = analysisStr
          || analysisObj?.text
          || analysisObj?.summary
          || analysisResult.aiAnalysis
          || (typeof analysisResult.summary === 'string' ? analysisResult.summary : null)
          || (isSailResult ? (analysisResult.settings?.analysis?.speech || analysisResult.course?.analysis?.speech || null) : null);

        const speechText = analysisResult.speechText
          || (typeof analysisResult.speech === 'string' ? analysisResult.speech : null)
          || analysisObj?.speech
          || (isSailResult ? (analysisResult.settings?.analysis?.speech || analysisResult.course?.analysis?.speech) : null);

        const rawRecs = analysisResult.recommendations || analysisObj?.recommendations
          || (isSailResult && analysisResult.settings?.adjustments?.length > 0
            ? analysisResult.settings.adjustments.map(adj => adj.action || adj.message || JSON.stringify(adj))
            : null);
        const recommendations = Array.isArray(rawRecs) ? rawRecs : null;

        const rawInsights = analysisResult.insights || analysisObj?.expertAdvice;
        const insights = Array.isArray(rawInsights) ? rawInsights : null;

        const technicalData = analysisResult.data || analysisResult.weatherData || analysisResult.assessment ||
          (isSailResult ? { course: analysisResult.course, settings: analysisResult.settings } : null);

        return (
          <div className="tesla-card p-6 shadow-xl animate-fade-in">
            <div className="flex items-center mb-6 border-b border-hud pb-4">
              <FontAwesomeIcon icon={faChartLine} className="text-oGreen mr-3 text-sm" />
              <h4 className="text-xs font-black text-hud-main uppercase tracking-widest">{t('logbook.operationReport')} {analysisType}</h4>
            </div>
            
            <div className="space-y-6">
              {/* Display main analysis text */}
              {mainText && (
                <div className="tesla-card bg-hud-bg p-4 border-l-2 border-oBlue/30 shadow-subtle">
                  <h5 className="text-xs font-black text-oBlue mb-3 uppercase tracking-widest">{t('logbook.executiveSummary')}</h5>
                  <p className="text-hud-secondary text-xs font-bold leading-relaxed italic normal-case">
                    {mainText}
                  </p>
                </div>
              )}

              {/* Insights & Recommendations */}
              {(insights || recommendations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights && (
                    <div className="tesla-card bg-hud-bg p-4 shadow-subtle">
                      <h5 className="text-xs font-black text-oBlue mb-3 uppercase tracking-widest flex items-center">
                        <FontAwesomeIcon icon={faRobot} className="mr-2 text-xs" />
                        {t('logbook.strategicInsights')}
                      </h5>
                      <ul className="space-y-2">
                        {insights.map((item, i) => {
                          // Ensure item is a string for display
                          const displayText = typeof item === 'string' ? item
                            : (item && typeof item === 'object')
                              ? (item.text || item.message || item.insight || JSON.stringify(item))
                              : String(item);
                          return (
                            <li key={i} className="text-xs font-bold text-hud-secondary normal-case flex items-start">
                              <span className="text-oBlue mr-2 opacity-50">›</span>
                              {displayText}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {recommendations && (
                    <div className="tesla-card bg-hud-bg p-4 shadow-subtle">
                      <h5 className="text-xs font-black text-oGreen mb-3 uppercase tracking-widest flex items-center">
                        <FontAwesomeIcon icon={faChartLine} className="mr-2 text-xs" />
                        {t('logbook.operationalAdvice')}
                      </h5>
                      <ul className="space-y-2">
                        {recommendations.map((item, i) => {
                          // Handle various recommendation formats
                          let displayText;
                          if (typeof item === 'string') {
                            displayText = item;
                          } else if (item && typeof item === 'object') {
                            // item.message might be an object (e.g., alert with type/priority)
                            if (typeof item.message === 'string') {
                              displayText = item.message;
                            } else if (item.message && typeof item.message === 'object') {
                              // Extract text from alert object
                              displayText = item.message.message || item.text || item.action || JSON.stringify(item.message);
                            } else {
                              displayText = item.text || item.action || JSON.stringify(item);
                            }
                          } else {
                            displayText = String(item);
                          }
                          return (
                            <li key={i} className="text-xs font-bold text-hud-secondary normal-case flex items-start">
                              <span className="text-oGreen mr-2 opacity-50">✓</span>
                              {displayText}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Display speech text if available */}
              {speechText && (
                <div className="bg-oBlue/5 p-4 rounded-sm border border-oBlue/10 shadow-soft">
                  <h5 className="text-xs font-black text-oBlue mb-2 uppercase tracking-widest flex items-center">
                    <FontAwesomeIcon icon={faRobot} className="mr-2 animate-soft-pulse" />
                    {t('logbook.voiceTelemetry')}
                  </h5>
                  <p className="text-hud-secondary text-xs font-bold leading-relaxed italic normal-case">{speechText}</p>
                </div>
              )}

              {/* Display technical data */}
              {technicalData && (
                <div className="tesla-card bg-hud-bg p-4 border border-hud">
                  <h5 className="text-xs font-black text-hud-secondary mb-3 uppercase tracking-widest">{t('logbook.rawTelemetryData')}</h5>
                  <pre className="text-oGreen/70 text-xs font-mono overflow-auto max-h-40 font-bold scrollbar-thin">
                    {JSON.stringify(technicalData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Timestamp */}
              {analysisResult.timestamp && (
                <div className="text-hud-dim text-xs font-black text-right uppercase tracking-tighter">
                  {t('logbook.generated')} {new Date(analysisResult.timestamp).toLocaleString()} {'// OCEAROCORE V2.4'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Placeholder */}
      {!analysisResult && !analysisLoading && (
        <div className="tesla-card p-12 text-center bg-hud-bg shadow-inner border border-hud">
          <div className="text-hud-muted">
            <FontAwesomeIcon icon={faRobot} size="3x" className="mb-6 opacity-20" />
            <h4 className="text-xs font-black text-hud-main uppercase tracking-widest mb-3">{t('logbook.diagnosticReady')}</h4>
            <p className="text-xs font-black uppercase tracking-tight max-w-xs mx-auto leading-relaxed">
              {t('logbook.diagnosticReadyDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render entry modal
   */
  const renderEntryModal = () => (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => setShowEntryModal(false)}
    >
      <div 
        className="bg-hud-bg backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl border border-hud max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-hud-main flex items-center tracking-tight">
            <FontAwesomeIcon icon={faBook} className="mr-3 text-oBlue" />
            {selectedEntry ? t('logbook.editEntry') : t('logbook.manualEntry')}
          </h3>
          <button
            onClick={() => setShowEntryModal(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-hud-secondary hover:text-hud-main hover:bg-hud-elevated transition-all duration-300"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-hud-secondary mb-2 flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-oBlue" />
              {t('logbook.author')}
            </label>
            <input
              type="text"
              value={entryForm.author}
              onChange={(e) => setEntryForm({ ...entryForm, author: e.target.value })}
              className="w-full bg-hud-elevated text-hud-main px-4 py-3 rounded-xl border border-hud focus:border-oBlue focus:outline-none transition-all duration-300 font-bold"
              placeholder={t('logbook.authorPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-hud-secondary mb-2 flex items-center">
              <FontAwesomeIcon icon={faStickyNote} className="mr-2 text-oYellow" />
              {t('logbook.note')}
            </label>
            <textarea
              value={entryForm.text}
              onChange={(e) => setEntryForm({ ...entryForm, text: e.target.value })}
              className="w-full bg-hud-elevated text-hud-main px-4 py-3 rounded-xl border border-hud focus:border-oBlue focus:outline-none transition-all duration-300 font-bold min-h-[120px]"
              placeholder={t('logbook.notePlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-hud">
            <button
              onClick={() => setShowEntryModal(false)}
              className="px-6 py-3 bg-hud-elevated hover:bg-hud-bg text-hud-main font-bold rounded-xl transition-all duration-300"
            >
              {t('logbook.cancel')}
            </button>
            <button
              onClick={addEntry}
              className="px-8 py-3 bg-oBlue hover:bg-oBlue/80 text-hud-main font-bold rounded-xl transition-all duration-300 flex items-center shadow-lg shadow-oBlue/20"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('logbook.saveEntry')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
      {/* Racing Mode Toggle Banner */}
      {ocearoCoreEnabled && (
        <div className={`flex items-center justify-between px-4 py-2 border-b transition-all duration-500 ${
          racingMode
            ? 'bg-oYellow/10 border-oYellow/30'
            : 'bg-hud-bg border-hud'
        }`}>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon
              icon={faTrophy}
              className={`text-xs transition-colors duration-300 ${
                racingMode ? 'text-oYellow animate-soft-pulse' : 'text-hud-muted'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-widest text-hud-main">
              {racingMode ? t('logbook.racingModeActive') : t('logbook.racingMode')}
            </span>
            {racingMode && (
              <span className="text-xs font-black uppercase tracking-widest text-oYellow opacity-70">
                — {t('logbook.racingModeAISInfo')}
              </span>
            )}
          </div>
          <button
            onClick={() => toggleState('racing')}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 focus:outline-none ${
              racingMode ? 'bg-oYellow' : 'bg-hud-elevated border border-hud'
            }`}
            aria-label={t('logbook.racingMode')}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-hud-main shadow transition-transform duration-300 ${
                racingMode ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {/* Tab Navigation - Tesla style */}
      <div className="flex border-b border-hud bg-hud-bg">
        {[
          { id: 'timeline', label: t('logbook.missionTimeline'), icon: faTimeline },
          { id: 'logbook', label: t('logbook.tacticalLog'), icon: faBook },
          { id: 'analysis', label: t('logbook.fleetIntelligence'), icon: faChartLine }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 text-xs font-black uppercase flex items-center justify-center transition-all duration-500 ${
              activeTab === tab.id
                ? 'text-oGreen border-b-2 border-oGreen bg-hud-bg'
                : 'text-hud-secondary hover:text-hud-main tesla-hover'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full overflow-auto scrollbar-hide"
          >
            {activeTab === 'logbook' && renderLogbookTable()}
            {activeTab === 'timeline' && renderTimeline()}
            {activeTab === 'analysis' && renderAnalysis()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showEntryModal && renderEntryModal()}
    </div>
  );
};

export default LogbookView;
