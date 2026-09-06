import React from 'react';
import './IconButton.css';

export function IconButton({
  icon,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'ghost', // 'ghost' | 'bordered' | 'danger'
  title,
  'aria-label': ariaLabel,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'icon-btn',
    `icon-btn-${size}`,
    variant === 'bordered' ? 'icon-btn-bordered' : '',
    variant === 'danger' ? 'icon-btn-danger' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      title={title || ariaLabel}
      aria-label={ariaLabel || title}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon}
    </button>
  );
}
