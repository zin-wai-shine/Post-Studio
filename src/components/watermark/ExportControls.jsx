import React from 'react';
import { FiDownload, FiArchive } from 'react-icons/fi';
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
  totalImagesCount = 0
}) {
  const showQualitySlider = exportSettings.format === 'jpeg' ||
    exportSettings.format === 'webp' ||
    exportSettings.format === 'original';

  return (
    <div className="export-controls">
      <div className="export-section-title">
        <span>Export Settings</span>
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
          Filename Suffix
        </label>
        <input
          id="suffix-input"
          type="text"
          value={exportSettings.suffix || ''}
          onChange={(e) => onChangeExportSettings('suffix', e.target.value)}
          placeholder="-watermarked"
          className="suffix-input"
        />
      </div>

      <div className="export-actions">
        <Button
          variant="primary"
          size="md"
          iconLeft={<FiArchive size={14} />}
          fullWidth
          disabled={totalImagesCount === 0 || isExportingBatch || isExportingSingle}
          loading={isExportingBatch}
          onClick={onDownloadAll}
        >
          {isExportingBatch ? 'Processing ZIP...' : `Download All (${totalImagesCount})`}
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
