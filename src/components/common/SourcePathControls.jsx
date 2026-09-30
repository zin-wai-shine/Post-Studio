import React, { useState, useEffect } from 'react';
import {
  FiTrash2,
  FiFolder,
  FiCheck,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiEdit2,
  FiSettings
} from 'react-icons/fi';
import { Modal } from './Modal';
import { Button } from './Button';
import './SourcePathControls.css';

export function SourcePathControls({
  folderPath = '',
  onSetFolderPath,
  isEnabled = true,
  onToggleEnabled,
  isConnected = false,
  isChecking = false,
  lastCheckError = null,
  systemInfo = null,
  onVerifyPath,
  compact = false
}) {
  const [localInput, setLocalInput] = useState(folderPath);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setLocalInput(folderPath);
  }, [folderPath]);

  const handleApply = (newVal) => {
    const val = newVal !== undefined ? newVal : localInput;
    onSetFolderPath?.(val);
    onVerifyPath?.(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  const downloadsPath = systemInfo?.downloadsDir || '~/Downloads';
  const desktopPath = systemInfo?.desktopDir || '~/Desktop';

  return (
    <>
      <div className={`source-path-box ${compact ? 'compact' : ''}`}>
        {/* Header with Title, Status & Toggle Switch */}
        <div className="source-path-header">
          <div className="source-path-title-group">
            <FiTrash2 className="source-path-icon" size={14} />
            <span className="source-path-title">Auto-Delete Source</span>
            <span
              className={`source-path-status-badge ${
                !isEnabled
                  ? 'disabled'
                  : isConnected
                  ? 'active'
                  : isChecking
                  ? 'checking'
                  : 'warning'
              }`}
            >
              {!isEnabled ? (
                'Disabled'
              ) : isChecking ? (
                <>
                  <FiRefreshCw size={10} className="spinning-icon" /> Checking
                </>
              ) : isConnected ? (
                <>
                  <FiCheck size={10} /> Active
                </>
              ) : (
                <>
                  <FiAlertCircle size={10} /> Not Found
                </>
              )}
            </span>

            {/* In compact mode, show folder badge with modal trigger */}
            {compact && isEnabled && (
              <button
                type="button"
                className="source-path-modal-trigger"
                onClick={() => setShowModal(true)}
                title="Click to edit folder path in modal"
              >
                <FiFolder size={11} />
                <span className="trigger-path-text">{folderPath || 'Set Folder'}</span>
                <FiEdit2 size={10} className="trigger-edit-icon" />
              </button>
            )}
          </div>

          <label
            className="source-path-toggle-label"
            title={isEnabled ? 'Disable auto-delete' : 'Enable auto-delete'}
          >
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggleEnabled?.(e.target.checked)}
              className="source-path-checkbox"
            />
            <span className="source-path-slider" />
          </label>
        </div>

        {/* In standard non-compact mode, show the inline body */}
        {!compact && isEnabled && (
          <div className="source-path-body">
            <div className="source-path-input-wrap">
              <FiFolder className="source-path-input-icon" size={13} />
              <input
                type="text"
                className="source-path-text-input"
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                onBlur={() => handleApply()}
                onKeyDown={handleKeyDown}
                placeholder="e.g. /Users/username/Downloads or ~/Downloads"
                spellCheck="false"
                autoComplete="off"
              />
              {localInput ? (
                <button
                  type="button"
                  className="source-path-clear-btn"
                  onClick={() => {
                    setLocalInput('');
                    handleApply('');
                  }}
                  title="Clear folder path"
                >
                  <FiX size={12} />
                </button>
              ) : null}
            </div>

            {/* Quick presets buttons */}
            <div className="source-path-chips">
              <span className="source-path-chips-label">Quick set:</span>
              <button
                type="button"
                className={`source-path-chip ${folderPath === downloadsPath ? 'selected' : ''}`}
                onClick={() => {
                  setLocalInput(downloadsPath);
                  handleApply(downloadsPath);
                }}
              >
                Downloads
              </button>
              <button
                type="button"
                className={`source-path-chip ${folderPath === desktopPath ? 'selected' : ''}`}
                onClick={() => {
                  setLocalInput(desktopPath);
                  handleApply(desktopPath);
                }}
              >
                Desktop
              </button>
              <button
                type="button"
                className="source-path-chip refresh-chip"
                onClick={() => onVerifyPath?.(localInput)}
                title="Verify folder exists on computer"
              >
                <FiRefreshCw size={10} className={isChecking ? 'spinning-icon' : ''} /> Test Path
              </button>
            </div>

            {lastCheckError && (
              <div className="source-path-error-text">
                <FiAlertCircle size={11} /> {lastCheckError}
              </div>
            )}

            <p className="source-path-hint">
              {folderPath
                ? `Original uploaded files will be automatically deleted from "${folderPath}" after download.`
                : 'Enter folder path (e.g. ~/Downloads). Original files will be deleted automatically after download.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal for editing path when in compact mode */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Auto-Delete Source Folder Settings"
        maxWidth="480px"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                handleApply();
                setShowModal(false);
              }}
            >
              Done
            </Button>
          </div>
        }
      >
        <div className="source-path-modal-content">
          <p className="source-path-modal-desc">
            Specify the folder on your computer where source images are located. When enabled, original uploaded files will be automatically deleted after download.
          </p>

          <div className="source-path-input-wrap">
            <FiFolder className="source-path-input-icon" size={13} />
            <input
              type="text"
              className="source-path-text-input"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onBlur={() => handleApply()}
              onKeyDown={handleKeyDown}
              placeholder="e.g. ~/Downloads or /Users/.../Downloads"
              spellCheck="false"
              autoComplete="off"
              autoFocus
            />
            {localInput ? (
              <button
                type="button"
                className="source-path-clear-btn"
                onClick={() => {
                  setLocalInput('');
                  handleApply('');
                }}
                title="Clear folder path"
              >
                <FiX size={12} />
              </button>
            ) : null}
          </div>

          <div className="source-path-chips" style={{ marginTop: '10px' }}>
            <span className="source-path-chips-label">Quick set:</span>
            <button
              type="button"
              className={`source-path-chip ${folderPath === downloadsPath ? 'selected' : ''}`}
              onClick={() => {
                setLocalInput(downloadsPath);
                handleApply(downloadsPath);
              }}
            >
              Downloads
            </button>
            <button
              type="button"
              className={`source-path-chip ${folderPath === desktopPath ? 'selected' : ''}`}
              onClick={() => {
                setLocalInput(desktopPath);
                handleApply(desktopPath);
              }}
            >
              Desktop
            </button>
            <button
              type="button"
              className="source-path-chip refresh-chip"
              onClick={() => onVerifyPath?.(localInput)}
              title="Verify folder exists on computer"
            >
              <FiRefreshCw size={10} className={isChecking ? 'spinning-icon' : ''} /> Test Path
            </button>
          </div>

          {lastCheckError && (
            <div className="source-path-error-text" style={{ marginTop: '8px' }}>
              <FiAlertCircle size={11} /> {lastCheckError}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
