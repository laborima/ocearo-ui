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
  
  // Determine the base URL - use configured URL if set, otherwise compute from window location
  let baseUrl;
  if (config.signalKUrlSet && config.signalkUrl) {
    baseUrl = config.signalkUrl;
  } else if (typeof configService.getComputedSignalKUrl === 'function') {
    baseUrl = configService.getComputedSignalKUrl();
  } else {
    baseUrl = config.signalkUrl || 'http://localhost:3000';
  }
  
  return {
    enabled: config.ocearoCoreEnabled !== false,
    baseUrl,
    timeout: 60000, // 60 second timeout for AI responses
    useAuthentication: config.useAuthentication || false,
    username: config.username || '',
    password: config.password || ''
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
export const makeOcearoCoreApiCall = async (endpoint, options = {}) => {
  const config = getOcearoCoreConfig();
  
  if (!config.enabled) {
    throw new Error('OcearoCore is not enabled');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const url = `${config.baseUrl}/plugins/ocearo-core${endpoint}`;

    // Build headers with optional Basic Auth if username is provided
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    let credentialsOption = 'include';

    // Add Basic Auth header if authentication is enabled and username is provided
    if (config.useAuthentication && config.username) {
      try {
        // btoa is available in browsers; guard in case of environment issues
        const token = typeof btoa === 'function'
          ? btoa(`${config.username}:${config.password || ''}`)
          : Buffer.from(`${config.username}:${config.password || ''}`).toString('base64');
        headers['Authorization'] = `Basic ${token}`;
        
        // If we have explicit credentials, prefer them over cookies to avoid "old cookie" issues
        credentialsOption = 'omit';
      } catch (_) {
        // If encoding fails, skip adding the header
      }
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      // Use omit if we have auth header, otherwise include to support session cookies
      credentials: credentialsOption,
      ...options
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (response.status === 404 || contentType.includes('text/html')) {
        const notFoundError = new Error(`OcearoCore plugin not available at ${url}`);
        notFoundError.name = 'NetworkError';
        throw notFoundError;
      }
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`OcearoCore API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('OcearoCore API request timed out');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }

    if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
      const networkError = new Error(`OcearoCore server unreachable at ${config.baseUrl}`);
      networkError.name = 'NetworkError';
      throw networkError;
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
    console.warn('Failed to get OcearoCore status:', error);
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
  const validTypes = ['weather', 'sail', 'alerts', 'ais', 'status', 'logbook'];
  
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

// ===== FUEL LOG FUNCTIONS =====

/**
 * Add a fuel log entry to the logbook
 * @param {Object} fuelData - Fuel refill data
 * @param {number} fuelData.liters - Amount of fuel added in liters
 * @param {number} fuelData.cost - Cost of the refill
 * @param {boolean} fuelData.additive - Whether additive was added
 * @param {number} fuelData.engineHours - Engine hours at refill
 * @param {number} fuelData.previousEngineHours - Engine hours at previous refill
 * @param {Object} position - Current GPS position
 * @returns {Promise<Object>} - The created logbook entry
 */
export const addFuelLogEntry = async (fuelData, position = null) => {
  if (!fuelData || typeof fuelData !== 'object') {
    throw new Error('Fuel data is required and must be an object');
  }

  // Try the dedicated fuel endpoint first (ocearo-core local store)
  try {
    const record = {
      datetime: new Date().toISOString(),
      type: 'fuel_refill',
      position: position || { latitude: null, longitude: null },
      fuel: {
        liters: fuelData.liters,
        cost: fuelData.cost,
        additive: fuelData.additive || false,
        engineHoursAtRefill: fuelData.engineHours,
        previousEngineHours: fuelData.previousEngineHours || null,
        hoursSinceLastRefill: fuelData.hoursSinceLastRefill || null
      },
      liters: fuelData.liters,
      author: 'fuel_log',
      text: `Fuel refill: ${fuelData.liters}L - ${fuelData.cost}€${fuelData.additive ? ' (with additive)' : ''} - Engine hours: ${fuelData.engineHours}h`
    };
    return await makeOcearoCoreApiCall('/logbook/fuel', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  } catch (err) {
    // Fallback: store as regular logbook entry via the proxy
    const entry = {
      datetime: new Date().toISOString(),
      type: 'fuel_refill',
      position: position || { latitude: null, longitude: null },
      fuel: {
        liters: fuelData.liters,
        cost: fuelData.cost,
        additive: fuelData.additive || false,
        engineHoursAtRefill: fuelData.engineHours,
        previousEngineHours: fuelData.previousEngineHours || null,
        hoursSinceLastRefill: fuelData.hoursSinceLastRefill || null
      },
      author: 'fuel_log',
      text: `Fuel refill: ${fuelData.liters}L - ${fuelData.cost}€${fuelData.additive ? ' (with additive)' : ''} - Engine hours: ${fuelData.engineHours}h`
    };
    return await addLogbookEntry(entry);
  }
};

/**
 * Fetch fuel log entries from logbook
 * @returns {Promise<Array>} - Array of fuel log entries
 */
export const fetchFuelLogEntries = async () => {
  // Try the dedicated fuel endpoint first (ocearo-core local store)
  try {
    const entries = await makeOcearoCoreApiCall('/logbook/fuel');
    if (Array.isArray(entries) && entries.length >= 0) {
      return entries;
    }
  } catch (err) {
    // Fallback: filter from general logbook entries
  }
  const entries = await fetchLogbookEntries();
  return entries.filter(entry => entry.type === 'fuel_refill' || entry.author === 'fuel_log');
};

/**
 * Calculate fuel consumption statistics from fuel log entries
 * @param {Array} fuelEntries - Array of fuel log entries
 * @param {number} tankCapacity - Tank capacity in liters
 * @returns {Object} - Consumption statistics
 */
export const calculateFuelStats = (fuelEntries, tankCapacity = null) => {
  if (!fuelEntries || fuelEntries.length === 0) {
    return {
      averageConsumption: null,
      totalLiters: 0,
      totalCost: 0,
      refillCount: 0,
      estimatedTankLevel: null,
      lastRefill: null
    };
  }

  const sortedEntries = [...fuelEntries].sort((a, b) => 
    new Date(a.datetime) - new Date(b.datetime)
  );

  let totalLiters = 0;
  let totalCost = 0;
  let totalHours = 0;
  let consumptionReadings = [];

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const fuel = entry.fuel || {};
    
    totalLiters += fuel.liters || 0;
    totalCost += fuel.cost || 0;

    if (fuel.hoursSinceLastRefill && fuel.hoursSinceLastRefill > 0) {
      const litersUsed = fuel.liters || 0;
      const hours = fuel.hoursSinceLastRefill;
      
      if (litersUsed > 0 && hours > 0) {
        consumptionReadings.push(litersUsed / hours);
        totalHours += hours;
      }
    }
  }

  const averageConsumption = consumptionReadings.length > 0
    ? consumptionReadings.reduce((a, b) => a + b, 0) / consumptionReadings.length
    : null;

  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const lastFuel = lastEntry?.fuel || {};

  return {
    averageConsumption: averageConsumption ? Math.round(averageConsumption * 10) / 10 : null,
    totalLiters: Math.round(totalLiters * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    refillCount: sortedEntries.length,
    totalHours: Math.round(totalHours * 10) / 10,
    lastRefill: lastEntry ? {
      date: new Date(lastEntry.datetime),
      liters: lastFuel.liters,
      engineHours: lastFuel.engineHoursAtRefill
    } : null
  };
};

/**
 * Estimate current tank level based on fuel logs and current engine hours
 * @param {Array} fuelEntries - Array of fuel log entries
 * @param {number} currentEngineHours - Current engine hours
 * @param {number} tankCapacity - Tank capacity in liters
 * @param {number} currentTankLevel - Current tank level from sensor (0-1 ratio)
 * @returns {Object} - Tank level estimation
 */
export const estimateTankLevel = (fuelEntries, currentEngineHours, tankCapacity, currentTankLevel = null) => {
  const stats = calculateFuelStats(fuelEntries, tankCapacity);
  
  if (!stats.lastRefill || !stats.averageConsumption || !currentEngineHours) {
    return {
      estimatedLiters: null,
      estimatedPercent: null,
      hoursRemaining: null,
      basedOnSensor: currentTankLevel !== null,
      sensorLevel: currentTankLevel !== null ? Math.round(currentTankLevel * 100) : null
    };
  }

  const hoursSinceLastRefill = currentEngineHours - stats.lastRefill.engineHours;
  const estimatedUsed = hoursSinceLastRefill * stats.averageConsumption;
  
  let estimatedRemaining;
  if (currentTankLevel !== null && tankCapacity) {
    estimatedRemaining = (currentTankLevel * tankCapacity) - estimatedUsed;
  } else if (tankCapacity && stats.lastRefill.liters) {
    estimatedRemaining = stats.lastRefill.liters - estimatedUsed;
  } else {
    estimatedRemaining = null;
  }

  const estimatedPercent = estimatedRemaining !== null && tankCapacity
    ? Math.max(0, Math.min(100, (estimatedRemaining / tankCapacity) * 100))
    : null;

  const hoursRemaining = estimatedRemaining !== null && stats.averageConsumption > 0
    ? Math.max(0, estimatedRemaining / stats.averageConsumption)
    : null;

  return {
    estimatedLiters: estimatedRemaining !== null ? Math.round(estimatedRemaining * 10) / 10 : null,
    estimatedPercent: estimatedPercent !== null ? Math.round(estimatedPercent) : null,
    hoursRemaining: hoursRemaining !== null ? Math.round(hoursRemaining * 10) / 10 : null,
    hoursSinceLastRefill: Math.round(hoursSinceLastRefill * 10) / 10,
    estimatedUsed: Math.round(estimatedUsed * 10) / 10,
    basedOnSensor: currentTankLevel !== null,
    sensorLevel: currentTankLevel !== null ? Math.round(currentTankLevel * 100) : null
  };
};

// ===== ANCHOR API FUNCTIONS =====

/**
 * Drop anchor at current vessel position
 * @returns {Promise<Object>} - { state, statusCode, position, anchorState }
 */
export const anchorDrop = async () => {
  return await makeOcearoCoreApiCall('/navigation/anchor/drop', { method: 'POST', body: '{}' });
};

/**
 * Raise anchor
 * @returns {Promise<Object>}
 */
export const anchorRaise = async () => {
  return await makeOcearoCoreApiCall('/navigation/anchor/raise', { method: 'POST', body: '{}' });
};

/**
 * Set anchor alarm radius
 * @param {number} radiusMetres
 * @returns {Promise<Object>}
 */
export const anchorSetRadius = async (radiusMetres) => {
  if (!radiusMetres || radiusMetres <= 0) throw new Error('Radius must be a positive number (metres)');
  return await makeOcearoCoreApiCall('/navigation/anchor/radius', {
    method: 'POST',
    body: JSON.stringify({ value: radiusMetres })
  });
};

/**
 * Reposition anchor using rode length and depth
 * @param {number} rodeLength  metres
 * @param {number} anchorDepth metres
 * @returns {Promise<Object>}
 */
export const anchorReposition = async (rodeLength, anchorDepth) => {
  if (!rodeLength || rodeLength <= 0) throw new Error('rodeLength must be a positive number (metres)');
  if (!anchorDepth || anchorDepth <= 0) throw new Error('anchorDepth must be a positive number (metres)');
  return await makeOcearoCoreApiCall('/navigation/anchor/reposition', {
    method: 'POST',
    body: JSON.stringify({ rodeLength, anchorDepth })
  });
};

/**
 * Get current anchor status
 * @returns {Promise<Object>} - { state, position, maxRadius, currentRadius, rodeLength, droppedAt, dragging }
 */
export const getAnchorStatus = async () => {
  return await makeOcearoCoreApiCall('/navigation/anchor/status');
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
export const collectCurrentVesselDataFromValues = (skValues) => {
  const getVal = (path) => skValues[path] ?? null;
  const position = getVal('navigation.position') || {};
  
  return {
    position: {
      latitude: position.latitude || null,
      longitude: position.longitude || null
    },
    course: getVal('navigation.courseOverGroundTrue') || getVal('navigation.headingTrue'),
    speed: getVal('navigation.speedOverGround'),
    wind: {
      speed: getVal('environment.wind.speedTrue'),
      direction: getVal('environment.wind.angleTrueWater')
    },
    weather: {
      pressure: getVal('environment.outside.pressure'),
      temperature: getVal('environment.outside.temperature')
    },
    engine: {
      hours: getVal('propulsion.main.runTime')
    },
    log: getVal('navigation.log')
  };
};

/**
 * Collect current vessel data for OcearoCore analysis (Legacy version using getSignalKValue)
 * @deprecated Use collectCurrentVesselDataFromValues instead
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
  if (error.name === 'NetworkError') {
    console.warn(`${context} failed: OcearoCore server unreachable.`, error.message);
    return 'OcearoCore server unreachable. Please check if the service is running.';
  }
  
  if (error.name === 'TimeoutError' || error.message.includes('timed out')) {
    console.warn(`${context} failed: OcearoCore request timed out.`);
    return 'OcearoCore service is not responding (timeout)';
  }

    console.warn(`${context} failed:`, error.message);
  
  // Return user-friendly error messages
  if (error.message.includes('not enabled')) {
    return 'OcearoCore is not enabled in the configuration';
  }
  
  // Check for logbook-specific errors
  if (error.message.includes('Logbook write failed') ||
      error.message.includes('Logbook manager not initialized')) {
    return 'Logbook service error. Please check the ocearo-core plugin status.';
  }
  
  if (error.message.includes('503')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  if (error.message.includes('404')) {
    return 'Feature not found or not installed';
  }
  
  if (error.message.includes('500')) {
    return 'Internal server error. Check server logs for details.';
  }
  
  return error.message || 'Unknown error occurred';
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

const OcearoCoreUtils = {
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
  collectCurrentVesselDataFromValues,
  collectCurrentVesselData,
  
  // Logbook proxy functions
  fetchLogbookEntries,
  addLogbookEntry,
  
  // Fuel log functions
  addFuelLogEntry,
  fetchFuelLogEntries,
  calculateFuelStats,
  estimateTankLevel,

  // Anchor API functions
  anchorDrop,
  anchorRaise,
  anchorSetRadius,
  anchorReposition,
  getAnchorStatus,
  
  // Utility functions
  handleOcearoCoreError,
  batchOcearoCoreOperations,
  checkOcearoCoreHealth
};

export default OcearoCoreUtils;
