import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { IconButton } from './IconButton';
import './Modal.css';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '460px',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  backdropClassName = ''
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus first focusable element inside modal on open
    if (modalRef.current) {
      const focusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (closeOnEscape) {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal-backdrop ${backdropClassName}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`modal-content ${className}`.trim()}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {title}
          </h3>
          {showCloseButton && (
            <IconButton
              icon={<FiX size={16} />}
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
            />
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
