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

class SignalKService {
    constructor() {
        this.client = null;
        this.authToken = null;
        this.weatherApiAvailable = null;
        this.connectionListeners = [];
        this.isConnected = false;
    }

    /**
     * Get SignalK client configuration from ConfigService
     * @returns {Object} Client configuration object
     */
    getClientConfig() {
        const config = configService.getAll();
        const signalkUrl = config.signalkUrl || configService.getComputedSignalKUrl();
        const [hostname, port] = signalkUrl.replace(/https?:\/\//, '').split(':');

        return {
            hostname: hostname || 'localhost',
            port: parseInt(port) || 3000,
            useTLS: signalkUrl.startsWith('https'),
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
        const config = configService.getAll();
        return config.signalkUrl || configService.getComputedSignalKUrl();
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

        try {
            const response = await fetch(url, {
                headers: { ...headers, ...options.headers },
                credentials: credentialsOption,
                ...options
            });

            if (!response.ok) {
                throw new Error(`SignalK API error (${response.status}): ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
                const networkError = new Error(`SignalK server unreachable at ${baseUrl}`);
                networkError.name = 'NetworkError';
                console.warn(`SignalKService: Server unreachable for ${path}:`, error.message);
                throw networkError;
            }
            if (error.message && (error.message.includes('(400)') || error.message.includes('(404)'))) {
                console.warn(`SignalKService: API call returned error for ${path}:`, error.message);
            } else {
                console.error(`SignalKService: API call failed for ${path}:`, error);
            }
            throw error;
        }
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
            if (typeof v.outside?.relativeHumidity !== 'undefined') {
                forecast.humidity = v.outside.relativeHumidity;
            } else if (typeof v.outside?.absoluteHumidity !== 'undefined') {
                forecast.humidity = v.outside.absoluteHumidity;
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

        const path = `/signalk/v2/api/resources/${resourceType}/${resourceId}`;
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

        const path = `/signalk/v2/api/resources/${resourceType}/${resourceId}`;
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

        const path = `/signalk/v2/api/resources/${resourceType}/${resourceId}`;
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}${path}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to delete resource: ${response.statusText}`);
        }
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
     * Advance to next waypoint in active route
     * @returns {Promise<Object>}
     */
    async nextWaypoint() {
        const path = '/signalk/v2/api/vessels/self/navigation/course/activeRoute/nextPoint';
        return await this.apiCall(path, {
            method: 'PUT'
        });
    }

    /**
     * Go back to previous waypoint in active route
     * @returns {Promise<Object>}
     */
    async previousWaypoint() {
        const path = '/signalk/v2/api/vessels/self/navigation/course/activeRoute/previousPoint';
        return await this.apiCall(path, {
            method: 'PUT'
        });
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

    /**
     * Autopilot states
     */
    static AUTOPILOT_STATES = ['enabled', 'disabled', 'standby', 'off-line'];

    /**
     * Autopilot modes
     */
    static AUTOPILOT_MODES = ['compass', 'gps', 'wind', 'route', 'dodge'];

    /**
     * Get list of available autopilot devices
     * @returns {Promise<Array<string>>} List of autopilot device IDs
     */
    async getAutopilotDevices() {
        const path = '/signalk/v2/api/vessels/self/steering/autopilot';
        try {
            const data = await this.apiCall(path);
            return Object.keys(data || {});
        } catch (error) {
            console.warn('SignalKService: Could not fetch autopilot devices:', error.message);
            return [];
        }
    }

    /**
     * Get autopilot data for a specific device
     * @param {string} deviceId - Autopilot device ID (optional, uses default if not specified)
     * @returns {Promise<Object>} Autopilot data (state, mode, target, engaged)
     */
    async getAutopilotData(deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}`;
        return await this.apiCall(path);
    }

    /**
     * Get autopilot state
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<string>} State ('enabled', 'disabled', 'standby', 'off-line')
     */
    async getAutopilotState(deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/state`;
        return await this.apiCall(path);
    }

    /**
     * Set autopilot state
     * @param {string} state - New state ('enabled', 'disabled', 'standby')
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async setAutopilotState(state, deviceId = 'default') {
        if (!SignalKService.AUTOPILOT_STATES.includes(state)) {
            throw new Error(`Invalid autopilot state: ${state}`);
        }

        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/state`;
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value: state })
        });
    }

    /**
     * Get autopilot mode
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<string>} Mode ('compass', 'gps', 'wind', 'route', 'dodge')
     */
    async getAutopilotMode(deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/mode`;
        return await this.apiCall(path);
    }

    /**
     * Set autopilot mode
     * @param {string} mode - New mode ('compass', 'gps', 'wind', 'route')
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async setAutopilotMode(mode, deviceId = 'default') {
        if (!SignalKService.AUTOPILOT_MODES.includes(mode)) {
            throw new Error(`Invalid autopilot mode: ${mode}`);
        }

        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/mode`;
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value: mode })
        });
    }

    /**
     * Get autopilot target heading/angle
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<number>} Target in radians
     */
    async getAutopilotTarget(deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/target`;
        return await this.apiCall(path);
    }

    /**
     * Set autopilot target heading/angle
     * @param {number} target - Target in radians
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async setAutopilotTarget(target, deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/target`;
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value: target })
        });
    }

    /**
     * Adjust autopilot target by a delta value
     * @param {number} delta - Adjustment in radians (positive = starboard, negative = port)
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async adjustAutopilotTarget(delta, deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/target/adjust`;
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value: delta })
        });
    }

    /**
     * Engage autopilot
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async engageAutopilot(deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/engage`;
        return await this.apiCall(path, {
            method: 'POST'
        });
    }

    /**
     * Disengage autopilot
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async disengageAutopilot(deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/disengage`;
        return await this.apiCall(path, {
            method: 'POST'
        });
    }

    /**
     * Execute tack maneuver
     * @param {string} direction - 'port' or 'starboard'
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async autopilotTack(direction, deviceId = 'default') {
        if (direction !== 'port' && direction !== 'starboard') {
            throw new Error(`Invalid tack direction: ${direction}`);
        }

        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/tack/${direction}`;
        return await this.apiCall(path, {
            method: 'POST'
        });
    }

    /**
     * Execute gybe maneuver
     * @param {string} direction - 'port' or 'starboard'
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async autopilotGybe(direction, deviceId = 'default') {
        if (direction !== 'port' && direction !== 'starboard') {
            throw new Error(`Invalid gybe direction: ${direction}`);
        }

        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/gybe/${direction}`;
        return await this.apiCall(path, {
            method: 'POST'
        });
    }

    /**
     * Enter/exit dodge mode
     * @param {number|null} value - Dodge angle in radians, or null to exit dodge mode
     * @param {string} deviceId - Autopilot device ID
     * @returns {Promise<Object>}
     */
    async autopilotDodge(value, deviceId = 'default') {
        const path = `/signalk/v2/api/vessels/self/steering/autopilot/${deviceId}/dodge`;
        return await this.apiCall(path, {
            method: 'PUT',
            body: JSON.stringify({ value })
        });
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
