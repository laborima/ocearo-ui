import React from 'react';

/**
 * Translucent HUD panel laid over the full-screen 3D view, Tesla style:
 * the scene stays visible through it.
 */
const GlassPanel = ({ title, right, className = '', children }) => (
    <div className={`rounded-2xl border border-hud bg-hud-bg backdrop-blur-md shadow-soft px-4 py-3 select-none ${className}`}>
        {(title || right) && (
            <div className="flex items-center justify-between mb-1">
                <span className="text-caption font-semibold uppercase tracking-widest text-hud-muted">{title}</span>
                {right}
            </div>
        )}
        {children}
    </div>
);

export default GlassPanel;
