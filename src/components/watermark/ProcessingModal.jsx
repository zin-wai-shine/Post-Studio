import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import './ProcessingModal.css';

export function ProcessingModal({
  isOpen,
  progress = { current: 0, total: 0, percentage: 0, currentFilename: '' },
  onCancel
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Downloading Images Directly"
      maxWidth="420px"
      footer={
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel Download
        </Button>
      }
    >
      <div className="processing-wrap">
        <div className="processing-status-row">
          <span className="processing-count">
            Downloading {progress.current} of {progress.total}
          </span>
          <span className="processing-percent">{progress.percentage}%</span>
        </div>

        <div className="processing-bar-bg">
          <div
            className="processing-bar-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="processing-file-row">
          {progress.currentFilename
            ? `Downloading: ${progress.currentFilename}`
            : 'Rendering high-resolution images...'}
        </div>
      </div>
    </Modal>
  );
}
