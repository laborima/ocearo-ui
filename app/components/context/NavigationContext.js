/**
 * NavigationContext - Centralized navigation resources and course management
 * 
 * This context provides:
 * - Routes and waypoints from SignalK Resources API
 * - Active course and destination management
 * - Course calculations (XTE, bearing, distance, ETA, VMG)
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import signalKService from '../services/SignalKService';
import { useOcearoContext } from './OcearoContext';
import { useSignalKPath } from '../hooks/useSignalK';

const NavigationContext = createContext();

/**
 * Refresh interval for course calculations (5 seconds)
 */
const COURSE_REFRESH_INTERVAL = 5000;

/**
 * Refresh interval for resources (5 minutes)
 */
const RESOURCES_REFRESH_INTERVAL = 5 * 60 * 1000;

export const NavigationContextProvider = ({ children }) => {
    // Subscribe to boat position for internal calculations
    const myPosition = useSignalKPath('navigation.position');
    
    // Resources state
    const [routes, setRoutes] = useState({});
    const [waypoints, setWaypoints] = useState({});
    const [charts, setCharts] = useState({});
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [resourcesError, setResourcesError] = useState(null);
    
    // Course state
    const [activeCourse, setActiveCourse] = useState(null);
    const [courseCalculations, setCourseCalculations] = useState(null);
    const [isLoadingCourse, setIsLoadingCourse] = useState(false);
    const [courseError, setCourseError] = useState(null);
    
    // Refs for intervals
    const courseIntervalRef = useRef(null);
    const resourcesIntervalRef = useRef(null);

    // ==========================================
    // RESOURCES FETCHING
    // ==========================================

    /**
     * Fetch all navigation resources (routes, waypoints, charts)
     */
    const fetchResources = useCallback(async () => {
        setIsLoadingResources(true);
        setResourcesError(null);

        try {
            const [routesData, waypointsData, chartsData] = await Promise.all([
                signalKService.getRoutes().catch(error => {
                    if (error.name !== 'NetworkError') {
                        console.error('NavigationContext: Failed to fetch routes:', error);
                    }
                    return {};
                }),
                signalKService.getWaypoints().catch(error => {
                    if (error.name !== 'NetworkError') {
                        console.error('NavigationContext: Failed to fetch waypoints:', error);
                    }
                    return {};
                }),
                signalKService.getCharts().catch(error => {
                    if (error.name !== 'NetworkError') {
                        console.error('NavigationContext: Failed to fetch charts:', error);
                    }
                    return {};
                })
            ]);

            setRoutes(routesData || {});
            setWaypoints(waypointsData || {});
            setCharts(chartsData || {});
        } catch (error) {
            if (error.name !== 'NetworkError') {
                console.error('NavigationContext: Failed to fetch resources:', error);
                setResourcesError(error.message);
            }
        } finally {
            setIsLoadingResources(false);
        }
    }, []);

    /**
     * Fetch only routes
     */
    const fetchRoutes = useCallback(async () => {
        try {
            const routesData = await signalKService.getRoutes();
            setRoutes(routesData || {});
            return routesData;
        } catch (error) {
            console.error('NavigationContext: Failed to fetch routes:', error);
            throw error;
        }
    }, []);

    /**
     * Fetch only waypoints
     */
    const fetchWaypoints = useCallback(async () => {
        try {
            const waypointsData = await signalKService.getWaypoints();
            setWaypoints(waypointsData || {});
            return waypointsData;
        } catch (error) {
            console.error('NavigationContext: Failed to fetch waypoints:', error);
            throw error;
        }
    }, []);

    // ==========================================
    // COURSE MANAGEMENT
    // ==========================================

    /**
     * Fetch current course and calculations
     */
    const fetchCourse = useCallback(async () => {
        try {
            const [courseData, calcData] = await Promise.all([
                signalKService.getCourse().catch(() => null),
                signalKService.getCourseCalculations().catch(() => null)
            ]);

            setActiveCourse(courseData);
            setCourseCalculations(calcData);
        } catch (error) {
            console.error('NavigationContext: Failed to fetch course:', error);
            setCourseError(error.message);
        }
    }, []);

    /**
     * Set destination to a waypoint
     * @param {string} waypointId - Waypoint ID
     */
    const navigateToWaypoint = useCallback(async (waypointId) => {
        setIsLoadingCourse(true);
        setCourseError(null);

        try {
            await signalKService.setDestinationWaypoint(waypointId);
            await fetchCourse();
        } catch (error) {
            console.error('NavigationContext: Failed to set waypoint destination:', error);
            setCourseError(error.message);
            throw error;
        } finally {
            setIsLoadingCourse(false);
        }
    }, [fetchCourse]);

    /**
     * Set destination to a position
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     */
    const navigateToPosition = useCallback(async (latitude, longitude) => {
        setIsLoadingCourse(true);
        setCourseError(null);

        try {
            await signalKService.setDestinationPosition(latitude, longitude);
            await fetchCourse();
        } catch (error) {
            console.error('NavigationContext: Failed to set position destination:', error);
            setCourseError(error.message);
            throw error;
        } finally {
            setIsLoadingCourse(false);
        }
    }, [fetchCourse]);

    /**
     * Activate a route for navigation
     * @param {string} routeId - Route ID
     * @param {number} pointIndex - Starting point index
     * @param {boolean} reverse - Navigate in reverse
     */
    const activateRoute = useCallback(async (routeId, pointIndex = 0, reverse = false) => {
        setIsLoadingCourse(true);
        setCourseError(null);

        try {
            await signalKService.activateRoute(routeId, pointIndex, reverse);
            await fetchCourse();
        } catch (error) {
            console.error('NavigationContext: Failed to activate route:', error);
            setCourseError(error.message);
            throw error;
        } finally {
            setIsLoadingCourse(false);
        }
    }, [fetchCourse]);

    /**
     * Clear current course/destination
     */
    const clearCourse = useCallback(async () => {
        setIsLoadingCourse(true);
        setCourseError(null);

        try {
            await signalKService.clearCourse();
            setActiveCourse(null);
            setCourseCalculations(null);
        } catch (error) {
            console.error('NavigationContext: Failed to clear course:', error);
            setCourseError(error.message);
            throw error;
        } finally {
            setIsLoadingCourse(false);
        }
    }, []);

    /**
     * Advance to next waypoint in route
     */
    const goToNextWaypoint = useCallback(async () => {
        try {
            await signalKService.nextWaypoint();
            await fetchCourse();
        } catch (error) {
            console.error('NavigationContext: Failed to go to next waypoint:', error);
            throw error;
        }
    }, [fetchCourse]);

    /**
     * Go back to previous waypoint in route
     */
    const goToPreviousWaypoint = useCallback(async () => {
        try {
            await signalKService.previousWaypoint();
            await fetchCourse();
        } catch (error) {
            console.error('NavigationContext: Failed to go to previous waypoint:', error);
            throw error;
        }
    }, [fetchCourse]);

    // ==========================================
    // WAYPOINT MANAGEMENT
    // ==========================================

    /**
     * Create a new waypoint
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {string} name - Waypoint name
     * @param {string} description - Waypoint description
     * @returns {Promise<string>} Created waypoint ID
     */
    const createWaypoint = useCallback(async (latitude, longitude, name, description = '') => {
        try {
            const waypointId = signalKService.generateUUID();
            const waypointData = signalKService.createWaypointFeature(longitude, latitude, name, description);
            await signalKService.saveWaypoint(waypointId, waypointData);
            await fetchWaypoints();
            return waypointId;
        } catch (error) {
            console.error('NavigationContext: Failed to create waypoint:', error);
            throw error;
        }
    }, [fetchWaypoints]);

    /**
     * Delete a waypoint
     * @param {string} waypointId - Waypoint ID
     */
    const deleteWaypoint = useCallback(async (waypointId) => {
        try {
            await signalKService.deleteWaypoint(waypointId);
            await fetchWaypoints();
        } catch (error) {
            console.error('NavigationContext: Failed to delete waypoint:', error);
            throw error;
        }
    }, [fetchWaypoints]);

    // ==========================================
    // ROUTE MANAGEMENT
    // ==========================================

    /**
     * Create a new route
     * @param {Array<{latitude: number, longitude: number}>} points - Route points
     * @param {string} name - Route name
     * @param {string} description - Route description
     * @returns {Promise<string>} Created route ID
     */
    const createRoute = useCallback(async (points, name, description = '') => {
        try {
            const routeId = signalKService.generateUUID();
            const coordinates = points.map(p => [p.longitude, p.latitude]);
            const routeData = signalKService.createRouteFeature(coordinates, name, description);
            await signalKService.saveRoute(routeId, routeData);
            await fetchRoutes();
            return routeId;
        } catch (error) {
            console.error('NavigationContext: Failed to create route:', error);
            throw error;
        }
    }, [fetchRoutes]);

    /**
     * Delete a route
     * @param {string} routeId - Route ID
     */
    const deleteRoute = useCallback(async (routeId) => {
        try {
            await signalKService.deleteRoute(routeId);
            await fetchRoutes();
        } catch (error) {
            console.error('NavigationContext: Failed to delete route:', error);
            throw error;
        }
    }, [fetchRoutes]);

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Get route as array of coordinates
     * @param {string} routeId - Route ID
     * @returns {Array<{latitude: number, longitude: number}>}
     */
    const getRouteCoordinates = useCallback((routeId) => {
        const route = routes[routeId];
        if (!route) return [];
        return signalKService.parseRouteCoordinates(route);
    }, [routes]);

    /**
     * Get waypoint position
     * @param {string} waypointId - Waypoint ID
     * @returns {{latitude: number, longitude: number}|null}
     */
    const getWaypointPosition = useCallback((waypointId) => {
        const waypoint = waypoints[waypointId];
        if (!waypoint) return null;
        return signalKService.parseWaypointPosition(waypoint);
    }, [waypoints]);

    /**
     * Get list of routes as array
     * @returns {Array<{id: string, name: string, description: string}>}
     */
    const getRoutesList = useCallback(() => {
        return Object.entries(routes).map(([id, route]) => ({
            id,
            name: route.name || 'Unnamed Route',
            description: route.description || '',
            pointCount: route.feature?.geometry?.coordinates?.length || 0
        }));
    }, [routes]);

    /**
     * Get list of waypoints as array
     * @returns {Array<{id: string, name: string, latitude: number, longitude: number}>}
     */
    const getWaypointsList = useCallback(() => {
        return Object.entries(waypoints).map(([id, waypoint]) => {
            const position = signalKService.parseWaypointPosition(waypoint);
            return {
                id,
                name: waypoint.name || 'Unnamed Waypoint',
                description: waypoint.description || '',
                latitude: position?.latitude,
                longitude: position?.longitude
            };
        });
    }, [waypoints]);

    /**
     * Check if there is an active destination
     * @returns {boolean}
     */
    const hasActiveDestination = useCallback(() => {
        return activeCourse?.nextPoint?.position != null || 
               activeCourse?.activeRoute?.href != null;
    }, [activeCourse]);

    /**
     * Get current destination info
     * @returns {Object|null}
     */
    const getDestinationInfo = useCallback(() => {
        if (!activeCourse) return null;

        return {
            position: activeCourse.nextPoint?.position,
            waypointHref: activeCourse.nextPoint?.href,
            routeHref: activeCourse.activeRoute?.href,
            pointIndex: activeCourse.activeRoute?.pointIndex,
            isRoute: !!activeCourse.activeRoute?.href,
            arrivalCircle: activeCourse.arrivalCircle
        };
    }, [activeCourse]);

    // ==========================================
    // INITIALIZATION
    // ==========================================

    useEffect(() => {
        // Initial fetch
        fetchResources();
        fetchCourse();

        // Set up periodic refresh for course calculations
        courseIntervalRef.current = setInterval(() => {
            fetchCourse();
        }, COURSE_REFRESH_INTERVAL);

        // Set up periodic refresh for resources
        resourcesIntervalRef.current = setInterval(() => {
            fetchResources();
        }, RESOURCES_REFRESH_INTERVAL);

        return () => {
            if (courseIntervalRef.current) {
                clearInterval(courseIntervalRef.current);
            }
            if (resourcesIntervalRef.current) {
                clearInterval(resourcesIntervalRef.current);
            }
        };
    }, [fetchResources, fetchCourse]);

    const contextValue = {
        // Resources state
        routes,
        waypoints,
        charts,
        isLoadingResources,
        resourcesError,
        
        // Course state
        activeCourse,
        courseCalculations,
        isLoadingCourse,
        courseError,
        
        // Resource fetching
        fetchResources,
        fetchRoutes,
        fetchWaypoints,
        
        // Course management
        fetchCourse,
        navigateToWaypoint,
        navigateToPosition,
        activateRoute,
        clearCourse,
        goToNextWaypoint,
        goToPreviousWaypoint,
        
        // Waypoint management
        createWaypoint,
        deleteWaypoint,
        
        // Route management
        createRoute,
        deleteRoute,
        
        // Helpers
        getRouteCoordinates,
        getWaypointPosition,
        getRoutesList,
        getWaypointsList,
        hasActiveDestination,
        getDestinationInfo
    };

    return (
        <NavigationContext.Provider value={contextValue}>
            {children}
        </NavigationContext.Provider>
    );
};

/**
 * Hook to access navigation context
 * @returns {Object} Navigation context value
 */
export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationContextProvider');
    }
    return context;
};

export default NavigationContext;
