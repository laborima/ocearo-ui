import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { GUIDE_SECTIONS } from './guideSections';
import { LegendList } from '../3dview/hud/SceneLegend';
import configService from '../settings/ConfigService';

// Spots on the image edge would be cut in half
const clamp = (v) => Math.min(97, Math.max(3, v));

/** Numbered marker over the screenshot */
const Spot = ({ n, x, y, active, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={`${n}. ${label}`}
        aria-pressed={active}
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold leading-none shadow-soft transition-transform duration-200
            w-6 h-6 text-[11px] sm:w-7 sm:h-7 sm:text-xs ring-2 ring-white
            ${active ? 'bg-oYellow text-black scale-125 z-10' : 'bg-oBlue text-white hover:scale-110'}`}
        style={{ left: `${clamp(x)}%`, top: `${clamp(y)}%` }}
    >
        {active && <span className="absolute inset-0 rounded-full bg-oYellow animate-ping opacity-60" aria-hidden="true" />}
        <span className="relative">{n}</span>
    </button>
);

/** A screenshot with numbered spots, the selected one explained right below */
const AnnotatedShot = ({ section, base }) => {
    const { t } = useTranslation();
    const [active, setActive] = useState(0);
    const key = (spot, part) => `guide.${section.id}.spots.${spot.id}.${part}`;
    const current = section.spots[active];

    // The explanation shows under the image: the image stays in view
    const select = (i) => setActive(i);

    return (
        <>
            {/* At most 60 % of the screen high, so the explanation stays in view */}
            <figure className="relative w-full mx-auto rounded-xl overflow-visible bg-hud-elevated"
                style={{ maxWidth: 'calc(60vh * 16 / 9)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, plain files */}
                <img src={`${base}/${section.image}`} alt={t(`guide.${section.id}.title`)}
                    className="w-full h-auto rounded-xl block select-none" draggable={false} />
                {section.spots.map((spot, i) => (
                    <Spot key={spot.id} n={i + 1} x={spot.x} y={spot.y} active={i === active}
                        label={t(key(spot, 'title'))} onClick={() => select(i)} />
                ))}
            </figure>

            {/* The selected spot, under the image so a phone shows both */}
            <div className="mt-3 mx-auto rounded-xl border border-hud bg-hud-elevated px-4 py-3 flex items-start gap-3" style={{ maxWidth: 'calc(60vh * 16 / 9)' }} aria-live="polite">
                <span className="shrink-0 w-7 h-7 rounded-full bg-oYellow text-black text-xs font-bold flex items-center justify-center">{active + 1}</span>
                <div className="min-w-0 flex-1">
                    <div className="text-label font-semibold text-hud-main">{t(key(current, 'title'))}</div>
                    <p className="text-label text-hud-secondary mt-0.5">{t(key(current, 'text'))}</p>
                </div>
                <div className="shrink-0 flex gap-1">
                    <button type="button" onClick={() => select((active + section.spots.length - 1) % section.spots.length)}
                        aria-label={t('guide.previousSpot')} className="w-8 h-8 rounded-lg text-hud-secondary hover:text-hud-main tesla-hover">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button type="button" onClick={() => select((active + 1) % section.spots.length)}
                        aria-label={t('guide.nextSpot')} className="w-8 h-8 rounded-lg text-hud-secondary hover:text-hud-main tesla-hover">
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>

            {/* Every spot, readable without tapping */}
            <ol className="mt-4 grid gap-2 lg:grid-cols-2">
                {section.spots.map((spot, i) => (
                    <li key={spot.id}>
                        <button type="button" onClick={() => select(i)}
                            className={`w-full text-left flex items-start gap-3 rounded-xl px-3 py-2 transition-colors ${i === active ? 'bg-hud-elevated' : 'tesla-hover'}`}>
                            <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${i === active ? 'bg-oYellow text-black' : 'bg-oBlue text-white'}`}>{i + 1}</span>
                            <span className="min-w-0">
                                <span className="block text-label font-semibold text-hud-main">{t(key(spot, 'title'))}</span>
                                <span className="block text-label text-hud-secondary">{t(key(spot, 'text'))}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
        </>
    );
};

/** First steps: a numbered list, no screenshot */
const Steps = ({ section }) => {
    const { t } = useTranslation();
    return (
        <ol className="grid gap-3">
            {section.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3 rounded-xl bg-hud-elevated px-4 py-3">
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-oBlue text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="min-w-0">
                        <span className="block text-label font-semibold text-hud-main">{t(`guide.start.steps.${step}.title`)}</span>
                        <span className="block text-label text-hud-secondary">{t(`guide.start.steps.${step}.text`)}</span>
                    </span>
                </li>
            ))}
        </ol>
    );
};

/**
 * Interactive Ocearo guide (Help view): each screen as an annotated
 * screenshot, tap a number to read what it shows; the 3D legend at the end.
 */
const OcearoGuide = ({ base = './guide' }) => {
    const { t } = useTranslation();
    const [index, setIndex] = useState(() => {
        const saved = GUIDE_SECTIONS.findIndex(s => s.id === configService.get('guideSection'));
        return saved >= 0 ? saved : 0;
    });
    const scrollRef = useRef(null);
    const section = GUIDE_SECTIONS[index];

    useEffect(() => {
        configService.set('guideSection', section.id);
        scrollRef.current?.scrollTo({ top: 0 });
    }, [section.id]);

    const prev = GUIDE_SECTIONS[index - 1];
    const next = GUIDE_SECTIONS[index + 1];

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Sections */}
            <nav className="flex gap-1 px-2 py-2 border-b border-hud overflow-x-auto scrollbar-hide shrink-0" aria-label={t('guide.tab')}>
                {GUIDE_SECTIONS.map((s, i) => (
                    <button key={s.id} type="button" onClick={() => setIndex(i)}
                        aria-current={i === index}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${i === index ? 'bg-oBlue text-white' : 'text-hud-secondary tesla-hover'}`}>
                        {t(`guide.${s.id}.title`)}
                    </button>
                ))}
            </nav>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
                <article className="max-w-5xl mx-auto px-4 py-4">
                    <h2 className="text-value font-semibold text-hud-main">{t(`guide.${section.id}.title`)}</h2>
                    <p className="text-label text-hud-secondary mt-1 mb-4">{t(`guide.${section.id}.intro`)}</p>
                    {section.image && <AnnotatedShot key={section.id} section={section} base={base} />}
                    {section.steps && <Steps section={section} />}
                    {section.legend && (
                        <div className="rounded-xl bg-hud-elevated px-4 py-3">
                            <LegendList className="gap-2 text-label" />
                        </div>
                    )}

                    <div className="flex justify-between gap-2 mt-6">
                        {prev ? (
                            <button type="button" onClick={() => setIndex(index - 1)} className="px-3 py-2 rounded-xl text-label text-hud-secondary hover:text-hud-main tesla-hover">
                                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />{t(`guide.${prev.id}.title`)}
                            </button>
                        ) : <span />}
                        {next && (
                            <button type="button" onClick={() => setIndex(index + 1)} className="px-3 py-2 rounded-xl text-label font-semibold text-oBlue tesla-hover">
                                {t(`guide.${next.id}.title`)}<FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                            </button>
                        )}
                    </div>
                </article>
            </div>
        </div>
    );
};

export default OcearoGuide;
