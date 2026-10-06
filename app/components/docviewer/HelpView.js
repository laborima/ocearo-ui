import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faBookOpen, faArrowUpRightFromSquare, faGlobe } from '@fortawesome/free-solid-svg-icons';
import OcearoGuide from './OcearoGuide';

const GUIDE = { guide: true };
// A tab's identity: the guide, a file shipped in public/docs, or an online page
const idOf = (doc) => (doc.guide ? 'guide' : doc.file || doc.url);

/**
 * Help view: the interactive Ocearo guide first, then the documents listed
 * in <path>/index.json: files (Signal K pages, PDF manuals) shown in a
 * frame, and online manuals ({ url }) opened in a new tab, since their
 * sites refuse to be framed and need internet anyway.
 */
const HelpView = ({ path }) => {
    const [docs, setDocs] = useState([]);
    const [selected, setSelected] = useState(GUIDE);
    const [failed, setFailed] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const response = await fetch(`${path}/index.json`);
                if (!response.ok) throw new Error('Network response was not ok');
                setDocs(await response.json());
            } catch (error) {
                console.warn('Manuals: cannot list the documents:', error.message);
                setFailed(true);
            }
        };
        fetchDocs();
    }, [path]);

    const tabs = [{ ...GUIDE, title: t('guide.tab') }, ...docs];
    const url = selected.file ? `${path}/${selected.file}` : null;
    // Phone browsers do not show a PDF inside a page: offer to open it
    const isPdf = selected.file?.toLowerCase().endsWith('.pdf');

    return (
        <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
            <div className="flex border-b border-hud bg-hud-bg overflow-x-auto scrollbar-hide shrink-0">
                {tabs.map((doc) => (
                    <button
                        key={idOf(doc)}
                        onClick={() => setSelected(doc)}
                        className={`flex-1 py-3 px-3 text-caption font-semibold uppercase flex items-center justify-center transition-all duration-500 whitespace-nowrap ${
                            idOf(selected) === idOf(doc)
                                ? 'text-oGreen border-b-2 border-oGreen bg-hud-bg'
                                : 'text-hud-secondary hover:text-hud-main tesla-hover'
                        }`}
                    >
                        <FontAwesomeIcon icon={doc.guide ? faBookOpen : doc.url ? faGlobe : faFileAlt} className="mr-2" />
                        {doc.title}
                    </button>
                ))}
            </div>

            <div className="flex-grow min-h-0 bg-hud-bg text-hud-main flex flex-col">
                {selected.guide && <OcearoGuide />}
                {url && isPdf && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 self-end m-2 px-3 py-1.5 rounded-lg text-caption font-semibold uppercase tracking-wide text-oBlue tesla-hover">
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="mr-2" />
                        {t('manual.openNewTab')}
                    </a>
                )}
                {url && (
                    <iframe src={url} title={selected.title} className="flex-1 w-full border-0" />
                )}
                {selected.url && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <FontAwesomeIcon icon={faGlobe} className="text-4xl text-hud-muted" />
                        <div className="text-value font-semibold text-hud-main">{selected.title}</div>
                        <p className="text-label text-hud-secondary max-w-md">{t('manual.online')}</p>
                        <a href={selected.url} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-oBlue text-white text-label font-semibold">
                            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="mr-2" />
                            {t('manual.openNewTab')}
                        </a>
                    </div>
                )}
                {failed && !selected.guide && (
                    <div className="text-label text-hud-secondary p-6 text-center">{t('manual.unavailable')}</div>
                )}
            </div>
        </div>
    );
};

export default HelpView;
