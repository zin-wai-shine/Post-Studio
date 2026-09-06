import React from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { Select } from '../common/Select';
import { Slider } from '../common/Slider';
import { Button } from '../common/Button';
import { EXPORT_FORMATS } from '../../constants/watermark';
import './ExportControls.css';

export function ExportControls({
  exportSettings,
  onChangeExportSettings,
  onDownloadSingle,
  onDownloadAll,
  isExportingSingle = false,
  isExportingBatch = false,
  hasActiveImage = false,
  totalImagesCount = 0,
  batchPrefix = 'XEA',
  onRegeneratePrefix,
  autoClearAfterDownload = false,
  onToggleAutoClear
}) {
  const showQualitySlider = exportSettings.format === 'jpeg' ||
    exportSettings.format === 'webp' ||
    exportSettings.format === 'original';

  const rawSuffix = exportSettings.suffix !== undefined && exportSettings.suffix !== ''
    ? exportSettings.suffix
    : 'BAS';
  const cleanSuffix = rawSuffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'BAS';
  const sampleExt = exportSettings.format === 'jpeg'
    ? '.jpg'
    : (exportSettings.format === 'webp' ? '.webp' : '.png');
  const sampleFilename = `${batchPrefix || 'XEA'}_23523_${cleanSuffix}${sampleExt}`;

  return (
    <div className="export-controls">
      <div className="export-section-title">
        <span>Export Settings</span>
      </div>

      {/* File Naming Pattern Card */}
      <div className="naming-preview-card">
        <div className="naming-card-top">
          <span className="naming-label">Image Filename Preview</span>
          {onRegeneratePrefix && (
            <button
              type="button"
              className="naming-refresh-btn"
              onClick={onRegeneratePrefix}
              title="Generate a new 3-letter batch prefix"
            >
              <FiRefreshCw size={11} />
              <span>New Prefix ({batchPrefix})</span>
            </button>
          )}
        </div>
        <div className="naming-display">
          <code>{sampleFilename}</code>
        </div>
        <span className="naming-note">
          Prefix <code>{batchPrefix}</code> stays identical across all images in this batch.
        </span>
      </div>

      <Select
        label="Format"
        value={exportSettings.format}
        onChange={(val) => onChangeExportSettings('format', val)}
        options={EXPORT_FORMATS}
      />

      {showQualitySlider && (
        <Slider
          label="Output Quality"
          value={Math.round((exportSettings.quality || 0.92) * 100)}
          onChange={(val) => onChangeExportSettings('quality', val / 100)}
          min={50}
          max={100}
          step={1}
          unit="%"
          defaultValue={92}
          onReset={(val) => onChangeExportSettings('quality', val / 100)}
        />
      )}

      <div className="suffix-input-group">
        <label htmlFor="suffix-input" className="suffix-label">
          Batch Suffix (Default: BAS)
        </label>
        <input
          id="suffix-input"
          type="text"
          value={exportSettings.suffix !== undefined ? exportSettings.suffix : 'BAS'}
          onChange={(e) => onChangeExportSettings('suffix', e.target.value.toUpperCase().slice(0, 6))}
          placeholder="BAS"
          className="suffix-input"
        />
      </div>

      {/* Auto-Clear Workspace After Download */}
      <div className="auto-clear-box">
        <label className="auto-clear-toggle">
          <input
            type="checkbox"
            checked={autoClearAfterDownload}
            onChange={(e) => onToggleAutoClear?.(e.target.checked)}
            className="auto-clear-input"
          />
          <span className="auto-clear-switch" />
          <div className="auto-clear-text">
            <span className="auto-clear-title">Auto-clear after download</span>
            <span className="auto-clear-subtitle">
              Clears workspace and generates fresh batch prefix on completion
            </span>
          </div>
        </label>
      </div>

      <div className="export-actions">
        <Button
          variant="primary"
          size="md"
          iconLeft={<FiDownload size={14} />}
          fullWidth
          disabled={totalImagesCount === 0 || isExportingBatch || isExportingSingle}
          loading={isExportingBatch}
          onClick={onDownloadAll}
        >
          {isExportingBatch ? 'Downloading...' : `Download All (${totalImagesCount})`}
        </Button>

        <Button
          variant="secondary"
          size="md"
          iconLeft={<FiDownload size={14} />}
          fullWidth
          disabled={!hasActiveImage || isExportingSingle || isExportingBatch}
          loading={isExportingSingle}
          onClick={onDownloadSingle}
        >
          {isExportingSingle ? 'Processing...' : 'Download Selected'}
        </Button>
      </div>
    </div>
  );
}

