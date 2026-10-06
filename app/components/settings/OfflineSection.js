'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowDown, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSignalKPath } from '../hooks/useSignalK';
import { clearOfflineCache, offlineCacheSize, prefetchArea } from '../utils/offlineCache';
import { TERRARIUM, BATHY_ZOOM } from '../3dview/ocean/Seabed3D';
import { windFieldUrl } from '../3dview/meteo/windField';
import { prefetchSeamarks } from '../3dview/seamarks/seamarkData';
import configService from './ConfigService';
import { downloadBathymetry, getBathymetryStatus, isOcearoCoreEnabled } from '../utils/OcearoCoreUtils';

const NM = 1852;
const RADII_NM = [5, 10, 20];

/**
 * Offline data: download the bathymetry and the wind forecast around the
 * boat while there is internet (marina, 4G), for the 3D view to use at sea;
 * chart tiles viewed are kept as you go. Shows the progress and the space used.
 *
 * The SHOM surveys are kept by ocearo-core on the boat's server (shared by
 * every display): the same button asks it to fetch the models around the
 * boat, and their state is listed here.
 */
const OfflineSection = () => {
    const { t } = useTranslation();
    const position = useSignalKPath('navigation.position');
    const [radiusNm, setRadiusNm] = useState(10);
    const [progress, setProgress] = useState(null);
    const [size, setSize] = useState(null);

    const [shom, setShom] = useState(null);

    const refreshSize = useCallback(() => { offlineCacheSize().then(setSize).catch(() => {}); }, []);
    useEffect(() => { refreshSize(); }, [refreshSize]);

    const refreshShom = useCallback(() => {
        if (!isOcearoCoreEnabled()) return;
        getBathymetryStatus().then(setShom).catch(() => setShom(null));
    }, []);
    useEffect(() => { refreshShom(); }, [refreshShom]);
    // Follow the server's downloads while they run
    const shomBusy = shom?.jobs?.some(j => !['done', 'error'].includes(j.state));
    useEffect(() => {
        if (!shomBusy) return undefined;
        const id = setInterval(refreshShom, 2000);
        return () => clearInterval(id);
    }, [shomBusy, refreshShom]);

    const download = async () => {
        if (!Number.isFinite(position?.latitude)) return;
        const { latitude: lat, longitude: lon } = position;
        const radiusM = radiusNm * NM;
        setProgress({ done: 0, total: 0, failed: 0 });
        // SHOM surveys: downloaded by the boat's server, in the background
        if (shom) downloadBathymetry(lat, lon, radiusNm).then(refreshShom).catch(() => {});
        // Buoys and beacons (OpenSeaMap): one Overpass query for the whole area
        if (configService.get('showSeamarks3D') !== false && configService.get('seamarksOverpass') !== false) prefetchSeamarks(lat, lon, radiusM).catch(() => {});
        // Bathymetry (open data) and the wind forecast. The chart itself is not
        // bulk-downloaded: the OpenStreetMap and OpenSeaMap tile servers forbid
        // it. Chart tiles viewed are kept as you go; for full offline charts,
        // serve MBTiles through a Signal K chart provider (used automatically).
        const result = await prefetchArea({
            lat, lon, radiusM,
            layers: [{ template: TERRARIUM, zooms: [BATHY_ZOOM - 1, BATHY_ZOOM] }],
            urls: [windFieldUrl(Number(lat.toFixed(1)), Number(lon.toFixed(1)))],
            onProgress: (done, total, failed) => setProgress({ done, total, failed }),
        });
        setProgress({ ...result, finished: true });
        refreshSize();
    };

    const clear = async () => {
        await clearOfflineCache();
        setProgress(null);
        refreshSize();
    };

    const busy = progress && !progress.finished;
    return (
        <section className="tesla-card space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-label font-semibold uppercase tracking-widest text-hud-main/90">{t('offline.title')}</h2>
                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
            </div>
            <p className="text-caption text-hud-secondary max-w-prose">{t('offline.explain')}</p>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl bg-hud-bg p-1">
                    {RADII_NM.map(r => (
                        <button key={r} type="button" onClick={() => setRadiusNm(r)}
                            className={`px-3 py-1.5 rounded-lg text-caption font-semibold ${radiusNm === r ? 'bg-oBlue text-white' : 'text-hud-secondary'}`}>
                            {r} NM
                        </button>
                    ))}
                </div>
                <button type="button" onClick={download} disabled={busy || !Number.isFinite(position?.latitude)}
                    className="bg-oBlue hover:bg-oBlue/80 text-white px-4 py-2 rounded-xl text-caption font-semibold uppercase flex items-center gap-2 disabled:opacity-50">
                    <FontAwesomeIcon icon={faCloudArrowDown} />
                    {t('offline.download')}
                </button>
                <button type="button" onClick={clear} disabled={busy}
                    className="text-hud-secondary hover:text-hud-main px-3 py-2 rounded-xl text-caption font-semibold uppercase flex items-center gap-2 disabled:opacity-50">
                    <FontAwesomeIcon icon={faTrash} />
                    {t('offline.clear')}
                </button>
                {Number.isFinite(size) && (
                    <span className="text-caption text-hud-muted tabular-nums">{t('offline.used', { mb: (size / 1e6).toFixed(0) })}</span>
                )}
            </div>
            {shom && <ShomStatus shom={shom} t={t} />}
            {progress && (
                <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-hud-bg overflow-hidden">
                        <div className="h-full bg-oBlue transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                    </div>
                    <div className="text-caption text-hud-muted tabular-nums">
                        {progress.finished
                            ? t('offline.finished', { count: progress.done - progress.failed, failed: progress.failed })
                            : t('offline.progress', { done: progress.done, total: progress.total })}
                    </div>
                </div>
            )}
        </section>
    );
};

const jobLabel = (job, t) => {
    if (job.state === 'downloading' && job.total) return t('offline.shomDownloading', { pct: Math.round(job.received / job.total * 100) });
    return t(`offline.shom_${job.state}`, { error: job.error });
};

/** SHOM models on the boat's server, and those available around the boat */
const ShomStatus = ({ shom, t }) => {
    const jobs = new Map((shom.jobs || []).map(j => [j.id, j]));
    const rows = (shom.available || []).filter(d => d.kind === 'coastal' || d.installed);
    // Imported by hand or installed elsewhere: listed too
    for (const r of shom.regions || []) {
        if (!rows.some(d => d.id === r.id)) rows.push({ id: r.id, name: r.name, resolutionM: r.resolutionM, installed: true });
    }
    return (
        <div className="space-y-1.5">
            <div className="text-caption font-semibold text-hud-secondary">{t('offline.shomTitle')}</div>
            {rows.length === 0 && <div className="text-caption text-hud-muted">{t('offline.shomNone')}</div>}
            {rows.map((d) => {
                const job = jobs.get(d.id);
                const state = d.installed ? t('offline.shom_done') : job ? jobLabel(job, t) : t('offline.shomAvailable');
                return (
                    <div key={d.id} className="flex items-baseline justify-between gap-3 text-caption">
                        <span className="text-hud-main truncate">
                            {d.name}
                            {Number.isFinite(d.resolutionM) && <span className="text-hud-muted tabular-nums"> · {d.resolutionM} m</span>}
                        </span>
                        <span className={`shrink-0 tabular-nums ${d.installed ? 'text-oGreen' : job?.state === 'error' ? 'text-oRed' : 'text-hud-muted'}`}>{state}</span>
                    </div>
                );
            })}
            {shom.sevenZip === null && <div className="text-caption text-oYellow">{t('offline.shomNo7z')}</div>}
            <div className="text-caption text-hud-muted">{t('offline.shomCredit')}</div>
        </div>
    );
};

export default OfflineSection;
