import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook, faTimeline, faChartLine, faRobot, faPlus, faEdit, faTrash,
  faClock, faCompass, faTachometerAlt, faCloudSun, faThermometerHalf,
  faMapMarkerAlt, faLocationDot, faRuler, faCar, faUser, faStickyNote,
  faTimes, faSave
} from '@fortawesome/free-solid-svg-icons';
import configService from '../settings/ConfigService';
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
  const { nightMode } = useOcearoContext();
  const [activeTab, setActiveTab] = useState('logbook');
  
  // Define paths for capturing vessel state during entry creation
  const logbookPaths = useMemo(() => [
    'navigation.position',
    'navigation.courseOverGroundTrue',
    'navigation.headingTrue',
    'navigation.speedOverGround',
    'environment.wind.speedTrue',
    'environment.wind.angleTrueWater',
    'environment.outside.pressure',
    'environment.outside.temperature',
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
        console.error('Error fetching logbook entries:', err);
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
      const position = skValues['navigation.position'] || {};
      const newEntry = {
        datetime: new Date().toISOString(),
        position: {
          latitude: position.latitude || 46.1591,
          longitude: position.longitude || -1.1522,
          source: 'GPS'
        },
        course: skValues['navigation.courseOverGroundTrue'] || skValues['navigation.headingTrue'],
        speed: {
          sog: skValues['navigation.speedOverGround'] || 0
        },
        wind: {
          speed: skValues['environment.wind.speedTrue'] || 0,
          direction: skValues['environment.wind.angleTrueWater'] || 0
        },
        barometer: skValues['environment.outside.pressure'] ? skValues['environment.outside.pressure'] / 100 : 1013,
        log: skValues['navigation.log'] || 0,
        engine: {
          hours: skValues['propulsion.main.runTime'] ? skValues['propulsion.main.runTime'] / 3600 : 0
        },
        author: entryForm.author || 'manual',
        text: entryForm.text || 'Manual entry'
      };

      // Use OcearoCore proxy to add the entry
      await addLogbookEntry(newEntry);
      
      // Close modal and refresh entries
      setShowEntryModal(false);
      fetchLogbookEntriesData();
    } catch (err) {
      console.error('Error adding entry:', err);
      const errorMessage = handleOcearoCoreError(err, 'Add logbook entry');
      setError(errorMessage);
    }
  }, [skValues, fetchLogbookEntriesData, entryForm]);

  /**
   * Add entry using OcearoCore AI
   */
  const addOcearoCoreEntry = useCallback(async () => {
    if (!ocearoCoreEnabled) {
      setError(t('logbook.ocearoCoreNotEnabled'));
      return;
    }

    try {
      setLoading(true);
      
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
      await generateOcearoCoreLogbookEntry(currentData);
      
      // Refresh entries after successful generation
      fetchLogbookEntriesData();
      
    } catch (err) {
      const errorMessage = handleOcearoCoreError(err, 'OcearoCore entry generation');
      setError(errorMessage);
    } finally {
      setLoading(false);
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
    setShowEntryModal(true);
  }, []);

  /**
   * Helper functions for data formatting
   */
  const getWeather = (entry) => {
    const weather = [];
    if (entry.wind) {
      const wind = [];
      if (!Number.isNaN(Number(entry.wind.speed))) {
        wind.push(`${entry.wind.speed}kt`);
      }
      if (!Number.isNaN(Number(entry.wind.direction))) {
        wind.push(`${entry.wind.direction}°`);
      }
      if (wind.length) {
        weather.push(`Wind ${wind.join(' ')}`);
      }
    }
    if (entry.observations) {
      if (!Number.isNaN(Number(entry.observations.seaState))) {
        weather.push(`Sea state ${entry.observations.seaState}`);
      }
      if (!Number.isNaN(Number(entry.observations.cloudCoverage))) {
        weather.push(`Clouds ${entry.observations.cloudCoverage}/8`);
      }
      if (!Number.isNaN(Number(entry.observations.visibility))) {
        weather.push(`Visibility ${entry.observations.visibility + 1}`);
      }
    }
    return weather.join(', ');
  };

  const getCourse = (entry) => {
    if (!Number.isNaN(Number(entry.course))) {
      return `${entry.course}°`;
    }
    if (!Number.isNaN(Number(entry.heading))) {
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
              className="bg-oGreen/10 text-oGreen hover:bg-oGreen/20 px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft border border-oGreen/20"
              onClick={addOcearoCoreEntry}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faRobot} className="mr-2" />
              {t('logbook.aiEntry')}
            </button>
          )}
          <button 
            className="bg-oBlue hover:bg-blue-600 text-hud-main px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft"
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
                <td className="p-3 gliding-value">{entry.speed && !Number.isNaN(Number(entry.speed.sog)) ? `${entry.speed.sog}kt` : ''}</td>
                <td className="p-3 text-hud-secondary font-bold lowercase normal-case">{getWeather(entry)}</td>
                <td className="p-3 gliding-value opacity-60">{entry.barometer}</td>
                <td className="p-3 text-xs text-hud-muted font-mono tracking-tighter">{entry.point ? entry.point.toString() : 'n/a'}</td>
                <td className="p-3 gliding-value">{!Number.isNaN(Number(entry.log)) ? `${entry.log}NM` : ''}</td>
                <td className="p-3 gliding-value">{entry.engine && !Number.isNaN(Number(entry.engine.hours)) ? `${entry.engine.hours}h` : ''}</td>
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
  const renderTimeline = () => {
    const timelineEntries = [...entries].reverse();
    
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
                className="bg-oGreen/10 text-oGreen hover:bg-oGreen/20 px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft border border-oGreen/20"
                onClick={addOcearoCoreEntry}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faRobot} className="mr-2" />
                {t('logbook.aiAuto')}
              </button>
            )}
            <button 
              className="bg-oBlue hover:bg-blue-600 text-hud-main px-3 py-1.5 rounded text-xs font-black uppercase transition-all duration-300 flex items-center shadow-soft"
              onClick={addEntry}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('logbook.manual')}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-oRed/10 text-oRed p-3 rounded text-xs font-black uppercase mb-4 animate-soft-pulse border border-oRed/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {timelineEntries.map((entry, index) => (
            <div 
              key={entry.datetime || index} 
              onClick={() => editEntry(entry)}
              className="tesla-card tesla-hover cursor-pointer group"
            >
              <div className="bg-hud-elevated px-4 py-2 flex justify-between items-center border-b border-hud">
                <div className="text-xs font-black text-oBlue uppercase tracking-widest group-hover:text-oBlue transition-colors">
                  {entry.author || 'system'}
                </div>
                <div className="text-xs font-black text-hud-secondary uppercase tracking-tighter">
                  {entry.date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: displayTimeZone,
                  })}
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-black uppercase mb-4 tracking-tight text-hud-secondary">
                  <div className="flex flex-col">
                    <span className="text-xs text-hud-dim mb-1">{t('logbook.courseCol')}</span>
                    <span className="text-hud-main gliding-value">{getCourse(entry)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-hud-dim mb-1">{t('logbook.speed')}</span>
                    <span className="text-hud-main gliding-value">{entry.speed && !Number.isNaN(Number(entry.speed.sog)) ? `${entry.speed.sog}kt` : 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-hud-dim mb-1">{t('logbook.log')}</span>
                    <span className="text-hud-main gliding-value">{!Number.isNaN(Number(entry.log)) ? `${entry.log}NM` : 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-hud-dim mb-1">{t('logbook.coord')}</span>
                    <span className="text-hud-main text-xs font-mono truncate">{entry.point ? entry.point.toString() : 'N/A'}</span>
                  </div>
                </div>
                
                {entry.text && (
                  <div className="p-3 bg-hud-elevated rounded-sm border-l-2 border-oBlue/30 text-xs font-bold text-hud-secondary normal-case leading-relaxed italic">
                    {entry.text}
                  </div>
                )}
                
                {getWeather(entry) && (
                  <div className="mt-3 flex items-center text-xs font-black text-hud-secondary uppercase tracking-widest">
                    <FontAwesomeIcon icon={faCloudSun} className="mr-2 text-oYellow opacity-50" />
                    {getWeather(entry)}
                  </div>
                )}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: 'logbook', label: 'LOGBOOK', icon: faBook, color: 'bg-purple-600', action: getLogbookAnalysis },
              { id: 'weather', label: 'WEATHER', icon: faCloudSun, color: 'bg-blue-600', action: () => getOcearoCoreAnalysis('weather') },
              { id: 'sail', label: 'SAIL', icon: faCompass, color: 'bg-oGreen', action: () => getOcearoCoreAnalysis('sail') },
              { id: 'alerts', label: 'ALERTS', icon: faRobot, color: 'bg-oRed', action: () => getOcearoCoreAnalysis('alerts') },
              { id: 'status', label: 'STATUS', icon: faTachometerAlt, color: 'bg-oYellow', action: () => getOcearoCoreAnalysis('status') }
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
      {analysisResult && !analysisLoading && (
        <div className="tesla-card p-6 shadow-xl animate-fade-in">
          <div className="flex items-center mb-6 border-b border-hud pb-4">
            <FontAwesomeIcon icon={faChartLine} className="text-oGreen mr-3 text-sm" />
            <h4 className="text-xs font-black text-hud-main uppercase tracking-widest">{t('logbook.operationReport')} {analysisType}</h4>
          </div>
          
          <div className="space-y-6">
            {/* Display main analysis text */}
            {(analysisResult.analysis || analysisResult.aiAnalysis || (typeof analysisResult.summary === 'string' ? analysisResult.summary : null)) && (
              <div className="tesla-card bg-hud-bg p-4 border-l-2 border-oBlue/30 shadow-subtle">
                <h5 className="text-xs font-black text-oBlue mb-3 uppercase tracking-widest">{t('logbook.executiveSummary')}</h5>
                <p className="text-hud-secondary text-xs font-bold leading-relaxed italic normal-case">
                  {analysisResult.analysis || analysisResult.aiAnalysis || analysisResult.summary}
                </p>
              </div>
            )}

            {/* Insights & Recommendations */}
            {(analysisResult.insights || analysisResult.recommendations) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.insights && (
                  <div className="tesla-card bg-hud-bg p-4 shadow-subtle">
                    <h5 className="text-xs font-black text-cyan-400 mb-3 uppercase tracking-widest flex items-center">
                      <FontAwesomeIcon icon={faRobot} className="mr-2 text-xs" />
                      {t('logbook.strategicInsights')}
                    </h5>
                    <ul className="space-y-2">
                      {analysisResult.insights.map((item, i) => (
                        <li key={i} className="text-xs font-bold text-hud-secondary normal-case flex items-start">
                          <span className="text-oBlue mr-2 opacity-50">›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.recommendations && (
                  <div className="tesla-card bg-hud-bg p-4 shadow-subtle">
                    <h5 className="text-xs font-black text-oGreen mb-3 uppercase tracking-widest flex items-center">
                      <FontAwesomeIcon icon={faChartLine} className="mr-2 text-xs" />
                      {t('logbook.operationalAdvice')}
                    </h5>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((item, i) => (
                        <li key={i} className="text-xs font-bold text-hud-secondary normal-case flex items-start">
                          <span className="text-oGreen mr-2 opacity-50">✓</span>
                          {typeof item === 'string' ? item : item.message || JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Display speech text if available */}
            {(analysisResult.speechText || analysisResult.speech) && (
              <div className="bg-oBlue/5 p-4 rounded-sm border border-oBlue/10 shadow-soft">
                <h5 className="text-xs font-black text-oBlue mb-2 uppercase tracking-widest flex items-center">
                  <FontAwesomeIcon icon={faRobot} className="mr-2 animate-soft-pulse" />
                  {t('logbook.voiceTelemetry')}
                </h5>
                <p className="text-hud-secondary text-xs font-bold leading-relaxed italic normal-case">{analysisResult.speechText || analysisResult.speech}</p>
              </div>
            )}

            {/* Display technical data */}
            {(analysisResult.data || analysisResult.weatherData || analysisResult.assessment) && (
              <div className="tesla-card bg-hud-bg p-4 border border-hud">
                <h5 className="text-xs font-black text-hud-secondary mb-3 uppercase tracking-widest">{t('logbook.rawTelemetryData')}</h5>
                <pre className="text-oGreen/70 text-xs font-mono overflow-auto max-h-40 font-bold scrollbar-thin">
                  {JSON.stringify(analysisResult.data || analysisResult.assessment || analysisResult.weatherData, null, 2)}
                </pre>
              </div>
            )}

            {/* Timestamp */}
            {analysisResult.timestamp && (
              <div className="text-hud-dim text-xs font-black text-right uppercase tracking-tighter">
                {t('logbook.generated')} {new Date(analysisResult.timestamp).toLocaleString()} // OCEAROCORE V2.4
              </div>
            )}
          </div>
        </div>
      )}

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
      className="fixed inset-0 bg-hud-bg/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => setShowEntryModal(false)}
    >
      <div 
        className="bg-hud-bg backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-hud"
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
              className="px-8 py-3 bg-oBlue hover:bg-blue-600 text-hud-main font-bold rounded-xl transition-all duration-300 flex items-center shadow-lg shadow-oBlue/20"
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
