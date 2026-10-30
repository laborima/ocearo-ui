'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import configService from './ConfigService';
import { useSignalKPath } from '../hooks/useSignalK';
import Bomea from '../services/BomeaService';

const btn = 'px-4 py-3 rounded-xl text-label font-bold uppercase tracking-widest transition-colors disabled:opacity-40';
const primary = `${btn} bg-oBlue text-white hover:bg-oBlue/80`;
const tonal = `${btn} bg-hud-bg border border-hud text-hud-main tesla-hover`;

/**
 * Bomea, the free encyclopedia of boats with 3D models and owners' logbooks:
 * pick a boat model there for the 3D view, and connect the boat on board to
 * its Bomea logbook (voyages, fuel, engine hours, maintenance).
 */
const BomeaSection = ({ onBoatImported }) => {
    const { t } = useTranslation();
    const [connected, setConnected] = useState(() => Bomea.isConnected());
    const [account, setAccount] = useState(null);
    const [boats, setBoats] = useState([]);
    const [boatId, setBoatId] = useState(() => configService.get('bomeaBoatId') || '');
    const [q, setQ] = useState('');
    const [results, setResults] = useState(null);
    const [busy, setBusy] = useState('');
    const [msg, setMsg] = useState(null);
    const [url, setUrl] = useState(() => configService.get('bomeaUrl') || '');
    const mainRunTime = useSignalKPath('propulsion.main.runTime', null);
    const portRunTime = useSignalKPath('propulsion.port.runTime', null);
    const engineSeconds = mainRunTime ?? portRunTime;

    // The member and their boats; the only boat is linked straight away
    const fetchAccount = useCallback(() => Bomea.me().then((r) => {
        setAccount(r.account); setBoats(r.boats || []);
        if (!configService.get('bomeaBoatId') && r.boats?.length === 1) { configService.set('bomeaBoatId', r.boats[0].id); setBoatId(r.boats[0].id); }
    }).catch((e) => setMsg({ err: true, text: e.message })), []);
    const load = useCallback(() => {
        if (Bomea.isConnected()) return fetchAccount();
        setAccount(null); setBoats([]);
    }, [fetchAccount]);
    useEffect(() => {
        if (Bomea.isConnected()) fetchAccount();
        const on = () => { setConnected(Bomea.isConnected()); load(); };
        window.addEventListener('bomea-auth', on);
        return () => window.removeEventListener('bomea-auth', on);
    }, [load, fetchAccount]);

    const run = async (key, fn, ok) => {
        setBusy(key); setMsg(null);
        try { const r = await fn(); if (ok) setMsg({ text: ok(r) }); } catch (e) { setMsg({ err: true, text: e.message }); }
        setBusy('');
    };
    const search = (e) => { e?.preventDefault(); run('search', async () => setResults(await Bomea.searchModels(q))); };

    return (
        <section className="tesla-card space-y-6" id="bomea">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-label font-semibold uppercase tracking-widest text-hud-main/90">Bomea</h2>
                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
            </div>
            <p className="text-caption text-hud-muted">{t('bomea.intro')}</p>

            {/* The boat model for the 3D view */}
            <form className="space-y-2" onSubmit={search}>
                <label className="text-caption font-semibold uppercase tracking-widest text-hud-secondary ml-1" htmlFor="bomea-q">{t('bomea.findModel')}</label>
                <div className="flex gap-2">
                    <input id="bomea-q" className="flex-1 min-w-0 bg-hud-bg border border-hud rounded-xl p-3 text-hud-main focus:outline-none focus:border-oBlue/50"
                        value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('bomea.findPlaceholder')} />
                    <button className={primary} type="submit" disabled={busy === 'search'}>{t('bomea.search')}</button>
                </div>
            </form>
            {results && (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {results.length === 0 && <li className="text-caption text-hud-muted">{t('bomea.noResult')}</li>}
                    {results.map((m) => (
                        <li key={m.slug} className="p-3 rounded-xl bg-hud-bg border border-hud flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-label font-bold text-hud-main truncate">{m.name}</div>
                                <div className="text-caption text-hud-muted">
                                    {[m.builder, Array.isArray(m.years) ? m.years.filter(Boolean).join('–') : null, m.dimensions?.loa_m ? `${m.dimensions.loa_m} m` : null].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                            {m.model
                                ? <button className={tonal} disabled={!!busy} onClick={() => run(`imp-${m.slug}`, async () => { const b = await Bomea.importModel(m.slug); onBoatImported?.(b); return b; },
                                    (b) => t('bomea.imported', { name: b.name }))}>{busy === `imp-${m.slug}` ? '…' : t('bomea.use')}</button>
                                : <span className="text-caption text-hud-muted shrink-0">{t('bomea.no3d')}</span>}
                        </li>
                    ))}
                </ul>
            )}

            {/* The boat on board, linked to its Bomea logbook */}
            <div className="p-4 rounded-xl bg-oBlue/10 border border-oBlue/20 space-y-3">
                <div className="text-caption font-semibold uppercase tracking-widest text-oBlue">{t('bomea.myBoat')}</div>
                {!connected ? (<>
                    <p className="text-caption text-hud-secondary">{t('bomea.connectWhy')}</p>
                    <button className={primary} onClick={() => run('connect', () => Bomea.connect())}>{t('bomea.connect')}</button>
                </>) : (<>
                    <p className="text-caption text-hud-secondary">{account?.name ? t('bomea.connectedAs', { name: account.name }) : t('bomea.connected')}</p>
                    <select className="w-full bg-hud-bg border border-hud rounded-xl p-3 text-hud-main" value={boatId}
                        onChange={(e) => { setBoatId(e.target.value); configService.set('bomeaBoatId', e.target.value); }} aria-label={t('bomea.whichBoat')}>
                        <option value="">{t('bomea.whichBoat')}</option>
                        {boats.map((b) => <option key={b.id} value={b.id}>{b.name}{b.model ? ` · ${b.model.name}` : ''}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                        <button className={primary} disabled={!boatId || !!busy} onClick={() => run('sync', () => Bomea.syncNow({ engineSeconds }),
                            (r) => t('bomea.synced', { trips: r.trips, fuel: r.fuel }))}>{busy === 'sync' ? '…' : t('bomea.syncNow')}</button>
                        <button className={tonal} disabled={!boatId} onClick={() => Bomea.openInBomea()}>{t('bomea.openLogbook')}</button>
                        {boats.find((b) => b.id === boatId)?.model?.slug && (
                            <button className={tonal} disabled={!!busy} onClick={() => run('own', async () => { const b = await Bomea.importModel(boats.find((x) => x.id === boatId).model.slug); onBoatImported?.(b); return b; },
                                (b) => t('bomea.imported', { name: b.name }))}>{t('bomea.useMyModel')}</button>
                        )}
                        <button className={tonal} onClick={() => { Bomea.disconnect(); setConnected(false); }}>{t('bomea.disconnect')}</button>
                    </div>
                    {configService.get('bomeaLastSync') && <p className="text-caption text-hud-muted">{t('bomea.lastSync', { date: new Date(configService.get('bomeaLastSync')).toLocaleString() })}</p>}
                </>)}
            </div>
            {msg && <p role="status" className={`text-caption ${msg.err ? 'text-oRed' : 'text-oGreen'}`}>{msg.text}</p>}

            <details className="text-caption text-hud-muted">
                <summary className="cursor-pointer">{t('bomea.server')}</summary>
                <input className="mt-2 w-full bg-hud-bg border border-hud rounded-xl p-3 text-hud-main" value={url} placeholder="https://bomea.app"
                    onChange={(e) => setUrl(e.target.value)} onBlur={() => configService.set('bomeaUrl', url.trim())} aria-label={t('bomea.server')} />
            </details>
        </section>
    );
};

export default BomeaSection;
