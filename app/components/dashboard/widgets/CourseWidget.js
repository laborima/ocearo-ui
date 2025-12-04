'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useOcearoContext, toDegrees, toKnots } from '../../context/OcearoContext';
import { useNavigation } from '../../context/NavigationContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRoute, 
    faLocationDot, 
    faCompass, 
    faCrosshairs,
    faArrowRight,
    faArrowLeft,
    faTimes,
    faPlay,
    faList,
    faPlus,
    faClock,
    faRuler
} from '@fortawesome/free-solid-svg-icons';

/**
 * CourseWidget - Displays active course, waypoints and routes
 * Uses SignalK Resources API and Course API
 */
export default function CourseWidget() {
    const { getSignalKValue, nightMode } = useOcearoContext();
    const { 
        activeCourse,
        courseCalculations,
        waypoints,
        routes,
        isLoadingCourse,
        navigateToWaypoint,
        navigateToPosition,
        activateRoute,
        clearCourse,
        goToNextWaypoint,
        goToPreviousWaypoint,
        getWaypointsList,
        getRoutesList,
        hasActiveDestination
    } = useNavigation();
    
    const debugMode = configService.get('debugMode');
    const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
    const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
    const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
    const accentIconClass = nightMode ? 'text-oNight' : 'text-green-500';
    
    const [showWaypointList, setShowWaypointList] = useState(false);
    const [showRouteList, setShowRouteList] = useState(false);

    // Get course data from SignalK or calculations
    const courseData = React.useMemo(() => {
        // Try to get data from courseCalculations first (from Course Provider plugin)
        if (courseCalculations) {
            return {
                hasData: true,
                distance: courseCalculations.distance,
                bearingTrue: courseCalculations.bearingTrue,
                bearingMagnetic: courseCalculations.bearingMagnetic,
                crossTrackError: courseCalculations.crossTrackError,
                velocityMadeGood: courseCalculations.velocityMadeGood,
                timeToGo: courseCalculations.timeToGo,
                estimatedTimeOfArrival: courseCalculations.estimatedTimeOfArrival,
                calcMethod: courseCalculations.calcMethod
            };
        }

        // Fallback to SignalK delta values
        const distance = getSignalKValue('navigation.courseGreatCircle.nextPoint.distance');
        const bearingTrue = getSignalKValue('navigation.courseGreatCircle.nextPoint.bearingTrue');
        const xte = getSignalKValue('navigation.courseGreatCircle.crossTrackError');
        const vmg = getSignalKValue('navigation.courseGreatCircle.velocityMadeGood');

        const hasData = distance !== null || bearingTrue !== null;

        if (!hasData && !debugMode) {
            return { hasData: false };
        }

        return {
            hasData: true,
            distance: distance || (debugMode ? 5000 : null),
            bearingTrue: bearingTrue || (debugMode ? 0.52 : null),
            crossTrackError: xte || (debugMode ? 50 : null),
            velocityMadeGood: vmg || (debugMode ? 5.5 : null),
            timeToGo: null,
            estimatedTimeOfArrival: null
        };
    }, [courseCalculations, getSignalKValue, debugMode]);

    // Format distance
    const formatDistance = (meters) => {
        if (meters === null || meters === undefined) return 'N/A';
        if (meters < 1000) return `${Math.round(meters)} m`;
        const nm = meters / 1852;
        return `${nm.toFixed(2)} NM`;
    };

    // Format time
    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Format ETA
    const formatETA = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get destination name
    const getDestinationName = () => {
        if (!activeCourse) return 'No destination';
        
        if (activeCourse.activeRoute?.href) {
            const routeId = activeCourse.activeRoute.href.split('/').pop();
            const route = routes[routeId];
            const pointIndex = activeCourse.activeRoute.pointIndex || 0;
            return route?.name ? `${route.name} (${pointIndex + 1})` : 'Active Route';
        }
        
        if (activeCourse.nextPoint?.href) {
            const waypointId = activeCourse.nextPoint.href.split('/').pop();
            const waypoint = waypoints[waypointId];
            return waypoint?.name || 'Waypoint';
        }
        
        if (activeCourse.nextPoint?.position) {
            const pos = activeCourse.nextPoint.position;
            return `${pos.latitude?.toFixed(4)}°, ${pos.longitude?.toFixed(4)}°`;
        }
        
        return 'No destination';
    };

    // Handle waypoint selection
    const handleSelectWaypoint = async (waypointId) => {
        try {
            await navigateToWaypoint(waypointId);
            setShowWaypointList(false);
        } catch (error) {
            console.error('Failed to navigate to waypoint:', error);
        }
    };

    // Handle route activation
    const handleActivateRoute = async (routeId) => {
        try {
            await activateRoute(routeId);
            setShowRouteList(false);
        } catch (error) {
            console.error('Failed to activate route:', error);
        }
    };

    const waypointsList = getWaypointsList();
    const routesList = getRoutesList();
    const hasDestination = hasActiveDestination();

    // No data view
    if (!courseData.hasData && !hasDestination && waypointsList.length === 0 && routesList.length === 0) {
        return (
            <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
                <div className="flex items-center space-x-2 mb-4">
                    <FontAwesomeIcon icon={faRoute} className={`${accentIconClass} text-lg`} />
                    <span className={`${primaryTextClass} font-medium text-lg`}>Course</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faCompass} className="text-4xl text-gray-600 mb-2" />
                        <div className={`text-sm ${mutedTextClass}`}>No course data available</div>
                        <div className={`text-xs ${mutedTextClass} mt-1`}>Set a destination to start navigation</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faRoute} className={`${accentIconClass} text-lg`} />
                    <span className={`${primaryTextClass} font-medium text-lg`}>Course</span>
                </div>
                <div className="flex space-x-1">
                    {/* Waypoints button */}
                    <button
                        onClick={() => { setShowWaypointList(!showWaypointList); setShowRouteList(false); }}
                        className={`p-1.5 rounded ${showWaypointList ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        title="Waypoints"
                    >
                        <FontAwesomeIcon icon={faLocationDot} className="text-sm" />
                    </button>
                    {/* Routes button */}
                    <button
                        onClick={() => { setShowRouteList(!showRouteList); setShowWaypointList(false); }}
                        className={`p-1.5 rounded ${showRouteList ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        title="Routes"
                    >
                        <FontAwesomeIcon icon={faList} className="text-sm" />
                    </button>
                </div>
            </div>

            {/* Waypoint List */}
            {showWaypointList && (
                <div className="mb-4 max-h-32 overflow-y-auto bg-oGray rounded p-2">
                    <div className={`text-xs ${secondaryTextClass} mb-2`}>Select Waypoint:</div>
                    {waypointsList.length === 0 ? (
                        <div className={`text-xs ${mutedTextClass}`}>No waypoints available</div>
                    ) : (
                        waypointsList.map(wp => (
                            <button
                                key={wp.id}
                                onClick={() => handleSelectWaypoint(wp.id)}
                                className="w-full text-left p-1.5 hover:bg-gray-700 rounded text-sm text-white flex items-center"
                            >
                                <FontAwesomeIcon icon={faLocationDot} className="text-oYellow mr-2 text-xs" />
                                <span className="truncate">{wp.name}</span>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Route List */}
            {showRouteList && (
                <div className="mb-4 max-h-32 overflow-y-auto bg-oGray rounded p-2">
                    <div className={`text-xs ${secondaryTextClass} mb-2`}>Select Route:</div>
                    {routesList.length === 0 ? (
                        <div className={`text-xs ${mutedTextClass}`}>No routes available</div>
                    ) : (
                        routesList.map(route => (
                            <button
                                key={route.id}
                                onClick={() => handleActivateRoute(route.id)}
                                className="w-full text-left p-1.5 hover:bg-gray-700 rounded text-sm text-white flex items-center justify-between"
                            >
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faRoute} className="text-oGreen mr-2 text-xs" />
                                    <span className="truncate">{route.name}</span>
                                </div>
                                <span className={`text-xs ${mutedTextClass}`}>{route.pointCount} pts</span>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Active Destination */}
            {hasDestination && (
                <div className="bg-oGray rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faCrosshairs} className="text-oYellow text-sm" />
                            <span className={`${primaryTextClass} text-sm font-medium truncate`}>
                                {getDestinationName()}
                            </span>
                        </div>
                        <button
                            onClick={clearCourse}
                            className="text-oRed hover:text-red-400 p-1"
                            title="Clear destination"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                        </button>
                    </div>
                    
                    {/* Route navigation controls */}
                    {activeCourse?.activeRoute?.href && (
                        <div className="flex justify-center space-x-2 mt-2">
                            <button
                                onClick={goToPreviousWaypoint}
                                className="bg-oGray2 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs border border-gray-600"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                Prev
                            </button>
                            <button
                                onClick={goToNextWaypoint}
                                className="bg-oGray2 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs border border-gray-600"
                            >
                                Next
                                <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Course Data */}
            {courseData.hasData && (
                <div className="flex-1 grid grid-cols-2 gap-3">
                    {/* Distance */}
                    <div className="bg-oGray rounded-lg p-2 text-center">
                        <FontAwesomeIcon icon={faRuler} className={`${accentIconClass} text-sm mb-1`} />
                        <div className={`${primaryTextClass} text-lg font-bold`}>
                            {formatDistance(courseData.distance)}
                        </div>
                        <div className={`${secondaryTextClass} text-xs`}>Distance</div>
                    </div>

                    {/* Bearing */}
                    <div className="bg-oGray rounded-lg p-2 text-center">
                        <FontAwesomeIcon icon={faCompass} className={`${accentIconClass} text-sm mb-1`} />
                        <div className={`${primaryTextClass} text-lg font-bold`}>
                            {courseData.bearingTrue !== null ? `${toDegrees(courseData.bearingTrue)}°` : 'N/A'}
                        </div>
                        <div className={`${secondaryTextClass} text-xs`}>Bearing</div>
                    </div>

                    {/* XTE */}
                    <div className="bg-oGray rounded-lg p-2 text-center">
                        <FontAwesomeIcon icon={faArrowRight} className={`${
                            courseData.crossTrackError > 0 ? 'text-oRed' : 'text-oGreen'
                        } text-sm mb-1`} />
                        <div className={`${primaryTextClass} text-lg font-bold`}>
                            {courseData.crossTrackError !== null ? `${Math.abs(courseData.crossTrackError).toFixed(0)} m` : 'N/A'}
                        </div>
                        <div className={`${secondaryTextClass} text-xs`}>XTE</div>
                    </div>

                    {/* VMG */}
                    <div className="bg-oGray rounded-lg p-2 text-center">
                        <FontAwesomeIcon icon={faPlay} className={`text-oGreen text-sm mb-1`} />
                        <div className={`${primaryTextClass} text-lg font-bold`}>
                            {courseData.velocityMadeGood !== null ? `${toKnots(courseData.velocityMadeGood)} kts` : 'N/A'}
                        </div>
                        <div className={`${secondaryTextClass} text-xs`}>VMG</div>
                    </div>

                    {/* Time to Go */}
                    {courseData.timeToGo !== null && (
                        <div className="bg-oGray rounded-lg p-2 text-center">
                            <FontAwesomeIcon icon={faClock} className={`${accentIconClass} text-sm mb-1`} />
                            <div className={`${primaryTextClass} text-lg font-bold`}>
                                {formatTime(courseData.timeToGo)}
                            </div>
                            <div className={`${secondaryTextClass} text-xs`}>TTG</div>
                        </div>
                    )}

                    {/* ETA */}
                    {courseData.estimatedTimeOfArrival && (
                        <div className="bg-oGray rounded-lg p-2 text-center">
                            <FontAwesomeIcon icon={faClock} className={`text-oYellow text-sm mb-1`} />
                            <div className={`${primaryTextClass} text-lg font-bold`}>
                                {formatETA(courseData.estimatedTimeOfArrival)}
                            </div>
                            <div className={`${secondaryTextClass} text-xs`}>ETA</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
