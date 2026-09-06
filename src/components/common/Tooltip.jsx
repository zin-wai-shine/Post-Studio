import React from 'react';
import { FiInfo } from 'react-icons/fi';
import './Tooltip.css';

export function InfoTooltip({
  text,
  title,
  position = 'top-right', // 'top' | 'bottom' | 'top-right' | 'bottom-right'
  size = 12,
  className = '',
  ariaLabel
}) {
  const content = text || title;
  if (!content) return null;

  return (
    <div className={`info-tooltip-wrap ${className}`}>
      <button
        type="button"
        className="info-tooltip-trigger"
        aria-label={ariaLabel || (typeof content === 'string' ? content : 'More information')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <FiInfo size={size} className="info-tooltip-icon" />
      </button>

      <div className={`info-tooltip-bubble pos-${position}`} role="tooltip">
        <span className="info-tooltip-text">{content}</span>
      </div>
    </div>
  );
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = ''
}) {
  if (!content) return children;

  return (
    <div className={`tooltip-wrap ${className}`}>
      {children}
      <div className={`info-tooltip-bubble pos-${position}`} role="tooltip">
        <span className="info-tooltip-text">{content}</span>
      </div>
    </div>
  );
}
