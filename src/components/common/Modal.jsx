import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { IconButton } from './IconButton';
import './Modal.css';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '460px'
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {title}
          </h3>
          <IconButton
            icon={<FiX size={16} />}
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
