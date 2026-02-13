'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useNavigation } from '../../context/NavigationContext';
import { toDegrees } from '../../context/OcearoContext';
import { convertSpeedUnit, getSpeedUnitLabel, convertDistanceUnit, getDistanceUnitLabel } from '../../utils/UnitConversions';
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
    faRuler,
    faRobot
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * CourseWidget - Displays active course, waypoints and routes
 * Uses SignalK Resources API and Course API
 */
export default function CourseWidget() {
    const { t } = useTranslation();
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

    // Autopilot data
    const autopilotState = useSignalKPath('steering.autopilot.state');
    const autopilotMode = useSignalKPath('steering.autopilot.mode');
    const autopilotTarget = useSignalKPath('steering.autopilot.target.headingTrue');

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
        if (meters === null || meters === undefined) return t('common.na');
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${convertDistanceUnit(meters)} ${getDistanceUnitLabel()}`;
    };

    // Format time
    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return t('common.na');
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Format ETA
    const formatETA = (isoString) => {
        if (!isoString) return t('common.na');
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get destination name
    const getDestinationName = () => {
        if (!activeCourse) return t('widgets.noDestination');
        
        if (activeCourse.activeRoute?.href) {
            const routeId = activeCourse.activeRoute.href.split('/').pop();
            const route = routes[routeId];
            const pointIndex = activeCourse.activeRoute.pointIndex || 0;
            return route?.name ? `${route.name} (${pointIndex + 1})` : t('widgets.activeRoute');
        }
        
        if (activeCourse.nextPoint?.href) {
            const waypointId = activeCourse.nextPoint.href.split('/').pop();
            const waypoint = waypoints[waypointId];
            return waypoint?.name || t('widgets.waypoint');
        }
        
        if (activeCourse.nextPoint?.position) {
            const pos = activeCourse.nextPoint.position;
            return `${pos.latitude?.toFixed(4)}°, ${pos.longitude?.toFixed(4)}°`;
        }
        
        return t('widgets.noDestination');
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
            title={t('widgets.course')}
            icon={faRoute}
            iconColorClass="text-green-500"
            hasData={courseData.hasData || hasDestination || waypointsList.length > 0 || routesList.length > 0}
            noDataMessage={t('widgets.noCourseData')}
        >
            {/* Header Actions */}
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
                {/* Waypoints button */}
                <button
                    onClick={() => { setShowWaypointList(!showWaypointList); setShowRouteList(false); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-soft ${showWaypointList ? 'bg-oGreen text-hud-main' : 'bg-hud-elevated text-hud-secondary tesla-hover'}`}
                    title={t('widgets.waypoints')}
                >
                    <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                </button>
                {/* Routes button */}
                <button
                    onClick={() => { setShowRouteList(!showRouteList); setShowWaypointList(false); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-soft ${showRouteList ? 'bg-oGreen text-hud-main' : 'bg-hud-elevated text-hud-secondary tesla-hover'}`}
                    title={t('widgets.routes')}
                >
                    <FontAwesomeIcon icon={faList} className="text-xs" />
                </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {/* Waypoint List */}
                {showWaypointList && (
                    <div className="mb-4 max-h-40 overflow-y-auto tesla-card bg-hud-bg p-2 space-y-1">
                        <div className="text-xs text-hud-muted mb-2 uppercase font-black tracking-[0.2em] px-2 pt-1">{t('widgets.storedWaypoints')}</div>
                        {waypointsList.length === 0 ? (
                            <div className="text-xs text-hud-secondary italic px-2 py-4 text-center font-black uppercase">{t('widgets.noActiveNodes')}</div>
                        ) : (
                            waypointsList.map(wp => (
                                <button
                                    key={wp.id}
                                    onClick={() => handleSelectWaypoint(wp.id)}
                                    className="w-full text-left p-2 tesla-hover rounded-sm text-xs text-hud-main flex items-center group font-black uppercase tracking-tight"
                                >
                                    <FontAwesomeIcon icon={faLocationDot} className="text-oYellow mr-3 text-xs opacity-50 group-hover:opacity-100" />
                                    <span className="truncate">{wp.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Route List */}
                {showRouteList && (
                    <div className="mb-4 max-h-40 overflow-y-auto tesla-card bg-hud-bg p-2 space-y-1">
                        <div className="text-xs text-hud-muted mb-2 uppercase font-black tracking-[0.2em] px-2 pt-1">{t('widgets.missionRoutes')}</div>
                        {routesList.length === 0 ? (
                            <div className="text-xs text-hud-secondary italic px-2 py-4 text-center font-black uppercase">{t('widgets.noRoutesLoaded')}</div>
                        ) : (
                            routesList.map(route => (
                                <button
                                    key={route.id}
                                    onClick={() => handleActivateRoute(route.id)}
                                    className="w-full text-left p-2 tesla-hover rounded-sm text-xs text-hud-main flex items-center justify-between group font-black uppercase tracking-tight"
                                >
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faRoute} className="text-oGreen mr-3 text-xs opacity-50 group-hover:opacity-100" />
                                        <span className="truncate">{route.name}</span>
                                    </div>
                                    <span className="text-xs text-hud-muted font-black">{route.pointCount} pts</span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Active Destination */}
                {hasDestination && (
                    <div className="tesla-card bg-oYellow/5 p-4 mb-6 shadow-subtle border-l-2 border-oYellow/30 animate-soft-pulse">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <FontAwesomeIcon icon={faCrosshairs} className="text-oYellow text-sm" />
                                <span className="text-hud-main text-xs font-black uppercase tracking-widest truncate">
                                    {getDestinationName()}
                                </span>
                            </div>
                            <button
                                onClick={clearCourse}
                                className="text-hud-secondary hover:text-oRed transition-colors p-1"
                                title={t('widgets.abortNavigation')}
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>
                        
                        {/* Route navigation controls */}
                        {activeCourse?.activeRoute?.href && (
                            <div className="flex justify-center space-x-3 mt-4">
                                <button
                                    onClick={goToPreviousWaypoint}
                                    className="bg-hud-elevated hover:bg-hud-bg text-hud-main px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all shadow-soft"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                                    {t('widgets.previous')}
                                </button>
                                <button
                                    onClick={goToNextWaypoint}
                                    className="bg-oBlue hover:bg-blue-600 text-hud-main px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-oBlue/20"
                                >
                                    {t('widgets.proceed')}
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Autopilot Status */}
                {autopilotState && (
                    <div className={`tesla-card px-3 py-2 mb-3 bg-hud-bg flex items-center justify-between ${autopilotState === 'enabled' ? 'border-l-2 border-oGreen/30' : ''}`}>
                        <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faRobot} className={`text-xs ${autopilotState === 'enabled' ? 'text-oGreen' : 'text-hud-muted'}`} />
                            <span className={`text-xs font-black uppercase capitalize gliding-value ${autopilotState === 'enabled' ? 'text-oGreen' : 'text-hud-secondary'}`}>
                                {autopilotState}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs font-black uppercase">
                            <span className="text-hud-main capitalize gliding-value">{autopilotMode || '—'}</span>
                            <span className="text-oYellow gliding-value">
                                {autopilotTarget !== null ? `${Math.round(toDegrees(autopilotTarget))}°` : '—'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Course Data */}
                {courseData.hasData && (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Distance */}
                        <div className="tesla-card p-4 text-center tesla-hover bg-hud-bg">
                            <FontAwesomeIcon icon={faRuler} className="text-oGreen text-xs mb-2 opacity-50" />
                            <div className="text-hud-main text-2xl font-black gliding-value tracking-tighter">
                                {formatDistance(courseData.distance)}
                            </div>
                            <div className="text-hud-secondary text-xs uppercase font-black mt-2 tracking-[0.2em]">{t('widgets.distance')}</div>
                        </div>

                        {/* Bearing */}
                        <div className="tesla-card p-4 text-center tesla-hover bg-hud-bg">
                            <FontAwesomeIcon icon={faCompass} className="text-oBlue text-xs mb-2 opacity-50" />
                            <div className="text-hud-main text-2xl font-black gliding-value tracking-tighter">
                                {courseData.bearingTrue !== null ? `${Math.round(toDegrees(courseData.bearingTrue))}°` : t('common.na')}
                            </div>
                            <div className="text-hud-secondary text-xs uppercase font-black mt-2 tracking-[0.2em]">{t('widgets.bearing')}</div>
                        </div>

                        {/* XTE */}
                        <div className="tesla-card p-4 text-center tesla-hover bg-hud-bg">
                            <FontAwesomeIcon icon={faArrowRight} className={`${
                                courseData.crossTrackError > 50 || courseData.crossTrackError < -50 ? 'text-oRed animate-soft-pulse' : 'text-oGreen opacity-50'
                            } text-xs mb-2`} />
                            <div className="text-hud-main text-2xl font-black gliding-value tracking-tighter">
                                {courseData.crossTrackError !== null ? `${Math.abs(Math.round(courseData.crossTrackError))}m` : t('common.na')}
                            </div>
                            <div className="text-hud-secondary text-xs uppercase font-black mt-2 tracking-[0.2em]">XTE</div>
                        </div>

                        {/* VMG */}
                        <div className="tesla-card p-4 text-center tesla-hover bg-hud-bg">
                            <FontAwesomeIcon icon={faPlay} className="text-oGreen text-xs mb-2 opacity-50" />
                            <div className="text-hud-main text-2xl font-black gliding-value tracking-tighter">
                                {courseData.velocityMadeGood !== null ? `${convertSpeedUnit(courseData.velocityMadeGood)}` : t('common.na')}
                                <span className="text-xs text-hud-secondary ml-1">{getSpeedUnitLabel()}</span>
                            </div>
                            <div className="text-hud-secondary text-xs uppercase font-black mt-2 tracking-[0.2em]">VMG</div>
                        </div>

                        {/* Time to Go */}
                        {courseData.timeToGo !== null && (
                            <div className="tesla-card p-4 text-center tesla-hover bg-hud-bg">
                                <FontAwesomeIcon icon={faClock} className="text-oGreen text-xs mb-2 opacity-50" />
                                <div className="text-hud-main text-2xl font-black gliding-value tracking-tighter">
                                    {formatTime(courseData.timeToGo)}
                                </div>
                                <div className="text-hud-secondary text-xs uppercase font-black mt-2 tracking-[0.2em]">TTG</div>
                            </div>
                        )}

                        {/* ETA */}
                        {courseData.estimatedTimeOfArrival && (
                            <div className="tesla-card p-4 text-center tesla-hover bg-hud-bg">
                                <FontAwesomeIcon icon={faClock} className="text-oYellow text-xs mb-2 opacity-50" />
                                <div className="text-hud-main text-2xl font-black gliding-value tracking-tighter">
                                    {formatETA(courseData.estimatedTimeOfArrival)}
                                </div>
                                <div className="text-hud-secondary text-xs uppercase font-black mt-2 tracking-[0.2em]">ETA</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </BaseWidget>
    );
}
