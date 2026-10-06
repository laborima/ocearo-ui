import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faBookOpen, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import OcearoGuide from './OcearoGuide';

const GUIDE = { file: null, guide: true };

/**
 * Help view: the interactive Ocearo guide first, then the documents listed
 * in <path>/index.json (Signal K pages, PDF manuals) in a frame.
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
                        key={doc.file || 'guide'}
                        onClick={() => setSelected(doc)}
                        className={`flex-1 py-3 px-3 text-caption font-semibold uppercase flex items-center justify-center transition-all duration-500 whitespace-nowrap ${
                            selected.file === doc.file
                                ? 'text-oGreen border-b-2 border-oGreen bg-hud-bg'
                                : 'text-hud-secondary hover:text-hud-main tesla-hover'
                        }`}
                    >
                        <FontAwesomeIcon icon={doc.guide ? faBookOpen : faFileAlt} className="mr-2" />
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
                {failed && !selected.guide && (
                    <div className="text-label text-hud-secondary p-6 text-center">{t('manual.unavailable')}</div>
                )}
            </div>
        </div>
    );
};

export default HelpView;
