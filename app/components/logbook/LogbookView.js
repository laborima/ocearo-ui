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
  addLogbookEntry
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
      const transformedEntries = await fetchLogbookEntries();
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
        author: 'manual',
        text: 'Manual entry'
      };

      // Use OcearoCore proxy to add the entry
      await addLogbookEntry(newEntry);
      
      // Refresh entries after successful addition
      fetchLogbookEntriesData();
    } catch (err) {
      console.error('Error adding entry:', err);
      const errorMessage = handleOcearoCoreError(err, 'Add logbook entry');
      setError(errorMessage);
    }
  }, [getSignalKValue, fetchLogbookEntriesData]);

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
  const getOcearoCoreAnalysis = useCallback(async () => {
    if (!ocearoCoreEnabled) {
      setError('OcearoCore is not enabled');
      return;
    }

    try {
      setLoading(true);
      
      // Use the last 10 entries for analysis
      const recentEntries = entries.slice(-10);
      
      // Call OcearoCore API for logbook analysis
      const analysis = await analyzeLogbookWithOcearoCore(recentEntries);
      
      // Handle analysis display (navigate to analysis tab)
      setActiveTab('analysis');
      console.log('OcearoCore Analysis:', analysis);
      
    } catch (err) {
      const errorMessage = handleOcearoCoreError(err, 'OcearoCore analysis');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [ocearoCoreEnabled, entries]);

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Logbook Analysis</h3>
        {ocearoCoreEnabled && (
          <button 
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            onClick={getOcearoCoreAnalysis}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faRobot} className="mr-2" />
            Get OcearoCore Analysis
          </button>
        )}
      </div>

      <div className="bg-oGray2 rounded-lg p-6">
        <div className="text-center text-gray-400">
          <FontAwesomeIcon icon={faChartLine} size="3x" className="mb-4" />
          <h4 className="text-xl text-white mb-2">Analysis Coming Soon</h4>
          <p>
            This section will display detailed analysis of your logbook entries,
            including route optimization, weather patterns, and performance metrics.
          </p>
          {ocearoCoreEnabled && (
            <p className="mt-4 text-green-400">
              Click "Get OcearoCore Analysis" above to generate AI-powered insights.
            </p>
          )}
        </div>
      </div>
    </div>
  );

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
    </div>
  );
};

export default LogbookView;
