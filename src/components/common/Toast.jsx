import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { IconButton } from './IconButton';
import './Toast.css';

export function Toast({
  type = 'info', // 'info' | 'success' | 'error'
  message,
  onClose,
  duration = 4000,
  className = ''
}) {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    if (type === 'success') return <FiCheckCircle size={16} />;
    if (type === 'error') return <FiAlertCircle size={16} />;
    return <FiInfo size={16} />;
  };

  return (
    <div className={`toast toast-${type} ${className}`} role="status">
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <IconButton
          icon={<FiX size={14} />}
          size="sm"
          onClick={onClose}
          aria-label="Dismiss notice"
        />
      )}
    </div>
  );
}
