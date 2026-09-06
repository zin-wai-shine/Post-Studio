import React, { useState } from 'react';
import {
  FiCheckCircle,
  FiInfo,
  FiPlus,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiBookmark,
  FiMaximize2,
  FiGrid
} from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { InfoTooltip } from '../common/Tooltip';
import { useSavedCropPresets } from '../../hooks/useSavedCropPresets';
import { FOCUS_POSITIONS } from '../../constants/watermark';
import { GridSplitControls } from './GridSplitControls';
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

export function CropControls({
  cropSettings,
  onUpdateCropSetting,
  onSetCropPreset,
  onSetCropFocus,
  totalImagesCount = 0,
  activeImage = null,
  gridCropSettings = { mode: 'standard', activeLayout: 'four-squares', gridFocus: 'center' },
  onUpdateGridCropSetting,
  onSliceImage,
  isSlicing = false,
  onTriggerSingleUpload
}) {
  const {
    presets,
    addCropPreset,
    removeCropPreset,
    renameCropPreset
  } = useSavedCropPresets();

  const isEnabled = Boolean(cropSettings?.enabled);
  const activeFocus = cropSettings?.focus || 'center';
  const focusLabel = FOCUS_POSITIONS[activeFocus]?.label || 'Center';
  const fitMode = cropSettings?.fitMode || 'cover';

  // Modal and inline edit state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newWidth, setNewWidth] = useState(1440);
  const [newHeight, setNewHeight] = useState(1080);
  const [newFocus, setNewFocus] = useState('center');
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleToggle = () => {
    const nextState = !isEnabled;
    onUpdateCropSetting('enabled', nextState);
    if (nextState && cropSettings?.preset === 'original') {
      onSetCropPreset('4:3');
    }
  };

  const handleSelectPreset = (preset) => {
    onUpdateCropSetting('enabled', true);
    onUpdateCropSetting('preset', preset.id);
    onUpdateCropSetting('width', preset.width);
    onUpdateCropSetting('height', preset.height);
    onUpdateCropSetting('aspect', preset.aspect);
    if (preset.focus) {
      onSetCropFocus(preset.focus);
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

  const handleStartRename = (e, preset) => {
    e.stopPropagation();
    setEditingId(preset.id);
    setEditingName(preset.name);
  };

  const handleSaveRename = (id) => {
    if (editingName.trim()) {
      renameCropPreset(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCreatePreset = () => {
    if (!newPresetName.trim() || !newWidth || !newHeight) return;
    const created = addCropPreset({
      name: newPresetName.trim(),
      width: newWidth,
      height: newHeight,
      focus: newFocus
    });
    handleSelectPreset(created);
    setShowAddModal(false);
  };

  const confirmDelete = () => {
    if (deletingId) {
      removeCropPreset(deletingId);
      setDeletingId(null);
    }
  };

  // Find active preset name for summary banner
  const currentActivePreset = presets.find(
    (p) =>
      cropSettings?.preset === p.id ||
      (cropSettings?.width === p.width && cropSettings?.height === p.height)
  );
  const activePresetDisplayName = currentActivePreset?.name || 'Custom Dimensions';
  const cropMode = gridCropSettings?.mode || 'standard';

  return (
    <div className="crop-controls-pane">
      {/* Mode Switcher: Standard Resolution vs Social Grid Split */}
      <div className="crop-mode-switcher-bar" role="tablist" aria-label="Crop Mode">
        <button
          type="button"
          className={`crop-mode-tab-btn ${cropMode === 'standard' ? 'active' : ''}`}
          onClick={() => onUpdateGridCropSetting && onUpdateGridCropSetting('mode', 'standard')}
          role="tab"
          aria-selected={cropMode === 'standard'}
        >
          <FiMaximize2 size={13} />
          <span>Standard Resolution</span>
        </button>
        <button
          type="button"
          className={`crop-mode-tab-btn ${cropMode === 'grid' ? 'active' : ''}`}
          onClick={() => onUpdateGridCropSetting && onUpdateGridCropSetting('mode', 'grid')}
          role="tab"
          aria-selected={cropMode === 'grid'}
        >
          <FiGrid size={13} />
          <span>Social Grid Split</span>
          <span className="grid-mode-badge">New</span>
        </button>
      </div>

      {cropMode === 'grid' ? (
        <GridSplitControls
          activeLayout={gridCropSettings?.activeLayout || 'four-squares'}
          onSelectLayout={(layoutId) => onUpdateGridCropSetting && onUpdateGridCropSetting('activeLayout', layoutId)}
          activeImage={activeImage}
          onSliceImage={onSliceImage}
          isSlicing={isSlicing}
          onTriggerSingleUpload={onTriggerSingleUpload}
        />
      ) : (
        <>
          {/* Enable Crop & Standardization Switch */}
          <div className="crop-toggle-card">
            <div className="crop-toggle-info">
              <div className="crop-toggle-title-row">
                <span className="crop-toggle-title">Crop & Standardize Resolution</span>
                <InfoTooltip
                  text="Standardize all batch images to match unified dimensions and focal crop upon export."
                  position="bottom-right"
                />
              </div>
              <span className="crop-toggle-desc">
                {isEnabled
                  ? `${cropSettings.width} × ${cropSettings.height} px • ${activePresetDisplayName}`
                  : 'Keep each image at original resolution'}
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
              {/* Multiple Crop Size Profiles / Library */}
              <div className="crop-profiles-section">
                <div className="crop-profiles-header">
                  <div className="crop-profiles-title-wrap">
                    <span className="crop-profiles-title">Session Crop Sizes</span>
                    <span className="crop-profiles-count">({presets.length})</span>
                    <InfoTooltip
                      text="Choose standard aspect ratios or create custom dimension presets for your batch."
                      position="bottom-right"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<FiPlus size={11} />}
                    onClick={() => {
                      setNewPresetName('');
                      setNewWidth(cropSettings.width || 1440);
                      setNewHeight(cropSettings.height || 1080);
                      setNewFocus(activeFocus);
                      setShowAddModal(true);
                    }}
                    title="Create and save a new crop size profile"
                  >
                    Add Size
                  </Button>
                </div>

            <div className="crop-profiles-grid" role="listbox" aria-label="Available Crop Sizes">
              {presets.map((preset) => {
                const isSelected =
                  cropSettings.preset === preset.id ||
                  (cropSettings.width === preset.width && cropSettings.height === preset.height);
                const isEditing = editingId === preset.id;

                return (
                  <div
                    key={preset.id}
                    className={`crop-profile-card ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditing) handleSelectPreset(preset);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                  >
                    <div className="crop-profile-radio">
                      <div className={`crop-radio-circle ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <FiCheck size={11} strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="crop-profile-details">
                      {isEditing ? (
                        <div
                          className="crop-profile-rename-row"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="crop-profile-rename-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(preset.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <IconButton
                            icon={<FiCheck size={11} />}
                            size="sm"
                            onClick={() => handleSaveRename(preset.id)}
                            aria-label="Save name"
                          />
                        </div>
                      ) : (
                        <div className="crop-profile-name-row">
                          <span className="crop-profile-name" title={preset.name}>
                            {preset.name}
                          </span>
                          {preset.isCustom && (
                            <span className="crop-custom-tag">Custom</span>
                          )}
                        </div>
                      )}

                      <div className="crop-profile-meta">
                        <span className="crop-profile-dim">
                          {preset.width} × {preset.height} px
                        </span>
                        {preset.ratioLabel && (
                          <span className="crop-profile-ratio">
                            {preset.ratioLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {preset.isCustom && !isEditing && (
                      <div
                        className="crop-profile-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="crop-action-btn edit"
                          onClick={(e) => handleStartRename(e, preset)}
                          title="Rename this crop size"
                          aria-label={`Rename ${preset.name}`}
                        >
                          <FiEdit2 size={11} />
                        </button>
                        <button
                          type="button"
                          className="crop-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(preset.id);
                          }}
                          title="Delete this crop size"
                          aria-label={`Delete ${preset.name}`}
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Width & Height Pixel Inputs */}
          <div className="control-group">
            <div className="crop-section-header-row">
              <span className="dimension-field-label">Custom Target Dimensions</span>
              <InfoTooltip
                text="Adjust custom width and height in pixels. Aspect ratio automatically calculates."
                position="top-right"
              />
            </div>
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

            {/* Quick Save Current Dimensions Button */}
            <button
              type="button"
              className="save-current-crop-btn"
              onClick={() => {
                setNewPresetName(`Preset ${cropSettings.width}×${cropSettings.height}`);
                setNewWidth(cropSettings.width || 1080);
                setNewHeight(cropSettings.height || 1080);
                setNewFocus(activeFocus);
                setShowAddModal(true);
              }}
              title="Save current dimensions as a reusable profile"
            >
              <FiBookmark size={12} />
              <span>Save Current ({cropSettings.width}×{cropSettings.height}) as Profile</span>
            </button>
          </div>

          {/* 9-Point Focus Position Selector */}
          <div className="focus-selector-card">
            <div className="focus-selector-header">
              <span className="focus-selector-title">Crop Focus Position</span>
              <div className="focus-selector-header-actions">
                <span className="focus-selector-current">{focusLabel}</span>
                <InfoTooltip
                  text="Select where the crop anchors when trimming excess width or height. The chosen focus region is preserved across all batch images."
                  position="top-right"
                />
              </div>
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
            </div>
          </div>

          {/* Fit Mode Selector */}
          <div className="control-group">
            <div className="crop-section-header-row">
              <span className="dimension-field-label">Crop Behavior</span>
              <InfoTooltip
                text="Cover trims excess edges to fill target pixels completely. Contain adds clean letterbox borders to preserve the whole original photo."
                position="top-right"
              />
            </div>
            <div className="fit-mode-row">
              <button
                type="button"
                className={`fit-mode-btn ${fitMode === 'cover' ? 'active' : ''}`}
                onClick={() => onUpdateCropSetting('fitMode', 'cover')}
                title="Cover: Fills target px with zero empty borders"
              >
                <span className="fit-mode-btn-title">Cover (Fill & Crop)</span>
              </button>

              <button
                type="button"
                className={`fit-mode-btn ${fitMode === 'contain' ? 'active' : ''}`}
                onClick={() => onUpdateCropSetting('fitMode', 'contain')}
                title="Contain: Fits entire image with clean letterbox"
              >
                <span className="fit-mode-btn-title">Contain (Pad & Fit)</span>
              </button>
            </div>
          </div>

          {/* Batch Status Notification */}
          <div className="crop-summary-badge is-active">
            <FiCheckCircle className="crop-summary-icon" />
            <span>
              All {totalImagesCount > 0 ? `${totalImagesCount} images` : 'batch images'} will export with unified <strong>{cropSettings.width} × {cropSettings.height} px ({activePresetDisplayName})</strong>
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
        </>
      )}

      {/* Add New Crop Preset Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Crop Size Profile"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!newPresetName.trim() || !newWidth || !newHeight}
              onClick={handleCreatePreset}
            >
              Save & Select
            </Button>
          </>
        }
      >
        <div className="add-crop-modal-content">
          <div className="control-group">
            <label className="text-sm font-medium" htmlFor="modal-preset-name">
              Profile Name
            </label>
            <input
              id="modal-preset-name"
              type="text"
              className="text-field-input"
              placeholder="e.g. Condo Hero, Instagram Square, Banner"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="dimension-inputs-row" style={{ marginTop: '10px' }}>
            <div className="dimension-field">
              <label className="dimension-field-label" htmlFor="modal-crop-width">
                Width (px)
              </label>
              <div className="dimension-input-wrap">
                <input
                  id="modal-crop-width"
                  type="number"
                  min="100"
                  max="8000"
                  step="10"
                  className="dimension-input"
                  value={newWidth}
                  onChange={(e) => setNewWidth(parseInt(e.target.value, 10) || '')}
                />
                <span className="dimension-unit">px</span>
              </div>
            </div>

            <span className="dimension-divider">×</span>

            <div className="dimension-field">
              <label className="dimension-field-label" htmlFor="modal-crop-height">
                Height (px)
              </label>
              <div className="dimension-input-wrap">
                <input
                  id="modal-crop-height"
                  type="number"
                  min="100"
                  max="8000"
                  step="10"
                  className="dimension-input"
                  value={newHeight}
                  onChange={(e) => setNewHeight(parseInt(e.target.value, 10) || '')}
                />
                <span className="dimension-unit">px</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Delete Crop Size Profile"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Profile
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Are you sure you want to delete this saved crop size profile? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

