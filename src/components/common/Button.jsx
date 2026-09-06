import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'secondary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        iconLeft && <span className="btn-icon-left">{iconLeft}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
}
