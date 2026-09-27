import React, { useState, useEffect } from 'react';
import { FiTrash2, FiFolder, FiCheck, FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';
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
    <div className={`source-path-box ${compact ? 'compact' : ''}`}>
      {/* Header with Title, Status & Toggle Switch */}
      <div className="source-path-header">
        <div className="source-path-title-group">
          <FiTrash2 className="source-path-icon" size={14} />
          <span className="source-path-title">Auto-Delete Source</span>
          <span
            className={`source-path-status-badge ${
              !isEnabled ? 'disabled' : isConnected ? 'active' : isChecking ? 'checking' : 'warning'
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
        </div>

        <label className="source-path-toggle-label" title={isEnabled ? 'Disable auto-delete' : 'Enable auto-delete'}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onToggleEnabled?.(e.target.checked)}
            className="source-path-checkbox"
          />
          <span className="source-path-slider" />
        </label>
      </div>

      {/* Main Path Input Row */}
      {isEnabled && (
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
              placeholder="e.g. /Users/zinwaishine/Downloads or ~/Downloads"
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
  );
}
