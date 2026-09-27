import React, { useState, useMemo } from 'react';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { ImagePreview } from '../watermark/ImagePreview';
import { generatePresetFilename, resolvePresetExtension } from '../../utils/presetUtils';
import { FiDownload, FiEdit2, FiCheck, FiSliders } from 'react-icons/fi';
import './PresetEditorCard.css';

export function PresetEditorCard({
  preset,
  activeImage,
  images = [],
  onEditPreset,
  onUpdatePresetSettings,
  onDownloadSingle,
  onDownloadAll,
  isDownloading = false,
  downloadProgress = null
}) {
  const [showTuning, setShowTuning] = useState(false);

  // Generate a sample filename for preview badge
  const ext = resolvePresetExtension(activeImage?.name || '', preset.exportSettings);
  const sampleFilename = useMemo(() => {
    return generatePresetFilename(preset.prefix || 'BOL', ext);
  }, [preset.prefix, ext]);

  // Ratio summary text
  const ratioLabel = useMemo(() => {
    if (!preset.cropSettings?.enabled || preset.cropSettings?.preset === 'original') {
      return 'Original Size';
    }
    const p = preset.cropSettings.preset;
    const w = preset.cropSettings.width;
    const h = preset.cropSettings.height;
    return `${p} (${w}×${h})`;
  }, [preset.cropSettings]);

  const handleSizeChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    if (onUpdatePresetSettings) {
      onUpdatePresetSettings(preset.id, {
        settings: {
          ...preset.settings,
          size: val
        }
      });
    }
  };

  const handleOpacityChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    if (onUpdatePresetSettings) {
      onUpdatePresetSettings(preset.id, {
        settings: {
          ...preset.settings,
          opacity: val
        }
      });
    }
  };

  return (
    <div className="preset-editor-card">
      {/* Header */}
      <div className="preset-card-header">
        <div className="preset-card-title-group">
          <span className="preset-card-prefix-pill">{preset.prefix || 'BOL'}</span>
          <span className="preset-card-name" title={preset.name}>
            {preset.name}
          </span>
          <span className="preset-card-badge">{ratioLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="preset-card-filename-badge" title="Generated file name pattern">
            {sampleFilename}
          </span>

          {onEditPreset && (
            <IconButton
              icon={<FiEdit2 size={13} />}
              size="sm"
              onClick={() => onEditPreset(preset)}
              aria-label="Edit preset settings"
            />
          )}

          <IconButton
            icon={<FiSliders size={13} />}
            size="sm"
            onClick={() => setShowTuning((prev) => !prev)}
            aria-label="Quick adjustments"
          />
        </div>
      </div>

      {/* Quick Tuning Strip (Collapsible) */}
      {showTuning && (
        <div className="preset-card-tune-bar">
          <div className="preset-card-tune-item">
            <span>Size: {Math.round((preset.settings?.size ?? 0.20) * 100)}%</span>
            <input
              type="range"
              className="preset-card-tune-slider"
              min="8"
              max="50"
              value={Math.round((preset.settings?.size ?? 0.20) * 100)}
              onChange={handleSizeChange}
            />
          </div>
          <div className="preset-card-tune-item">
            <span>Opacity: {Math.round((preset.settings?.opacity ?? 0.85) * 100)}%</span>
            <input
              type="range"
              className="preset-card-tune-slider"
              min="10"
              max="100"
              step="5"
              value={Math.round((preset.settings?.opacity ?? 0.85) * 100)}
              onChange={handleOpacityChange}
            />
          </div>
        </div>
      )}

      {/* Live Canvas Preview */}
      <div className="preset-card-preview-area">
        {activeImage ? (
          <ImagePreview
            activeImage={activeImage}
            watermarkSource={preset.watermarkPreviewUrl || preset.watermarkDataUrl || null}
            settings={preset.settings}
            cropSettings={preset.cropSettings}
          />
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Upload images to preview
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="preset-card-actions">
        <div className="preset-card-action-group">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDownloadSingle(preset)}
            disabled={!activeImage || isDownloading}
            icon={<FiDownload size={14} />}
          >
            Download Image
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onDownloadAll(preset)}
            disabled={images.length === 0 || isDownloading}
            icon={<FiDownload size={14} />}
          >
            Download All ({images.length})
          </Button>
        </div>

        {/* Progress Bar when downloading this preset */}
        {isDownloading && downloadProgress && (
          <div className="preset-card-progress">
            <div className="preset-progress-bar-wrap">
              <div
                className="preset-progress-bar-fill"
                style={{ width: `${downloadProgress.percentage || 0}%` }}
              />
            </div>
            <span>
              {downloadProgress.current} / {downloadProgress.total} ({downloadProgress.percentage}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
