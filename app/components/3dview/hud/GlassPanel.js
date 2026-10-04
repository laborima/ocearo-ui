import React from 'react';

/**
 * HUD block laid over the full-screen 3D view: no background or frame, the
 * scene shows through; a halo keeps text and lines readable.
 */
const GlassPanel = ({ title, right, className = '', children }) => (
    <div className={`hud-halo px-1 py-1 select-none ${className}`}>
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
