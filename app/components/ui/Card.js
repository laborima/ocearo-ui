'use client';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Card — the single card of the UI (style in globals.css `.tesla-card`).
 * A card inside a card renders as a flat tile automatically.
 *
 * @param {string} [title] - uppercase caption in the header
 * @param {Object|React.ReactNode} [icon] - FontAwesome icon, or a custom icon element
 * @param {string} [iconClass] - icon colour class, accent by default
 * @param {React.ReactNode} [action] - element on the right of the header
 * @param {string} [className] - layout classes only (size, flex, grid span)
 */
const Card = ({ title, icon, iconClass = 'text-oBlue', action, className = '', children, ...rest }) => (
  <div className={`tesla-card flex flex-col min-w-0 ${className}`} {...rest}>
    {(title || icon || action) && (
      <div className="flex items-center gap-2 mb-3 shrink-0">
        {icon && (React.isValidElement(icon)
          ? <span className={`${iconClass} flex items-center`}>{icon}</span>
          : <FontAwesomeIcon icon={icon} className={`${iconClass} text-sm opacity-80`} />)}
        {title && <span className="text-caption font-semibold uppercase tracking-widest text-hud-secondary truncate">{title}</span>}
        {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export default Card;
