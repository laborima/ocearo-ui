import React from 'react';

const InfoPanel = ({ content }) => {
    if (!content) return null;

    // Split content by newlines and create separate elements for each line
    const contentLines = content.split('\n').map((line, index) => {
        const [label, value] = line.includes(':') ? line.split(':') : [null, line];
        
        return (
            <div key={index} className="flex flex-col items-end mb-3 last:mb-0">
                {label && (
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-hud-muted leading-none mb-1">
                        {label.trim()}
                    </span>
                )}
                <span className="text-sm font-bold tracking-tight text-hud-main/90">
                    {value.trim()}
                </span>
            </div>
        );
    });

    return (
        <div className="tesla-card p-4 min-w-[200px] max-w-[300px] text-right bg-hud-bg backdrop-blur-xl border border-hud shadow-2xl rounded-2xl">
            {contentLines}
        </div>
    );
};

export default InfoPanel;
