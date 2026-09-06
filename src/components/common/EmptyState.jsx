import React from 'react';
import './EmptyState.css';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h4 className="empty-state-title">{title}</h4>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
