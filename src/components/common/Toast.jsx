import React, { useEffect, useState, useRef } from 'react';
import { FiCheck, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import './Toast.css';

export function Toast({
  type = 'info', // 'info' | 'success' | 'error'
  title = '',
  message,
  onClose,
  duration = 3500,
  className = ''
}) {
  const [isExiting, setIsExiting] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Handle dismiss with exit animation
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onCloseRef.current?.();
    }, 250);
  };

  useEffect(() => {
    if (!duration) return;

    // Start exit transition 250ms before duration ends
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(800, duration - 250));

    // Auto-hide and remove toast
    const dismissTimer = setTimeout(() => {
      onCloseRef.current?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  if (!message) return null;

  return (
    <div
      className={`modern-toast ${type} ${isExiting ? 'exiting' : ''} ${className}`}
      role="alert"
    >
      <div className={`toast-icon-badge ${type}`}>
        {type === 'success' && <FiCheck size={15} />}
        {type === 'error' && <FiAlertTriangle size={15} />}
        {type === 'info' && <FiInfo size={15} />}
      </div>

      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>

      {onClose && (
        <button
          type="button"
          className="toast-close-btn"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <FiX size={14} />
        </button>
      )}

      {duration > 0 && (
        <div
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}
