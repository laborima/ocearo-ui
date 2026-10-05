/**
 * SignalKService - Centralized SignalK client management with authentication support
 * 
 * This service provides:
 * - Centralized SignalK client configuration with authentication
 * - Weather API integration (forecasts from SignalK weather plugin)
 * - Resources API (routes, waypoints, charts, notes, regions)
 * - Course API (navigation course data and calculations)
 * - Token-based and Basic authentication support
 */

import Client from '@signalk/client';
import configService from '../settings/ConfigService';
import { kelvinToCelsius as _kelvinToCelsius, msToKnots as _msToKnots, radiansToDegrees as _radiansToDegrees } from '../utils/UnitConversions';

// Default HTTP timeout for Signal K REST calls
const API_TIMEOUT_MS = 10000;

class SignalKService {
    constructor() {
        this.client = null;
        this.authToken = null;
        this.weatherApiAvailable = null;
        this.featuresCache = null;
        this.connectionListeners = [];
        this.isConnected = false;
    }

    /**
     * Get SignalK client configuration from ConfigService
     * @returns {Object} Client configuration object
     */
    getClientConfig() {
        const config = configService.getAll();
        const signalkUrl = configService.getSignalKUrl();
        const [hostname, port] = signalkUrl.replace(/https?:\/\//, '').replace(/\/.*$/, '').split(':');
        const useTLS = signalkUrl.startsWith('https');

        return {
            hostname: hostname || 'localhost',
            // No port in the URL: the scheme's default (behind a proxy on 80 / 443)
            port: parseInt(port) || (useTLS ? 443 : 80),
            useTLS,
            useAuthentication: config.useAuthentication || false,
            username: config.username || null,
            password: config.password || null,
            reconnect: true,
            autoConnect: false,
            notifications: false,
            deltaStreamBehaviour: 'self',
            sendMeta: 'all',
            wsKeepaliveInterval: 10
        };
    }

    /**
     * Create and configure a new SignalK client instance
     * @param {Object} options - Additional client options to merge
     * @returns {Client} Configured SignalK client
     */
    createClient(options = {}) {
        const baseConfig = this.getClientConfig();
        const mergedConfig = { ...baseConfig, ...options };

        return new Client(mergedConfig);
    }

    /**
     * Connect to SignalK server with authentication if configured
     * @param {Object} options - Additional client options
     * @returns {Promise<Client>} Connected client instance
     */
    async connect(options = {}) {
        try {
            this.client = this.createClient(options);
            await this.client.connect();
            this.isConnected = true;

            // Check if weather API is available
            await this.checkWeatherApiAvailability();

            // Notify listeners
            this.connectionListeners.forEach(listener => listener(true, this.client));

            return this.client;
        } catch (error) {
            console.error('SignalKService: Failed to connect:', error);
            this.isConnected = false;
            this.connectionListeners.forEach(listener => listener(false, null, error));
            throw error;
        }
    }

    /**
     * Disconnect from SignalK server
     */
    disconnect() {
        if (this.client) {
            this.client.disconnect();
            this.client = null;
            this.isConnected = false;
            this.connectionListeners.forEach(listener => listener(false, null));
        }
    }

    /**
     * Add a connection state listener
     * @param {Function} listener - Callback function(isConnected, client, error)
     */
    addConnectionListener(listener) {
        this.connectionListeners.push(listener);
    }

    /**
     * Remove a connection state listener
     * @param {Function} listener - Listener to remove
     */
    removeConnectionListener(listener) {
        this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    }

    /**
     * Get the base URL for SignalK API calls
     * @returns {string} Base URL
     */
    getBaseUrl() {
        return configService.getSignalKUrl();
    }

    isDemoSignalK() {
        const config = configService.getAll();
        const baseUrl = configService.getSignalKUrl() || '';
        return config.debugMode || baseUrl.includes('demo.signalk.org');
    }

    /**
     * Get authentication headers for API calls
     * @returns {Object} Headers object with authentication
     */
    getAuthHeaders() {
        const config = configService.getAll();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (config.useAuthentication && config.username) {
            const token = typeof btoa === 'function'
                ? btoa(`${config.username}:${config.password || ''}`)
                : Buffer.from(`${config.username}:${config.password || ''}`).toString('base64');
            headers['Authorization'] = `Basic ${token}`;
        }

        // Add token if available
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    /**
     * Make an authenticated API call to SignalK
     * @param {string} path - API path (e.g., '/signalk/v2/api/weather/forecasts/point')
     * @param {Object} options - Fetch options
     * @returns {Promise<any>} API response
     */
    async apiCall(path, options = {}) {
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}${path}`;
        const headers = this.getAuthHeaders();

        const config = configService.getAll();
        const credentialsOption = config.useAuthentication && config.username ? 'include' : 'omit';

        // A request on flaky boat Wi-Fi must not hang a control forever
        const { timeoutMs = API_TIMEOUT_MS, ...fetchOptions } = options;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            // Spread options first: their own `headers` must not replace the auth headers
            const response = await fetch(url, {
                credentials: credentialsOption,
                ...fetchOptions,
                headers: { ...headers, ...fetchOptions.headers },
                signal: controller.signal,
            });

            // Empty bodies (204, some PUT/POST acks) are a success, not a JSON error
            const text = await response.text();
            let body = null;
            if (text) {
                try { body = JSON.parse(text); } catch { body = text; }
            }

            if (!response.ok) {
                // v2 APIs explain failures in `message` (e.g. "Autopilot is offline")
                const detail = body?.message ? ` — ${body.message}` : '';
                const apiError = new Error(`SignalK API error (${response.status}): ${response.statusText}${detail}`);
                apiError.status = response.status;
                throw apiError;
            }

            return body;
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`SignalK request timed out after ${timeoutMs / 1000}s`);
                timeoutError.name = 'NetworkError';
                console.warn(`SignalKService: Timeout for ${path}`);
                throw timeoutError;
            }
            if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
                const networkError = new Error(`SignalK server unreachable at ${baseUrl}`);
                networkError.name = 'NetworkError';
                console.warn(`SignalKService: Server unreachable for ${path}:`, error.message);
                throw networkError;
            }
            if (error.status === 400 || error.status === 404) {
                console.warn(`SignalKService: API call returned error for ${path}:`, error.message);
            } else {
                console.warn(`SignalKService: API call failed for ${path}:`, error);
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Fetch recorded values from the Signal K History API (needs a history
     * provider plugin such as signalk-parquet or signalk-to-influxdb2).
     * @param {Object} query
     * @param {string[]} query.paths - Signal K paths (optionally `path:aggregate`)
     * @param {string} query.duration - ISO 8601 duration ending now, e.g. 'PT1H'
     * @param {string} [query.resolution] - sample window, e.g. '1s', '1m'
     * @param {string} [query.context] - defaults to vessels.self on the server
     * @returns {Promise<Array<[string, ...any]>|null>} rows of [isoTime, ...values in
     *          `paths` order], or null when no history provider is available
     */
    async getHistoryValues({ paths, duration, resolution, context }) {
        const params = new URLSearchParams({ paths: paths.join(','), duration });
        if (resolution) params.set('resolution', resolution);
        if (context) params.set('context', context);
        try {
            const result = await this.apiCall(`/signalk/v2/api/history/values?${params}`);
            return Array.isArray(result?.data) ? result.data : null;
        } catch {
            // 404/501: server without History API or without a provider
            return null;
        }
    }

    /**
     * Take an action on a notification managed by the Signal K Notifications API
     * (server >= 2.28). The server re-emits the notification delta with an
     * updated `status`, so the UI refreshes through the normal data stream.
     * @param {string} notificationId - `id` field of the notification value
     * @param {'silence'|'acknowledge'} action
     */
    async notificationAction(notificationId, action) {
        if (!notificationId || !['silence', 'acknowledge'].includes(action)) {
            throw new Error(`Invalid notification action: ${action}`);
        }
        return this.apiCall(`/signalk/v2/api/notifications/${encodeURIComponent(notificationId)}/${action}`, {
            method: 'POST',
        });
    }

    /**
     * Clear an alarm managed by the Notifications API (state back to `normal`).
     * Only allowed when the notification's `status.canClear` is true.
     * @param {string} notificationId - `id` field of the notification value
     */
    async clearNotification(notificationId) {
        if (!notificationId) {
            throw new Error('Notification id required');
        }
        return this.apiCall(`/signalk/v2/api/notifications/${encodeURIComponent(notificationId)}`, {
            method: 'DELETE',
        });
    }

    /**
     * Raise a Person Overboard alarm. The server stamps the vessel position and
     * time, and emits it as `notifications.mob.<id>` with state `emergency`, so
     * every connected display (plotter, Freeboard, phones) sees it.
     * @param {string} [message] - defaults to the server's "Person Overboard!"
     * @returns {Promise<string>} id of the new notification
     */
    async raiseMob(message) {
        const result = await this.apiCall('/signalk/v2/api/notifications/mob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message ? { message } : {}),
        });
        return result?.id;
    }

    // ==========================================
    // FEATURES (server capability discovery)
    // ==========================================

    /**
     * What the server provides, from `/signalk/v2/features?enabled=1`:
     * `apis` lists the v2 REST APIs mounted by the server (a mounted API may
     * still lack a provider, e.g. weather), `plugins` the enabled plugins.
     *
     * Cached per server URL. A server that predates the endpoint yields empty
     * lists (also cached); an unreachable one yields null and is retried on the
     * next call.
     * @returns {Promise<{apis: string[], plugins: Array<{id: string, version: string}>}|null>}
     */
    async getFeatures() {
        const baseUrl = this.getBaseUrl();
        if (this.featuresCache?.baseUrl === baseUrl) {
            return this.featuresCache.promise;
        }

        const promise = this.apiCall('/signalk/v2/features?enabled=1')
            .then((result) => ({
                apis: Array.isArray(result?.apis) ? result.apis : [],
                plugins: Array.isArray(result?.plugins) ? result.plugins : [],
            }))
            .catch((error) => {
                if (error.status === 404) {
                    return { apis: [], plugins: [] };
                }
                // Network/auth trouble: don't remember it, the next call retries
                if (this.featuresCache?.promise === promise) {
                    this.featuresCache = null;
                }
                return null;
            });

        this.featuresCache = { baseUrl, promise };
        return promise;
    }

    /**
     * Check if the weather API is available on the SignalK server
     * @returns {Promise<boolean>} True if weather API is available
     */
    async checkWeatherApiAvailability() {
        try {
            // Try to access the weather API endpoint
            const response = await fetch(`${this.getBaseUrl()}/signalk/v2/api/weather`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            this.weatherApiAvailable = response.ok;
            return this.weatherApiAvailable;
        } catch (error) {
            if (error.name !== 'TypeError' || (error.message !== 'Failed to fetch' && !error.message.includes('NetworkError'))) {
                console.warn('SignalKService: Weather API check failed:', error.message);
            }
            this.weatherApiAvailable = false;
            return false;
        }
    }

    /**
     * Check if weather API is available (cached result)
     * @returns {boolean|null} True if available, false if not, null if not checked
     */
    isWeatherApiAvailable() {
        return this.weatherApiAvailable;
    }

    /**
     * Get hourly weather forecast for a specific position
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {number} count - Number of forecast periods (default 48 for 2 days)
     * @returns {Promise<Object>} Weather forecast data
     */
    async getWeatherForecast(latitude, longitude, count = 48) {
        if (this.weatherApiAvailable === false) {
            throw new Error('Weather API is not available');
        }

        if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
            throw new Error('Position is required for weather forecast');
        }

        const path = `/signalk/v2/api/weather/forecasts/point?lat=${latitude}&lon=${longitude}&count=${count}`;
        return await this.apiCall(path);
    }

    /**
     * Get daily weather forecast (includes sunrise/sunset)
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {number} count - Number of days (default 7)
     * @returns {Promise<Object>} Daily weather forecast data
     */
    async getDailyWeatherForecast(latitude, longitude, count = 7) {
        if (this.weatherApiAvailable === false) {
            throw new Error('Weather API is not available');
        }

        if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
            throw new Error('Position is required for weather forecast');
        }

        const path = `/signalk/v2/api/weather/forecasts/daily?lat=${latitude}&lon=${longitude}&count=${count}`;
        return await this.apiCall(path);
    }

    /**
     * Get current weather observations
     * @returns {Promise<Object>} Current weather data
     */
    async getCurrentWeather() {
        if (this.weatherApiAvailable === false) {
            throw new Error('Weather API is not available');
        }

        const path = '/signalk/v2/api/weather/observations';
        return await this.apiCall(path);
    }

    /**
     * Parse weather forecast data into a standardized format
     * Based on freeboard-sk weather-forecast-modal.ts
     * @param {Object} rawForecast - Raw forecast data from SignalK
     * @returns {Array<Object>} Parsed forecast array
     */
    parseWeatherForecast(rawForecast) {
        const forecasts = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        Object.values(rawForecast).forEach((v) => {
            const forecast = {
                description: v.description || '',
                date: v.date || null,
                time: '',
                temperature: null,
                temperatureMin: null,
                temperatureMax: null,
                dewPoint: null,
                humidity: null,
                pressure: null,
                rain: null,
                uvIndex: null,
                clouds: null,
                visibility: null,
                wind: {
                    speed: null,
                    direction: null,
                    gust: null
                }
            };

            // Parse time
            if (v.date) {
                const d = new Date(v.date);
                forecast.time = `${dayNames[d.getDay()]} ${d.getHours()}:${('00' + d.getMinutes()).slice(-2)}`;
            }

            // Parse temperature (Kelvin to Celsius)
            if (typeof v.outside?.temperature !== 'undefined') {
                forecast.temperature = this.kelvinToCelsius(v.outside.temperature);
            }
            if (typeof v.outside?.minTemperature !== 'undefined') {
                forecast.temperatureMin = this.kelvinToCelsius(v.outside.minTemperature);
            }
            if (typeof v.outside?.maxTemperature !== 'undefined') {
                forecast.temperatureMax = this.kelvinToCelsius(v.outside.maxTemperature);
            }
            if (typeof v.outside?.dewPointTemperature !== 'undefined') {
                forecast.dewPoint = this.kelvinToCelsius(v.outside.dewPointTemperature);
            }

            // Parse other values
            // Ratio 0-1 per the spec; tolerate providers sending percent. Absolute
            // humidity (kg/m³) is a different quantity and must not stand in for it.
            if (typeof v.outside?.relativeHumidity === 'number') {
                const rh = v.outside.relativeHumidity;
                forecast.humidity = rh > 1 ? rh / 100 : rh;
            }
            if (typeof v.outside?.pressure !== 'undefined') {
                forecast.pressure = Math.round(v.outside.pressure);
            }
            if (typeof v.outside?.uvIndex !== 'undefined') {
                forecast.uvIndex = v.outside.uvIndex;
            }
            if (typeof v.outside?.cloudCover !== 'undefined') {
                forecast.clouds = v.outside.cloudCover;
            } else if (typeof v.outside?.clouds !== 'undefined') {
                forecast.clouds = v.outside.clouds;
            }
            if (typeof v.outside?.horizontalVisibility !== 'undefined') {
                forecast.visibility = v.outside.horizontalVisibility;
            } else if (typeof v.outside?.visibility !== 'undefined') {
                forecast.visibility = v.outside.visibility;
            }
            if (typeof v.outside?.precipitationVolume !== 'undefined') {
                forecast.rain = v.outside.precipitationVolume * 1000; // Convert to mm
            }

            // Parse wind data
            if (typeof v.wind !== 'undefined') {
                if (typeof v.wind.speedTrue !== 'undefined') {
                    forecast.wind.speed = this.msToKnots(v.wind.speedTrue);
                }
                if (typeof v.wind.gust !== 'undefined') {
                    forecast.wind.gust = this.msToKnots(v.wind.gust);
                }
                if (typeof v.wind.directionTrue !== 'undefined') {
                    forecast.wind.direction = this.radiansToDegrees(v.wind.directionTrue);
                }
            }

            forecasts.push(forecast);
        });

        return forecasts;
    }

    /**
     * Convert Kelvin to Celsius
     * @param {number} kelvin - Temperature in Kelvin
     * @returns {number} Temperature in Celsius
     */
    kelvinToCelsius(kelvin) {
        return _kelvinToCelsius(kelvin);
    }

    /**
     * Convert m/s to knots
     * @param {number} ms - Speed in m/s
     * @returns {number} Speed in knots
     */
    msToKnots(ms) {
        return _msToKnots(ms);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    radiansToDegrees(radians) {
        return _radiansToDegrees(radians);
    }

    /**
     * Login to SignalK server and get authentication token
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<string>} Authentication token
     */
    async login(username, password) {
        const baseUrl = this.getBaseUrl();

        try {
            const response = await fetch(`${baseUrl}/signalk/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.authToken = data.token;
            return this.authToken;
        } catch (error) {
            if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
                const networkError = new Error(`SignalK server unreachable at ${baseUrl}`);
                networkError.name = 'NetworkError';
                throw networkError;
            }
            console.error('SignalKService: Login failed:', error);
            throw error;
        }
    }

    /**
     * Check if currently logged in
     * @returns {Promise<boolean>} True if logged in
     */
    async isLoggedIn() {
        try {
            const response = await fetch(`${this.getBaseUrl()}/signalk/v1/auth/user`, {
                headers: this.getAuthHeaders()
            });
            return response.ok;
        } catch (error) {
            if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
                return false;
            }
            return false;
        }
    }

    // ==========================================
    // RESOURCES API - Routes, Waypoints, Charts
    // ==========================================

    /**
     * Standard resource types supported by SignalK Resources API
     */
    static RESOURCE_TYPES = ['routes', 'waypoints', 'notes', 'regions', 'charts'];

    /**
     * List all resources of a specific type
     * @param {string} resourceType - Type of resource ('routes', 'waypoints', 'notes', 'regions', 'charts')
     * @param {Object} params - Query parameters for filtering
     * @returns {Promise<Object>} Map of resource id to resource data
     */
    async listResources(resourceType, params = {}) {
        if (!SignalKService.RESOURCE_TYPES.includes(resourceType)) {
            throw new Error(`Invalid resource type: ${resourceType}`);
        }

        let path = `/signalk/v2/api/resources/${resourceType}`;
        
        // Add query parameters if provided
        const queryParams = new URLSearchParams();
        if (params.bbox) {
            queryParams.append('bbox', params.bbox);
        }
        if (params.distance) {
            queryParams.append('distance', params.distance);
        }
        if (params.position) {
            queryParams.append('position', params.position);
        }
        
        const queryString = queryParams.toString();
        if (queryString) {
            path += `?${queryString}`;
        }

        return await this.apiCall(path);
    }

    /**
     * Get a specific resource by ID
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - Resource ID
     * @returns {Promise<Object>} Resource data
     */
    async getResource(resourceType, resourceId) {
        if (!SignalKService.RESOURCE_TYPES.includes(resourceType)) {
            throw new Error(`Invalid resource type: ${resourceType}`);
        }

        const path = `/signalk/v2/api/resources/${resourceType}/${encodeURIComponent(resourceId)}`;
        return await this.apiCall(path);
    }

    /**
     * Create or update a resource
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - Resource ID (use UUID format)
     * @param {Object} resourceData - Resource data
     * @returns {Promise<Object>} Created/updated resource
     */
    async setResource(resourceType, resourceId, resourceData) {
        if (!SignalKService.RESOURCE_TYPES.includes(resourceType)) {
            throw new Error(`Invalid resource type: ${resourceType}`);
        }

        const path = `/signalk/v2/api/resources/${resourceType}/${encodeURIComponent(resourceId)}`;
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify(resourceData)
        });
    }

    /**
     * Delete a resource
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - Resource ID
     * @returns {Promise<void>}
     */
    async deleteResource(resourceType, resourceId) {
        if (!SignalKService.RESOURCE_TYPES.includes(resourceType)) {
            throw new Error(`Invalid resource type: ${resourceType}`);
        }
        // Through apiCall: credentials, timeout and server error messages
        await this.apiCall(`/signalk/v2/api/resources/${resourceType}/${encodeURIComponent(resourceId)}`, {
            method: 'DELETE'
        });
    }

    // ==========================================
    // ROUTES
    // ==========================================

    /**
     * Get all routes
     * @param {Object} params - Query parameters (bbox, distance, position)
     * @returns {Promise<Object>} Map of route id to route data
     */
    async getRoutes(params = {}) {
        return await this.listResources('routes', params);
    }

    /**
     * Get a specific route
     * @param {string} routeId - Route ID
     * @returns {Promise<Object>} Route data with feature (GeoJSON LineString)
     */
    async getRoute(routeId) {
        return await this.getResource('routes', routeId);
    }

    /**
     * Create or update a route
     * @param {string} routeId - Route ID
     * @param {Object} routeData - Route data (name, description, feature)
     * @returns {Promise<Object>}
     */
    async saveRoute(routeId, routeData) {
        return await this.setResource('routes', routeId, routeData);
    }

    /**
     * Delete a route
     * @param {string} routeId - Route ID
     * @returns {Promise<void>}
     */
    async deleteRoute(routeId) {
        return await this.deleteResource('routes', routeId);
    }

    // ==========================================
    // WAYPOINTS
    // ==========================================

    /**
     * Get all waypoints
     * @param {Object} params - Query parameters (bbox, distance, position)
     * @returns {Promise<Object>} Map of waypoint id to waypoint data
     */
    async getWaypoints(params = {}) {
        return await this.listResources('waypoints', params);
    }

    /**
     * Get a specific waypoint
     * @param {string} waypointId - Waypoint ID
     * @returns {Promise<Object>} Waypoint data with feature (GeoJSON Point)
     */
    async getWaypoint(waypointId) {
        return await this.getResource('waypoints', waypointId);
    }

    /**
     * Create or update a waypoint
     * @param {string} waypointId - Waypoint ID
     * @param {Object} waypointData - Waypoint data (name, description, feature, type)
     * @returns {Promise<Object>}
     */
    async saveWaypoint(waypointId, waypointData) {
        return await this.setResource('waypoints', waypointId, waypointData);
    }

    /**
     * Delete a waypoint
     * @param {string} waypointId - Waypoint ID
     * @returns {Promise<void>}
     */
    async deleteWaypoint(waypointId) {
        return await this.deleteResource('waypoints', waypointId);
    }

    // ==========================================
    // CHARTS
    // ==========================================

    /**
     * Get all charts
     * @returns {Promise<Object>} Map of chart id to chart data
     */
    async getCharts() {
        return await this.listResources('charts');
    }

    /**
     * Get a specific chart
     * @param {string} chartId - Chart ID
     * @returns {Promise<Object>} Chart data
     */
    async getChart(chartId) {
        return await this.getResource('charts', chartId);
    }

    // ==========================================
    // NOTES
    // ==========================================

    /**
     * Get all notes
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Map of note id to note data
     */
    async getNotes(params = {}) {
        return await this.listResources('notes', params);
    }

    /**
     * Get a specific note
     * @param {string} noteId - Note ID
     * @returns {Promise<Object>} Note data
     */
    async getNote(noteId) {
        return await this.getResource('notes', noteId);
    }

    /**
     * Create or update a note
     * @param {string} noteId - Note ID
     * @param {Object} noteData - Note data
     * @returns {Promise<Object>}
     */
    async saveNote(noteId, noteData) {
        return await this.setResource('notes', noteId, noteData);
    }

    /**
     * Delete a note
     * @param {string} noteId - Note ID
     * @returns {Promise<void>}
     */
    async deleteNote(noteId) {
        return await this.deleteResource('notes', noteId);
    }

    // ==========================================
    // REGIONS
    // ==========================================

    /**
     * Get all regions
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Map of region id to region data
     */
    async getRegions(params = {}) {
        return await this.listResources('regions', params);
    }

    /**
     * Get a specific region
     * @param {string} regionId - Region ID
     * @returns {Promise<Object>} Region data (GeoJSON Polygon/MultiPolygon)
     */
    async getRegion(regionId) {
        return await this.getResource('regions', regionId);
    }

    // ==========================================
    // COURSE API - Navigation Course
    // ==========================================

    /**
     * Get current course data
     * @returns {Promise<Object>} Current course information
     */
    async getCourse() {
        const path = '/signalk/v2/api/vessels/self/navigation/course';
        return await this.apiCall(path);
    }

    /**
     * Get course calculated values (from Course Provider plugin)
     * Includes: crossTrackError, bearingTrue, distance, ETA, VMG, etc.
     * @returns {Promise<Object>} Calculated course values
     */
    async getCourseCalculations() {
        const path = '/signalk/v2/api/vessels/self/navigation/course/calcValues';
        return await this.apiCall(path);
    }

    /**
     * Set destination to a waypoint
     * @param {string} waypointId - Waypoint resource ID
     * @returns {Promise<Object>}
     */
    async setDestinationWaypoint(waypointId) {
        const path = '/signalk/v2/api/vessels/self/navigation/course/destination';
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({
                href: `/resources/waypoints/${waypointId}`
            })
        });
    }

    /**
     * Set destination to a specific position
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {Promise<Object>}
     */
    async setDestinationPosition(latitude, longitude) {
        const path = '/signalk/v2/api/vessels/self/navigation/course/destination';
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({
                position: {
                    latitude,
                    longitude
                }
            })
        });
    }

    /**
     * Activate a route for navigation
     * @param {string} routeId - Route resource ID
     * @param {number} pointIndex - Starting point index (default: 0)
     * @param {boolean} reverse - Navigate route in reverse (default: false)
     * @returns {Promise<Object>}
     */
    async activateRoute(routeId, pointIndex = 0, reverse = false) {
        const path = '/signalk/v2/api/vessels/self/navigation/course/activeRoute';
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({
                href: `/resources/routes/${routeId}`,
                pointIndex,
                reverse
            })
        });
    }

    /**
     * Clear current destination/route
     * @returns {Promise<void>}
     */
    async clearCourse() {
        const path = '/signalk/v2/api/vessels/self/navigation/course';
        await this.apiCall(path, {
            method: 'DELETE'
        });
    }

    /**
     * Move along the active route by `steps` points (negative = back).
     * The Course API has a single endpoint for both directions.
     */
    async moveRoutePoint(steps) {
        return this.apiCall('/signalk/v2/api/vessels/self/navigation/course/activeRoute/nextPoint', {
            method: 'PUT',
            body: JSON.stringify({ value: steps })
        });
    }

    async nextWaypoint() {
        return this.moveRoutePoint(1);
    }

    // There is no activeRoute/previousPoint endpoint (it answered 404)
    async previousWaypoint() {
        return this.moveRoutePoint(-1);
    }

    /**
     * Set arrival circle radius
     * @param {number} radius - Radius in meters
     * @returns {Promise<Object>}
     */
    async setArrivalCircle(radius) {
        const path = '/signalk/v2/api/vessels/self/navigation/course/arrivalCircle';
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value: radius })
        });
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Generate a UUID for new resources
     * @returns {string} UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create a GeoJSON Point feature for a waypoint
     * @param {number} longitude - Longitude
     * @param {number} latitude - Latitude
     * @param {string} name - Waypoint name
     * @param {string} description - Waypoint description
     * @returns {Object} Waypoint resource object
     */
    createWaypointFeature(longitude, latitude, name, description = '') {
        return {
            name,
            description,
            feature: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                properties: {}
            }
        };
    }

    /**
     * Create a GeoJSON LineString feature for a route
     * @param {Array<Array<number>>} coordinates - Array of [longitude, latitude] pairs
     * @param {string} name - Route name
     * @param {string} description - Route description
     * @returns {Object} Route resource object
     */
    createRouteFeature(coordinates, name, description = '') {
        return {
            name,
            description,
            feature: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates
                },
                properties: {}
            }
        };
    }

    /**
     * Parse route coordinates from a route resource
     * @param {Object} route - Route resource object
     * @returns {Array<Object>} Array of {latitude, longitude} objects
     */
    parseRouteCoordinates(route) {
        if (!route?.feature?.geometry?.coordinates) {
            return [];
        }

        return route.feature.geometry.coordinates.map(coord => ({
            longitude: coord[0],
            latitude: coord[1]
        }));
    }

    /**
     * Parse waypoint position from a waypoint resource
     * @param {Object} waypoint - Waypoint resource object
     * @returns {Object|null} {latitude, longitude} or null
     */
    parseWaypointPosition(waypoint) {
        if (!waypoint?.feature?.geometry?.coordinates) {
            return null;
        }

        const coords = waypoint.feature.geometry.coordinates;
        return {
            longitude: coords[0],
            latitude: coords[1]
        };
    }

    // ==========================================
    // AUTOPILOT API
    // ==========================================

    // States and modes are device specific (pypilot: enabled/disabled,
    // Raymarine: auto/standby/wind/route...): the valid values are the ones the
    // device lists in `options`, so the server — not this client — validates them.

    autopilotPath(deviceId = '_default', suffix = '') {
        return `/signalk/v2/api/vessels/self/autopilots/${encodeURIComponent(deviceId)}${suffix}`;
    }

    /**
     * Get list of available autopilot devices
     * @returns {Promise<Array<string>>} List of autopilot device IDs
     */
    async getAutopilotDevices() {
        try {
            const data = await this.apiCall('/signalk/v2/api/vessels/self/autopilots');
            return Object.keys(data || {});
        } catch (error) {
            console.warn('SignalKService: Could not fetch autopilot devices:', error.message);
            return [];
        }
    }

    /**
     * Get autopilot status for a device
     * @param {string} deviceId - Autopilot device ID ('_default' = primary pilot)
     * @returns {Promise<{options:{states?:Array, state?:Array, modes?:Array, mode?:Array, actions?:Array},
     *                    state:string, mode:string, target:number, engaged:boolean}>}
     */
    async getAutopilotData(deviceId = '_default') {
        return this.apiCall(this.autopilotPath(deviceId));
    }

    /**
     * Set autopilot state (one of the device's `options` states)
     */
    async setAutopilotState(state, deviceId = '_default') {
        if (typeof state !== 'string' || !state) throw new Error(`Invalid autopilot state: ${state}`);
        return this.apiCall(this.autopilotPath(deviceId, '/state'), {
            method: 'PUT',
            body: JSON.stringify({ value: state })
        });
    }

    /**
     * Set autopilot mode (one of the device's `options` modes)
     */
    async setAutopilotMode(mode, deviceId = '_default') {
        if (typeof mode !== 'string' || !mode) throw new Error(`Invalid autopilot mode: ${mode}`);
        return this.apiCall(this.autopilotPath(deviceId, '/mode'), {
            method: 'PUT',
            body: JSON.stringify({ value: mode })
        });
    }

    /**
     * Set autopilot target heading/angle
     * @param {number} target - Target in radians
     */
    async setAutopilotTarget(target, deviceId = '_default') {
        return this.apiCall(this.autopilotPath(deviceId, '/target'), {
            method: 'PUT',
            body: JSON.stringify({ value: target })
        });
    }

    /**
     * Adjust autopilot target by a delta
     * @param {number} deltaDegrees - Adjustment in degrees (positive = starboard)
     */
    async adjustAutopilotTarget(deltaDegrees, deviceId = '_default') {
        return this.apiCall(this.autopilotPath(deviceId, '/target/adjust'), {
            method: 'PUT',
            body: JSON.stringify({ value: deltaDegrees, units: 'deg' })
        });
    }

    async engageAutopilot(deviceId = '_default') {
        return this.apiCall(this.autopilotPath(deviceId, '/engage'), { method: 'POST' });
    }

    async disengageAutopilot(deviceId = '_default') {
        return this.apiCall(this.autopilotPath(deviceId, '/disengage'), { method: 'POST' });
    }

    /**
     * Tack or gybe
     * @param {'tack'|'gybe'} maneuver
     * @param {'port'|'starboard'} direction
     */
    async autopilotManeuver(maneuver, direction, deviceId = '_default') {
        if (maneuver !== 'tack' && maneuver !== 'gybe') throw new Error(`Invalid maneuver: ${maneuver}`);
        if (direction !== 'port' && direction !== 'starboard') throw new Error(`Invalid direction: ${direction}`);
        return this.apiCall(this.autopilotPath(deviceId, `/${maneuver}/${direction}`), { method: 'POST' });
    }

    async autopilotTack(direction, deviceId = '_default') {
        return this.autopilotManeuver('tack', direction, deviceId);
    }

    async autopilotGybe(direction, deviceId = '_default') {
        return this.autopilotManeuver('gybe', direction, deviceId);
    }

    /**
     * Dodge: enter at current course (no delta), steer by `deltaDegrees` while
     * dodging, or exit (`exit: true`) — POST / PUT / DELETE per the v2 API.
     */
    async autopilotDodge({ deltaDegrees = null, exit = false } = {}, deviceId = '_default') {
        const path = this.autopilotPath(deviceId, '/dodge');
        if (exit) return this.apiCall(path, { method: 'DELETE' });
        if (deltaDegrees === null) return this.apiCall(path, { method: 'POST' });
        return this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value: deltaDegrees, units: 'deg' })
        });
    }

    /**
     * Steer to the active course point, or advance to the next route point
     * @param {'courseCurrentPoint'|'courseNextPoint'} action
     */
    async autopilotCourseAction(action, deviceId = '_default') {
        if (action !== 'courseCurrentPoint' && action !== 'courseNextPoint') {
            throw new Error(`Invalid course action: ${action}`);
        }
        return this.apiCall(this.autopilotPath(deviceId, `/${action}`), { method: 'POST' });
    }

    /**
     * Check if autopilot API is available
     * @returns {Promise<boolean>}
     */
    async isAutopilotAvailable() {
        try {
            const devices = await this.getAutopilotDevices();
            return devices.length > 0;
        } catch (error) {
            return false;
        }
    }

    // ==========================================
    // TIDES API
    // ==========================================

    /**
     * Check if a tides plugin is available on the SignalK server.
     * Tries the signalk-tides plugin endpoint first, then falls back
     * to checking if tide data exists in the full data model.
     * @returns {Promise<boolean>} True if tide data is available
     */
    async checkTideApiAvailability() {
        if (this.isDemoSignalK()) {
            return false;
        }
        try {
            const response = await fetch(
                `${this.getBaseUrl()}/signalk/v1/api/vessels/self/environment/tide`,
                { method: 'GET', headers: this.getAuthHeaders() }
            );
            if (response.ok) {
                const data = await response.json();
                return data !== null && typeof data === 'object' && Object.keys(data).length > 0;
            }
            return false;
        } catch (error) {
            if (error.name !== 'TypeError' ||
                (error.message !== 'Failed to fetch' && !error.message.includes('NetworkError'))) {
                console.warn('SignalKService: Tide API check failed:', error.message);
            }
            return false;
        }
    }

    /**
     * Get current tide data from SignalK server.
     * Returns the environment.tide subtree which may contain:
     * heightHigh, heightLow, heightNow, timeLow, timeHigh, coeffNow
     * @returns {Promise<Object|null>} Tide data object or null
     */
    async getTideData() {
        if (this.isDemoSignalK()) {
            return null;
        }
        try {
            const path = '/signalk/v1/api/vessels/self/environment/tide';
            const data = await this.apiCall(path);
            return data;
        } catch (error) {
            console.warn('SignalKService: Could not fetch tide data:', error.message);
            return null;
        }
    }
}

// Singleton instance
const signalKService = new SignalKService();
export default signalKService;
