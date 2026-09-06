import React from 'react';
import { FiCheckCircle, FiInfo, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { Select } from '../common/Select';
import { CROP_PRESETS, FOCUS_POSITIONS } from '../../constants/watermark';
import './CropControls.css';

const FOCUS_CELLS = [
  { key: 'top-left', label: 'Top Left' },
  { key: 'top-center', label: 'Top Center' },
  { key: 'top-right', label: 'Top Right' },
  { key: 'center-left', label: 'Center Left' },
  { key: 'center', label: 'Center' },
  { key: 'center-right', label: 'Center Right' },
  { key: 'bottom-left', label: 'Bottom Left' },
  { key: 'bottom-center', label: 'Bottom Center' },
  { key: 'bottom-right', label: 'Bottom Right' }
];

const QUICK_RATIOS = [
  { id: '1:1', label: '1:1', width: 1080, height: 1080 },
  { id: '4:5', label: '4:5', width: 1080, height: 1350 },
  { id: '9:16', label: '9:16', width: 1080, height: 1920 },
  { id: '16:9', label: '16:9', width: 1920, height: 1080 },
  { id: '4:3', label: '4:3', width: 1440, height: 1080 }
];

export function CropControls({
  cropSettings,
  onUpdateCropSetting,
  onSetCropPreset,
  onSetCropFocus,
  totalImagesCount = 0,
  activeImage = null
}) {
  const isEnabled = Boolean(cropSettings?.enabled);
  const activeFocus = cropSettings?.focus || 'center';
  const focusLabel = FOCUS_POSITIONS[activeFocus]?.label || 'Center';
  const fitMode = cropSettings?.fitMode || 'cover';

  const handleToggle = () => {
    const nextState = !isEnabled;
    onUpdateCropSetting('enabled', nextState);
    if (nextState && cropSettings?.preset === 'original') {
      // Default to 4:5 Portrait or 1:1 if enabling from original
      onSetCropPreset('4:5');
    }
  };

  const handleWidthChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateCropSetting('width', val);
      onUpdateCropSetting('preset', 'custom');
      onUpdateCropSetting('enabled', true);
    }
  };

  const handleHeightChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateCropSetting('height', val);
      onUpdateCropSetting('preset', 'custom');
      onUpdateCropSetting('enabled', true);
    }
  };

  return (
    <div className="crop-controls-pane">
      {/* Enable Crop & Standardization Switch */}
      <div className="crop-toggle-card">
        <div className="crop-toggle-info">
          <span className="crop-toggle-title">Crop & Standardize Resolution</span>
          <span className="crop-toggle-desc">
            {isEnabled
              ? `Unified output: ${cropSettings.width} × ${cropSettings.height} px`
              : 'Keep each image at its original resolution'}
          </span>
        </div>
        <button
          type="button"
          className={`switch-btn ${isEnabled ? 'active' : ''}`}
          onClick={handleToggle}
          aria-pressed={isEnabled}
          title={isEnabled ? 'Disable crop standardization' : 'Enable crop standardization'}
        >
          <span className="switch-thumb" />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Preset Selector */}
          <div className="control-group">
            <Select
              label="Aspect Ratio & Size Preset"
              value={cropSettings.preset}
              onChange={(val) => onSetCropPreset(val)}
              options={CROP_PRESETS}
              size="md"
            />
          </div>

          {/* Direct Width & Height Pixel Inputs */}
          <div className="control-group">
            <div className="dimension-inputs-row">
              <div className="dimension-field">
                <label className="dimension-field-label" htmlFor="crop-width-input">
                  Width (px)
                </label>
                <div className="dimension-input-wrap">
                  <input
                    id="crop-width-input"
                    type="number"
                    min="100"
                    max="8000"
                    step="10"
                    className="dimension-input"
                    value={cropSettings.width || 1080}
                    onChange={handleWidthChange}
                  />
                  <span className="dimension-unit">px</span>
                </div>
              </div>

              <span className="dimension-divider">×</span>

              <div className="dimension-field">
                <label className="dimension-field-label" htmlFor="crop-height-input">
                  Height (px)
                </label>
                <div className="dimension-input-wrap">
                  <input
                    id="crop-height-input"
                    type="number"
                    min="100"
                    max="8000"
                    step="10"
                    className="dimension-input"
                    value={cropSettings.height || 1080}
                    onChange={handleHeightChange}
                  />
                  <span className="dimension-unit">px</span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="quick-presets-list">
              {QUICK_RATIOS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`quick-preset-chip ${cropSettings.preset === q.id ? 'active' : ''}`}
                  onClick={() => onSetCropPreset(q.id)}
                >
                  {q.label} ({q.width}×{q.height})
                </button>
              ))}
            </div>
          </div>

          {/* 9-Point Focus Position Selector */}
          <div className="focus-selector-card">
            <div className="focus-selector-header">
              <span className="focus-selector-title">Crop Focus Position</span>
              <span className="focus-selector-current">{focusLabel}</span>
            </div>

            <div className="focus-grid-layout">
              <div className="focus-3x3-grid" role="group" aria-label="9-Point Crop Focus Grid">
                {FOCUS_CELLS.map((cell) => {
                  const isActive = activeFocus === cell.key;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={`focus-cell-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onSetCropFocus(cell.key)}
                      title={`Focus: ${cell.label}`}
                      aria-label={`Focus: ${cell.label}`}
                      aria-pressed={isActive}
                    >
                      <span className="focus-cell-dot" />
                    </button>
                  );
                })}
              </div>

              <p className="focus-explanation">
                Select where the crop anchors when trimming excess width or height. The chosen focus region will be preserved across all batch images.
              </p>
            </div>
          </div>

          {/* Fit Mode Selector */}
          <div className="control-group">
            <span className="dimension-field-label">Crop Behavior</span>
            <div className="fit-mode-row">
              <button
                type="button"
                className={`fit-mode-btn ${fitMode === 'cover' ? 'active' : ''}`}
                onClick={() => onUpdateCropSetting('fitMode', 'cover')}
              >
                <span className="fit-mode-btn-title">Cover (Fill & Crop)</span>
                <span className="fit-mode-btn-desc">Fills target px with zero empty borders</span>
              </button>

              <button
                type="button"
                className={`fit-mode-btn ${fitMode === 'contain' ? 'active' : ''}`}
                onClick={() => onUpdateCropSetting('fitMode', 'contain')}
              >
                <span className="fit-mode-btn-title">Contain (Pad & Fit)</span>
                <span className="fit-mode-btn-desc">Fits entire image with clean letterbox</span>
              </button>
            </div>
          </div>

          {/* Batch Status Notification */}
          <div className="crop-summary-badge is-active">
            <FiCheckCircle className="crop-summary-icon" />
            <span>
              All {totalImagesCount > 0 ? `${totalImagesCount} images` : 'batch images'} will export with unified <strong>{cropSettings.width} × {cropSettings.height} px</strong>
            </span>
          </div>
        </>
      )}

      {!isEnabled && (
        <div className="crop-summary-badge">
          <FiInfo className="crop-summary-icon" />
          <span>
            {activeImage
              ? `Current image: ${activeImage.width} × ${activeImage.height} px (no crop applied)`
              : 'Each image retains its original resolution and aspect ratio.'}
          </span>
        </div>
      )}
    </div>
  );
}
