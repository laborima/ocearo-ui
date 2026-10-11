'use client';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrosshairs, faLocationDot, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import signalKService from '../../services/SignalKService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { coursePaths, courseValue } from '../../utils/coursePaths';
import en from '../../../i18n/locales/en.json';
import fr from '../../../i18n/locales/fr.json';
import { getViewState, subscribeView, requestRecenter, setPlacingWaypoint, setViewMessage } from './viewStore';

const MESSAGE_MS = 6000;
const COURSE_PATHS = coursePaths('distance');
// Waypoints the 3D view created carry this description (in either language):
// clearing the destination deletes them, others (Freeboard, routes) are kept
const PICKED = new Set([en.waypointPicker.description, fr.waypointPicker.description]);

/** Stop navigating, and delete the waypoint if the 3D view had placed it */
const clearDestination = async () => {
    const course = await signalKService.getCourse().catch(() => null);
    await signalKService.clearCourse();
    const href = course?.nextPoint?.href || '';
    const match = href.match(/^\/resources\/waypoints\/(.+)$/);
    if (!match) return;
    // From the list: resources-provider 1.5 answers 404 to a single waypoint
    // it lists (and deletes) fine
    const all = await signalKService.apiCall('/signalk/v2/api/resources/waypoints').catch(() => null);
    const waypoint = all?.[match[1]];
    if (waypoint && PICKED.has(waypoint.description)) await signalKService.deleteResource('waypoints', match[1]);
};

/**
 * Buttons under the scene zoom: set the destination by tapping the sea,
 * clear the active destination, and recenter on the boat (shown once the
 * view has been moved).
 *
 * @param {{ canPlace: boolean }} props  false in the anchor and docking views
 */
const ViewButtons = ({ canPlace }) => {
    const { t } = useTranslation();
    const { moved, placingWaypoint, message } = useSyncExternalStore(subscribeView, getViewState, getViewState);
    const course = useSignalKPaths(COURSE_PATHS);
    const distance = courseValue(course, 'distance');
    // Hidden right after clearing, until the server's course values change
    const [clearedAt, setClearedAt] = useState(null);
    const hasDestination = Number.isFinite(distance) && distance !== clearedAt;
    const [clearing, setClearing] = useState(false);
    const clear = async () => {
        setClearing(true);
        try {
            await clearDestination();
            setClearedAt(distance);
            setViewMessage(t('waypointPicker.cleared'));
        } catch (error) {
            setViewMessage(t('waypointPicker.clearFailed', { error: error.message }));
        } finally {
            setClearing(false);
        }
    };

    useEffect(() => {
        if (!message) return undefined;
        const id = setTimeout(() => setViewMessage(null), MESSAGE_MS);
        return () => clearTimeout(id);
    }, [message]);
    // Leaving the navigation view ends the picking mode
    useEffect(() => { if (!canPlace && placingWaypoint) setPlacingWaypoint(false); }, [canPlace, placingWaypoint]);

    const button = 'w-11 h-11 flex items-center justify-center rounded-xl bg-hud-bg/70 backdrop-blur-sm text-hud-main hover:bg-hud-elevated/60';

    return (
        <div className="flex flex-col items-end gap-2">
            {canPlace && (
                <button type="button" onClick={() => setPlacingWaypoint(!placingWaypoint)}
                    className={`${button} ${placingWaypoint ? '!bg-oBlue text-white' : ''}`}
                    title={t('waypointPicker.button')} aria-label={t('waypointPicker.button')} aria-pressed={placingWaypoint}>
                    <FontAwesomeIcon icon={faLocationDot} />
                </button>
            )}
            {hasDestination && (
                <button type="button" onClick={clear} disabled={clearing} className={`${button} disabled:opacity-40`}
                    title={t('waypointPicker.clear')} aria-label={t('waypointPicker.clear')}>
                    <FontAwesomeIcon icon={faTrashCan} />
                </button>
            )}
            {moved && (
                <button type="button" onClick={requestRecenter} className={button}
                    title={t('viewButtons.recenter')} aria-label={t('viewButtons.recenter')}>
                    <FontAwesomeIcon icon={faCrosshairs} />
                </button>
            )}
            {(placingWaypoint || message) && (
                <div className="max-w-[16rem] rounded-xl bg-hud-bg/80 backdrop-blur-sm px-3 py-2 text-caption text-hud-main text-right">
                    {message || t('waypointPicker.hint')}
                </div>
            )}
        </div>
    );
};

export default ViewButtons;
