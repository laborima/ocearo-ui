'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useNavigation } from '../../context/NavigationContext';
import { toDegrees, toKnots } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
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
    faClock,
    faRuler
} from '@fortawesome/free-solid-svg-icons';

/**
 * CourseWidget - Displays active course, waypoints and routes
 * Uses SignalK Resources API and Course API
 */
export default function CourseWidget() {
    const { 
        activeCourse,
        courseCalculations,
        waypoints,
        routes,
        isLoadingCourse,
        navigateToWaypoint,
        activateRoute,
        clearCourse,
        goToNextWaypoint,
        goToPreviousWaypoint,
        getWaypointsList,
        getRoutesList,
        hasActiveDestination
    } = useNavigation();
    
    const debugMode = configService.get('debugMode');
    
    // Use specialized hooks for better performance
    const skDistance = useSignalKPath('navigation.courseGreatCircle.nextPoint.distance');
    const skBearingTrue = useSignalKPath('navigation.courseGreatCircle.nextPoint.bearingTrue');
    const skXte = useSignalKPath('navigation.courseGreatCircle.crossTrackError');
    const skVmg = useSignalKPath('navigation.courseGreatCircle.velocityMadeGood');

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

        const hasData = skDistance !== null || skBearingTrue !== null;

        if (!hasData && !debugMode) {
            return { hasData: false };
        }

        return {
            hasData: true,
            distance: skDistance || (debugMode ? 5000 : null),
            bearingTrue: skBearingTrue || (debugMode ? 0.52 : null),
            crossTrackError: skXte || (debugMode ? 50 : null),
            velocityMadeGood: skVmg || (debugMode ? 5.5 : null),
            timeToGo: null,
            estimatedTimeOfArrival: null
        };
    }, [courseCalculations, skDistance, skBearingTrue, skXte, skVmg, debugMode]);

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

    return (
        <BaseWidget
            title="Course"
            icon={faRoute}
            iconColorClass="text-green-500"
            hasData={courseData.hasData || hasDestination || waypointsList.length > 0 || routesList.length > 0}
            noDataMessage="No course data available. Set a destination to start navigation."
        >
            {/* Header Actions */}
            <div className="absolute top-4 right-4 z-10 flex space-x-1">
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

            <div className="flex-1 flex flex-col min-h-0">
                {/* Waypoint List */}
                {showWaypointList && (
                    <div className="mb-4 max-h-32 overflow-y-auto bg-oGray rounded p-2">
                        <div className="text-xs text-gray-400 mb-2 uppercase">Select Waypoint:</div>
                        {waypointsList.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">No waypoints available</div>
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
                        <div className="text-xs text-gray-400 mb-2 uppercase">Select Route:</div>
                        {routesList.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">No routes available</div>
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
                                    <span className="text-xs text-gray-500">{route.pointCount} pts</span>
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
                                <span className="text-white text-sm font-medium truncate">
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
                    <div className="grid grid-cols-2 gap-3">
                        {/* Distance */}
                        <div className="bg-oGray rounded-lg p-2 text-center">
                            <FontAwesomeIcon icon={faRuler} className="text-green-500 text-sm mb-1" />
                            <div className="text-white text-lg font-bold">
                                {formatDistance(courseData.distance)}
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase">Distance</div>
                        </div>

                        {/* Bearing */}
                        <div className="bg-oGray rounded-lg p-2 text-center">
                            <FontAwesomeIcon icon={faCompass} className="text-green-500 text-sm mb-1" />
                            <div className="text-white text-lg font-bold">
                                {courseData.bearingTrue !== null ? `${toDegrees(courseData.bearingTrue)}°` : 'N/A'}
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase">Bearing</div>
                        </div>

                        {/* XTE */}
                        <div className="bg-oGray rounded-lg p-2 text-center">
                            <FontAwesomeIcon icon={faArrowRight} className={`${
                                courseData.crossTrackError > 0 ? 'text-oRed' : 'text-oGreen'
                            } text-sm mb-1`} />
                            <div className="text-white text-lg font-bold">
                                {courseData.crossTrackError !== null ? `${Math.abs(courseData.crossTrackError).toFixed(0)} m` : 'N/A'}
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase">XTE</div>
                        </div>

                        {/* VMG */}
                        <div className="bg-oGray rounded-lg p-2 text-center">
                            <FontAwesomeIcon icon={faPlay} className="text-oGreen text-sm mb-1" />
                            <div className="text-white text-lg font-bold">
                                {courseData.velocityMadeGood !== null ? `${toKnots(courseData.velocityMadeGood)} kts` : 'N/A'}
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase">VMG</div>
                        </div>

                        {/* Time to Go */}
                        {courseData.timeToGo !== null && (
                            <div className="bg-oGray rounded-lg p-2 text-center">
                                <FontAwesomeIcon icon={faClock} className="text-green-500 text-sm mb-1" />
                                <div className="text-white text-lg font-bold">
                                    {formatTime(courseData.timeToGo)}
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase">TTG</div>
                            </div>
                        )}

                        {/* ETA */}
                        {courseData.estimatedTimeOfArrival && (
                            <div className="bg-oGray rounded-lg p-2 text-center">
                                <FontAwesomeIcon icon={faClock} className="text-oYellow text-sm mb-1" />
                                <div className="text-white text-lg font-bold">
                                    {formatETA(courseData.estimatedTimeOfArrival)}
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase">ETA</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </BaseWidget>
    );
}
