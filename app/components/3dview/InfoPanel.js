import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const InfoPanel = ({ content, onClose }) => {
    if (!content) return null;

    const contentLines = content.split('\n').filter(line => line.trim());

    return (
        <div className="tesla-card p-4 min-w-[180px] max-w-[240px] bg-hud-bg/90 backdrop-blur-xl border border-hud shadow-2xl rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-hud-muted">VESSEL</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-hud-elevated text-hud-muted hover:text-hud-main hover:bg-oRed/20 transition-all"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                </button>
            </div>
            <div className="space-y-1.5">
                {contentLines.map((line, index) => {
                    const colonIdx = line.indexOf(':');
                    const label = colonIdx !== -1 ? line.substring(0, colonIdx).trim() : null;
                    const value = colonIdx !== -1 ? line.substring(colonIdx + 1).trim() : line.trim();

                    return (
                        <div key={index} className="flex items-baseline justify-between gap-3">
                            {label && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-hud-muted whitespace-nowrap">
                                    {label}
                                </span>
                            )}
                            <span className="text-xs font-black text-hud-main truncate text-right">
                                {value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InfoPanel;
