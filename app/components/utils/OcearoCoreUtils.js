/**
 * OcearoCoreUtils - Centralized OcearoCore API utilities
 * Handles all interactions with the ocearo-core plugin
 */

import configService from '../settings/ConfigService';

/**
 * Base configuration for OcearoCore API calls
 */
const getOcearoCoreConfig = () => {
  const config = configService.getAll();
  return {
    enabled: config.ocearoCoreEnabled || false,
    baseUrl: config.signalkUrl || 'http://localhost:3000',
    timeout: 10000 // 10 second timeout
  };
};

/**
 * Check if OcearoCore is enabled
 */
export const isOcearoCoreEnabled = () => {
  const config = getOcearoCoreConfig();
  return config.enabled;
};

/**
 * Make a generic API call to OcearoCore plugin
 */
const makeOcearoCoreApiCall = async (endpoint, options = {}) => {
  const config = getOcearoCoreConfig();
  
  if (!config.enabled) {
    throw new Error('OcearoCore is not enabled');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const url = `${config.baseUrl}/plugins/ocearo-core${endpoint}`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`OcearoCore API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('OcearoCore API request timed out');
    }
    
    throw error;
  }
};

/**
 * Get OcearoCore system status
 */
export const getOcearoCoreStatus = async () => {
  try {
    return await makeOcearoCoreApiCall('/status');
  } catch (error) {
    console.error('Failed to get OcearoCore status:', error);
    return {
      error: error.message,
      available: false
    };
  }
};

/**
 * Request manual analysis from OcearoCore
 */
export const requestAnalysis = async (analysisType, data = {}) => {
  const validTypes = ['weather', 'sail', 'alerts', 'status', 'logbook'];
  
  if (!validTypes.includes(analysisType)) {
    throw new Error(`Invalid analysis type. Valid types: ${validTypes.join(', ')}`);
  }

  return await makeOcearoCoreApiCall('/analyze', {
    method: 'POST',
    body: JSON.stringify({
      type: analysisType,
      ...data
    })
  });
};

/**
 * Update OcearoCore mode
 */
export const updateOcearoCoreMode = async (mode) => {
  const validModes = ['sailing', 'anchored', 'motoring', 'moored', 'racing'];
  
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode. Valid modes: ${validModes.join(', ')}`);
  }

  return await makeOcearoCoreApiCall('/mode', {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
};

/**
 * Make OcearoCore speak text
 */
export const OcearoCoreSpeak = async (text, priority = 'normal') => {
  const validPriorities = ['low', 'normal', 'high'];
  
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required and must be a string');
  }
  
  if (text.length > 1000) {
    throw new Error('Text too long (max 1000 characters)');
  }

  if (!validPriorities.includes(priority)) {
    throw new Error(`Invalid priority. Valid priorities: ${validPriorities.join(', ')}`);
  }

  return await makeOcearoCoreApiCall('/speak', {
    method: 'POST',
    body: JSON.stringify({ text, priority })
  });
};

/**
 * Get OcearoCore memory information
 */
export const getOcearoCoreMemory = async () => {
  return await makeOcearoCoreApiCall('/memory');
};

/**
 * Get OcearoCore memory statistics
 */
export const getOcearoCoreMemoryStats = async () => {
  return await makeOcearoCoreApiCall('/memory/stats');
};

/**
 * Update OcearoCore memory context
 */
export const updateOcearoCoreContext = async (vesselInfo, destination) => {
  return await makeOcearoCoreApiCall('/memory/context', {
    method: 'POST',
    body: JSON.stringify({
      vesselInfo,
      destination
    })
  });
};

/**
 * Test LLM functionality
 */
export const testOcearoCoreLLM = async (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }
  
  if (prompt.length > 2000) {
    throw new Error('Prompt too long (max 2000 characters)');
  }

  return await makeOcearoCoreApiCall('/llm/test', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
};

// ===== LOGBOOK-SPECIFIC FUNCTIONS =====

/**
 * Get logbook entries with OcearoCore analysis
 */
export const getOcearoCoreLogbookEntries = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const endpoint = `/logbook/entries${queryString ? `?${queryString}` : ''}`;
  
  return await makeOcearoCoreApiCall(endpoint);
};

/**
 * Get logbook statistics from OcearoCore
 */
export const getOcearoCoreLogbookStats = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const endpoint = `/logbook/stats${queryString ? `?${queryString}` : ''}`;
  
  return await makeOcearoCoreApiCall(endpoint);
};

/**
 * Request OcearoCore analysis of logbook data
 */
export const analyzeLogbookWithOcearoCore = async (entries = []) => {
  return await makeOcearoCoreApiCall('/logbook/analyze', {
    method: 'POST',
    body: JSON.stringify({ entries })
  });
};

/**
 * Generate AI-enhanced logbook entry with OcearoCore
 */
export const generateOcearoCoreLogbookEntry = async (currentData) => {
  if (!currentData || typeof currentData !== 'object') {
    throw new Error('Current data is required and must be an object');
  }

  return await makeOcearoCoreApiCall('/logbook/entry', {
    method: 'POST',
    body: JSON.stringify({ currentData })
  });
};

// ===== LOGBOOK PROXY FUNCTIONS =====

/**
 * Fetch all logbook entries through OcearoCore proxy
 */
export const fetchLogbookEntries = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const endpoint = `/logbook/all-entries${queryString ? `?${queryString}` : ''}`;
  
  return await makeOcearoCoreApiCall(endpoint);
};

/**
 * Add a new logbook entry through OcearoCore proxy
 */
export const addLogbookEntry = async (entry) => {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Entry data is required and must be an object');
  }

  return await makeOcearoCoreApiCall('/logbook/add-entry', {
    method: 'POST',
    body: JSON.stringify(entry)
  });
};

/**
 * Collect current vessel data for OcearoCore analysis
 */
export const collectCurrentVesselData = (getSignalKValue) => {
  return {
    position: {
      latitude: getSignalKValue('navigation.position.latitude'),
      longitude: getSignalKValue('navigation.position.longitude')
    },
    course: getSignalKValue('navigation.courseOverGroundTrue') || getSignalKValue('navigation.headingTrue'),
    speed: getSignalKValue('navigation.speedOverGround'),
    wind: {
      speed: getSignalKValue('environment.wind.speedTrue'),
      direction: getSignalKValue('environment.wind.angleTrueWater')
    },
    weather: {
      pressure: getSignalKValue('environment.outside.pressure'),
      temperature: getSignalKValue('environment.outside.temperature')
    },
    engine: {
      hours: getSignalKValue('propulsion.main.runTime')
    },
    log: getSignalKValue('navigation.log')
  };
};

/**
 * Error handler for OcearoCore API calls
 */
export const handleOcearoCoreError = (error, context = 'OcearoCore operation') => {
  console.error(`${context} failed:`, error);
  
  // Return user-friendly error messages
  if (error.message.includes('not enabled')) {
    return 'OcearoCore is not enabled in the configuration';
  }
  
  if (error.message.includes('timed out')) {
    return 'OcearoCore service is not responding (timeout)';
  }
  
  if (error.message.includes('503')) {
    return 'OcearoCore service is not available';
  }
  
  if (error.message.includes('404')) {
    return 'OcearoCore feature not found or not installed';
  }
  
  if (error.message.includes('500')) {
    return 'OcearoCore internal server error';
  }
  
  return error.message || 'Unknown OcearoCore error occurred';
};

/**
 * Batch multiple OcearoCore operations with error handling
 */
export const batchOcearoCoreOperations = async (operations) => {
  const results = [];
  
  for (const operation of operations) {
    try {
      const result = await operation();
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ 
        success: false, 
        error: handleOcearoCoreError(error, 'Batch operation') 
      });
    }
  }
  
  return results;
};

/**
 * Check OcearoCore service health
 */
export const checkOcearoCoreHealth = async () => {
  try {
    const status = await getOcearoCoreStatus();
    return {
      healthy: !status.error,
      status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: handleOcearoCoreError(error, 'Health check'),
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  // Core functions
  isOcearoCoreEnabled,
  getOcearoCoreStatus,
  requestAnalysis,
  updateOcearoCoreMode,
  OcearoCoreSpeak,
  
  // Memory functions
  getOcearoCoreMemory,
  getOcearoCoreMemoryStats,
  updateOcearoCoreContext,
  
  // LLM functions
  testOcearoCoreLLM,
  
  // Logbook functions
  getOcearoCoreLogbookEntries,
  getOcearoCoreLogbookStats,
  analyzeLogbookWithOcearoCore,
  generateOcearoCoreLogbookEntry,
  collectCurrentVesselData,
  
  // Logbook proxy functions
  fetchLogbookEntries,
  addLogbookEntry,
  
  // Utility functions
  handleOcearoCoreError,
  batchOcearoCoreOperations,
  checkOcearoCoreHealth
};
