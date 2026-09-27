import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import './ProcessingModal.css';

export function ProcessingModal({
  isOpen,
  progress,
  current,
  total,
  percentage,
  currentFilename,
  onCancel
}) {
  const currentCount = progress?.current ?? current ?? 0;
  const totalCount = progress?.total ?? total ?? 0;
  const pct = progress?.percentage ?? percentage ?? (totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0);
  const fileText = progress?.currentFilename ?? currentFilename ?? '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Downloading Images Directly"
      maxWidth="420px"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      showCloseButton={false}
      backdropClassName="processing-modal-backdrop"
      footer={
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          className="processing-cancel-btn"
        >
          Cancel Download
        </Button>
      }
    >
      <div className="processing-wrap">
        <div className="processing-status-row">
          <span className="processing-count">
            Downloading {currentCount} of {totalCount}
          </span>
          <span className="processing-percent">{pct}%</span>
        </div>

        <div className="processing-bar-bg">
          <div
            className="processing-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>

        <div className="processing-file-row">
          {fileText || 'Rendering high-resolution images...'}
        </div>
      </div>
    </Modal>
  );
}
