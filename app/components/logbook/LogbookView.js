import React, { useState, useEffect, useCallback } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook, faTimeline, faChartLine, faRobot, faPlus, faEdit, faTrash,
  faClock, faCompass, faTachometerAlt, faCloudSun, faThermometerHalf,
  faMapMarkerAlt, faLocationDot, faRuler, faCar, faUser, faStickyNote
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

/**
 * LogbookView component with three tabs: Timeline, Logbook, and Analysis
 * Integrates with SignalK logbook API and includes OcearoCore functionality
 */
const LogbookView = () => {
  const { getSignalKValue } = useOcearoContext();
  const [activeTab, setActiveTab] = useState('logbook');
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
      console.error('Error fetching logbook entries:', err);
      const errorMessage = handleOcearoCoreError(err, 'Logbook fetch');
      setError(errorMessage);
      
      // Fallback to sample data for development
      setEntries(getSampleEntries());
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
      const newEntry = {
        datetime: new Date().toISOString(),
        position: {
          latitude: getSignalKValue('navigation.position.latitude') || 46.1591,
          longitude: getSignalKValue('navigation.position.longitude') || -1.1522,
          source: 'GPS'
        },
        course: getSignalKValue('navigation.courseOverGroundTrue') || getSignalKValue('navigation.headingTrue'),
        speed: {
          sog: getSignalKValue('navigation.speedOverGround') || 0
        },
        wind: {
          speed: getSignalKValue('environment.wind.speedTrue') || 0,
          direction: getSignalKValue('environment.wind.angleTrueWater') || 0
        },
        barometer: getSignalKValue('environment.outside.pressure') || 1013,
        log: getSignalKValue('navigation.log') || 0,
        engine: {
          hours: getSignalKValue('propulsion.main.runTime') || 0
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
  }, [getSignalKValue, fetchLogbookEntriesData, entryForm]);

  /**
   * Add entry using OcearoCore AI
   */
  const addOcearoCoreEntry = useCallback(async () => {
    if (!ocearoCoreEnabled) {
      setError('OcearoCore is not enabled');
      return;
    }

    try {
      setLoading(true);
      
      // Collect current boat data for OcearoCore analysis
      const currentData = collectCurrentVesselData(getSignalKValue);

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
  }, [ocearoCoreEnabled, getSignalKValue, fetchLogbookEntriesData]);

  /**
   * Get OcearoCore analysis of logbook data
   */
  const getOcearoCoreAnalysis = useCallback(async (type) => {
    if (!ocearoCoreEnabled) {
      setError('OcearoCore is not enabled');
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
      setError('OcearoCore is not enabled');
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Logbook Entries</h3>
        <div className="flex space-x-2">
          {ocearoCoreEnabled && (
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              onClick={addOcearoCoreEntry}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faRobot} className="mr-2" />
              OcearoCore Entry
            </button>
          )}
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            onClick={showAddEntryModal}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-oGray2 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-oGray">
            <tr>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faClock} className="mr-2" />Time</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faCompass} className="mr-2" />Course</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />Speed</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faCloudSun} className="mr-2" />Weather</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faThermometerHalf} className="mr-2" />Baro</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />Coordinates</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faLocationDot} className="mr-2" />Fix</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faRuler} className="mr-2" />Log</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faCar} className="mr-2" />Engine</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faUser} className="mr-2" />By</th>
              <th className="text-white p-3 text-left"><FontAwesomeIcon icon={faStickyNote} className="mr-2" />Remarks</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr 
                key={entry.datetime || index} 
                onClick={() => editEntry(entry)}
                className="cursor-pointer hover:bg-oGray text-white border-b border-gray-700"
              >
                <td className="p-3">{entry.date.toLocaleString('en-GB', {
                  timeZone: displayTimeZone,
                })}</td>
                <td className="p-3">{getCourse(entry)}</td>
                <td className="p-3">{entry.speed && !Number.isNaN(Number(entry.speed.sog)) ? `${entry.speed.sog}kt` : ''}</td>
                <td className="p-3">{getWeather(entry)}</td>
                <td className="p-3">{entry.barometer}</td>
                <td className="p-3">{entry.point ? entry.point.toString() : 'n/a'}</td>
                <td className="p-3">{entry.position ? entry.position.source || 'GPS' : ''}</td>
                <td className="p-3">{!Number.isNaN(Number(entry.log)) ? `${entry.log}NM` : ''}</td>
                <td className="p-3">{entry.engine && !Number.isNaN(Number(entry.engine.hours)) ? `${entry.engine.hours}h` : ''}</td>
                <td className="p-3">{entry.author || 'auto'}</td>
                <td className="p-3">{entry.text}</td>
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
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Timeline View</h3>
          <div className="flex space-x-2">
            {ocearoCoreEnabled && (
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                onClick={addOcearoCoreEntry}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faRobot} className="mr-2" />
                OcearoCore Entry
              </button>
            )}
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              onClick={addEntry}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Entry
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {timelineEntries.map((entry, index) => (
            <div 
              key={entry.datetime || index} 
              onClick={() => editEntry(entry)}
              className="bg-oGray2 border border-gray-700 cursor-pointer hover:bg-oGray transition-colors rounded-lg overflow-hidden"
            >
              <div className="bg-oGray border-b border-gray-600 p-4">
                <div className="flex justify-between items-center">
                  <div className="text-white font-medium">
                    {entry.author || 'auto'}
                  </div>
                  <div className="text-white text-sm">
                    {entry.date.toLocaleString('en-GB', {
                      timeZone: displayTimeZone,
                    })}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-white">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <strong>Course:</strong> {getCourse(entry)}
                    </div>
                    <div>
                      <strong>Speed:</strong> {entry.speed && !Number.isNaN(Number(entry.speed.sog)) ? `${entry.speed.sog}kt` : 'N/A'}
                    </div>
                    <div>
                      <strong>Position:</strong> {entry.point ? entry.point.toString() : 'N/A'}
                    </div>
                    <div>
                      <strong>Log:</strong> {!Number.isNaN(Number(entry.log)) ? `${entry.log}NM` : 'N/A'}
                    </div>
                  </div>
                  {entry.text && (
                    <div className="mt-3 p-2 bg-oGray rounded">
                      <strong>Remarks:</strong> {entry.text}
                    </div>
                  )}
                  {getWeather(entry) && (
                    <div className="mt-2 text-gray-300">
                      <strong>Weather:</strong> {getWeather(entry)}
                    </div>
                  )}
                </div>
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
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Logbook Analysis</h3>
        <p className="text-gray-400 text-sm">Select an analysis type to get AI-powered insights</p>
      </div>

      {ocearoCoreEnabled && (
        <div className="bg-oGray2 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3">Analysis Options:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center"
              onClick={getLogbookAnalysis}
              disabled={analysisLoading}
            >
              <FontAwesomeIcon icon={faBook} className="mb-2" size="lg" />
              <span className="text-sm font-medium">Logbook</span>
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center"
              onClick={() => getOcearoCoreAnalysis('weather')}
              disabled={analysisLoading}
            >
              <FontAwesomeIcon icon={faCloudSun} className="mb-2" size="lg" />
              <span className="text-sm font-medium">Weather</span>
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center"
              onClick={() => getOcearoCoreAnalysis('sail')}
              disabled={analysisLoading}
            >
              <FontAwesomeIcon icon={faCompass} className="mb-2" size="lg" />
              <span className="text-sm font-medium">Sail</span>
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center"
              onClick={() => getOcearoCoreAnalysis('alerts')}
              disabled={analysisLoading}
            >
              <FontAwesomeIcon icon={faRobot} className="mb-2" size="lg" />
              <span className="text-sm font-medium">Alerts</span>
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center"
              onClick={() => getOcearoCoreAnalysis('status')}
              disabled={analysisLoading}
            >
              <FontAwesomeIcon icon={faTachometerAlt} className="mb-2" size="lg" />
              <span className="text-sm font-medium">Status</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Loading indicator with progress bar */}
      {analysisLoading && (
        <div className="bg-oGray2 rounded-lg p-6 mb-4">
          <div className="text-center">
            <FontAwesomeIcon icon={faRobot} size="3x" className="text-green-500 mb-4 animate-pulse" />
            <h4 className="text-xl text-white mb-3">Analyzing {analysisType}...</h4>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Please wait while OcearoCore processes the data</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !analysisLoading && (
        <div className="bg-oGray2 rounded-lg p-6 mb-4">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faChartLine} className="text-green-500 mr-3" size="lg" />
            <h4 className="text-xl text-white font-bold">Analysis Results: {analysisType}</h4>
          </div>
          
          <div className="space-y-4">
            {/* Display main analysis text (handles various backend formats) */}
            {(analysisResult.analysis || analysisResult.aiAnalysis || (typeof analysisResult.summary === 'string' ? analysisResult.summary : null)) && (
              <div className="bg-oGray rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Analysis Summary:</h5>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {analysisResult.analysis || analysisResult.aiAnalysis || analysisResult.summary}
                </p>
              </div>
            )}

            {/* Display structured summary (e.g. weather conditions) */}
            {analysisResult.summary && typeof analysisResult.summary === 'object' && (
              <div className="bg-oGray rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Conditions:</h5>
                <div className="grid grid-cols-1 gap-2 text-gray-300 text-sm">
                  {Object.entries(analysisResult.summary).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-semibold w-24 capitalize">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display insights/recommendations */}
            {(analysisResult.insights || analysisResult.recommendations) && (
              <div className="bg-oGray rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Insights & Recommendations:</h5>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {(analysisResult.insights || []).map((item, i) => (
                    <li key={`insight-${i}`} className="text-blue-300">{item}</li>
                  ))}
                  {(analysisResult.recommendations || []).map((item, i) => (
                    <li key={`rec-${i}`} className="text-green-300">{typeof item === 'string' ? item : item.message || JSON.stringify(item)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Display speech text if available */}
            {(analysisResult.speechText || analysisResult.speech) && (
              <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
                <h5 className="text-blue-400 font-medium mb-2 flex items-center">
                  <FontAwesomeIcon icon={faRobot} className="mr-2" />
                  Spoken Analysis:
                </h5>
                <p className="text-gray-300 whitespace-pre-wrap">{analysisResult.speechText || analysisResult.speech}</p>
              </div>
            )}

            {/* Display raw data or technical details if available */}
            {(analysisResult.data || analysisResult.weatherData || analysisResult.assessment) && (
              <div className="bg-oGray rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Technical Data:</h5>
                <pre className="text-gray-300 text-xs overflow-auto max-h-60">
                  {JSON.stringify(analysisResult.data || analysisResult.assessment || analysisResult.weatherData, null, 2)}
                </pre>
              </div>
            )}

            {/* Display timestamp */}
            {analysisResult.timestamp && (
              <div className="text-gray-500 text-sm text-right">
                Generated: {new Date(analysisResult.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder when no analysis */}
      {!analysisResult && !analysisLoading && (
        <div className="bg-oGray2 rounded-lg p-6">
          <div className="text-center text-gray-400">
            <FontAwesomeIcon icon={faChartLine} size="3x" className="mb-4" />
            <h4 className="text-xl text-white mb-2">Analysis Results</h4>
            <p>
              This section will display detailed analysis of your logbook entries,
              including route optimization, weather patterns, and performance metrics.
            </p>
            {ocearoCoreEnabled && (
              <p className="mt-4 text-green-400">
                Select an analysis option above to generate AI-powered insights.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render add/edit entry modal
   */
  const renderEntryModal = () => {
    if (!showEntryModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEntryModal(false)}>
        <div className="bg-oGray2 rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              {selectedEntry ? 'Edit Entry' : 'Add Logbook Entry'}
            </h3>
            <button
              onClick={() => setShowEntryModal(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Author</label>
              <input
                type="text"
                value={entryForm.author}
                onChange={(e) => setEntryForm({ ...entryForm, author: e.target.value })}
                className="w-full bg-oGray text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                placeholder="Enter author name"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Remarks</label>
              <textarea
                value={entryForm.text}
                onChange={(e) => setEntryForm({ ...entryForm, text: e.target.value })}
                className="w-full bg-oGray text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                rows="4"
                placeholder="Enter logbook entry remarks"
              />
            </div>

            <div className="bg-oGray rounded-lg p-3">
              <p className="text-gray-400 text-sm">
                Current vessel data (position, course, speed, wind, etc.) will be automatically captured when you save this entry.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEntryModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                disabled={loading || !entryForm.text.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rightPaneBg overflow-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'timeline'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faTimeline} className="mr-2" />
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('logbook')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'logbook'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faBook} className="mr-2" />
          Logbook
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'analysis'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faChartLine} className="mr-2" />
          Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-white">Loading...</div>
          </div>
        )}
        
        {!loading && activeTab === 'timeline' && renderTimeline()}
        {!loading && activeTab === 'logbook' && renderLogbookTable()}
        {!loading && activeTab === 'analysis' && renderAnalysis()}
      </div>

      {/* Entry Modal */}
      {renderEntryModal()}
    </div>
  );
};

export default LogbookView;
