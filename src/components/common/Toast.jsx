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

  const defaultTitle = type === 'success' ? 'Completed' : (type === 'error' ? 'Error' : 'Notification');
  const displayTitle = title || defaultTitle;

  return (
    <div
      className={`apple-noti-toast ${type} ${isExiting ? 'exiting' : ''} ${className}`}
      role="alert"
    >
      <div className="apple-noti-icon-badge">
        {type === 'success' && <FiCheck size={14} className="apple-icon success" />}
        {type === 'error' && <FiAlertTriangle size={13} className="apple-icon error" />}
        {type === 'info' && <FiInfo size={13} className="apple-icon info" />}
      </div>

      <div className="apple-noti-body">
        <div className="apple-noti-header">
          <span className="apple-noti-app">POFIX STUDIO</span>
          <span className="apple-noti-dot">•</span>
          <span className="apple-noti-time">now</span>
        </div>
        <div className="apple-noti-title">{displayTitle}</div>
        <div className="apple-noti-message">{message}</div>
      </div>

      {onClose && (
        <button
          type="button"
          className="apple-noti-close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <FiX size={12} />
        </button>
      )}
    </div>
  );
}

