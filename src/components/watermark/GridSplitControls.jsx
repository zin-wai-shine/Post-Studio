import React from 'react';
import { FiScissors, FiUploadCloud, FiImage, FiTarget, FiZap } from 'react-icons/fi';
import { SOCIAL_GRID_LAYOUTS, FOCUS_POSITIONS, getAutoTileFocusMap } from '../../constants/watermark';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { InfoTooltip } from '../common/Tooltip';
import './GridSplitControls.css';

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

const getShortFocusLabel = (focusKey) => {
  switch (focusKey) {
    case 'top-left': return 'Top Left';
    case 'top-center': return 'Top';
    case 'top-right': return 'Top Right';
    case 'center-left': return 'Left';
    case 'center': return 'Center';
    case 'center-right': return 'Right';
    case 'bottom-left': return 'Bottom Left';
    case 'bottom-center': return 'Bottom';
    case 'bottom-right': return 'Bottom Right';
    default: return 'Center';
  }
};

export function GridSplitControls({
  activeLayout = 'four-squares',
  onSelectLayout,
  activeImage = null,
  onSliceImage,
  isSlicing = false,
  onTriggerSingleUpload,
  gridCropSettings = {},
  onUpdateGridCropSetting,
  presets = []
}) {
  const currentLayout = SOCIAL_GRID_LAYOUTS.find((l) => l.id === activeLayout) || SOCIAL_GRID_LAYOUTS[3];

  const targetPresetId = gridCropSettings?.targetCropPreset || 'original';
  const selectedTileId = gridCropSettings?.selectedTileId || 1;
  const tileFocusMap = gridCropSettings?.tileFocusMap || {};

  // Build dropdown options
  const cropSizeOptions = [
    {
      id: 'original',
      name: 'Original Ratio (No Crop)',
      label: 'Original Ratio (No Crop)',
      description: 'Keeps native sliced resolution without cropping'
    },
    ...presets.map((p) => ({
      id: p.id,
      name: p.name,
      label: `${p.name} (${p.width} × ${p.height})`,
      description: `${p.ratioLabel ? `${p.ratioLabel} • ` : ''}${p.width} × ${p.height} px`
    }))
  ];

  const handleSelectCropSize = (presetId) => {
    if (!onUpdateGridCropSetting) return;
    if (presetId === 'original') {
      onUpdateGridCropSetting('targetCropPreset', 'original');
      onUpdateGridCropSetting('targetWidth', null);
      onUpdateGridCropSetting('targetHeight', null);
    } else {
      const found = presets.find((p) => p.id === presetId);
      if (found) {
        onUpdateGridCropSetting('targetCropPreset', found.id);
        onUpdateGridCropSetting('targetWidth', found.width);
        onUpdateGridCropSetting('targetHeight', found.height);
      }
    }
  };

  const isCropActive = targetPresetId !== 'original' && gridCropSettings?.targetWidth && gridCropSettings?.targetHeight;
  const activePreset = presets.find((p) => p.id === targetPresetId);

  // Focus positioning helpers
  const currentTile = currentLayout.tiles.find((t) => t.id === selectedTileId) || currentLayout.tiles[0];
  const effectiveTileId = currentTile ? currentTile.id : 1;
  const currentTileFocus = tileFocusMap[effectiveTileId] || 'center';
  const currentFocusLabel = FOCUS_POSITIONS[currentTileFocus]?.label || 'Center';

  const handleSetTileFocus = (cellKey) => {
    if (!onUpdateGridCropSetting) return;
    const nextMap = { ...tileFocusMap, [effectiveTileId]: cellKey };
    onUpdateGridCropSetting('tileFocusMap', nextMap);
    onUpdateGridCropSetting('isAutoPosition', false);
  };

  const handleAutoPosition = () => {
    if (!onUpdateGridCropSetting) return;
    const autoMap = getAutoTileFocusMap(activeLayout);
    onUpdateGridCropSetting('tileFocusMap', autoMap);
    onUpdateGridCropSetting('isAutoPosition', true);
  };

  const handleCenterAll = () => {
    if (!onUpdateGridCropSetting) return;
    const centerMap = {};
    currentLayout.tiles.forEach((t) => {
      centerMap[t.id] = 'center';
    });
    onUpdateGridCropSetting('tileFocusMap', centerMap);
    onUpdateGridCropSetting('isAutoPosition', false);
  };

  return (
    <div className="grid-split-controls-pane">
      {/* Compact Header */}
      <div className="grid-mini-header">
        <span className="grid-mini-title">Select Grid Format</span>
        <div className="grid-mini-header-right">
          <span className="grid-mini-current">{currentLayout.name} ({currentLayout.tileCount} Tiles)</span>
          <InfoTooltip
            text={`Slices into ${currentLayout.tileCount} sequential images ready for social upload.`}
            position="bottom-right"
          />
        </div>
      </div>

      {/* Small Compact Grid Wireframe Buttons */}
      <div className="grid-mini-matrix" role="radiogroup" aria-label="Grid Format">
        {SOCIAL_GRID_LAYOUTS.map((layout) => {
          const isSelected = activeLayout === layout.id;

          return (
            <button
              key={layout.id}
              type="button"
              className={`grid-mini-btn ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectLayout(layout.id)}
              role="radio"
              aria-checked={isSelected}
              title={`${layout.name} - ${layout.tileCount} Tiles`}
              aria-label={`${layout.name} - ${layout.tileCount} Tiles`}
            >
              <div className={`mini-wireframe wireframe-${layout.id}`}>
                {layout.id === 'one-square' && (
                  <div className="mini-tile tile-full" />
                )}

                {layout.id === 'two-squares' && (
                  <div className="mini-row row-two">
                    <div className="mini-tile" />
                    <div className="mini-tile" />
                  </div>
                )}

                {layout.id === 'three-squares' && (
                  <div className="mini-col col-three">
                    <div className="mini-tile tile-top-banner" />
                    <div className="mini-row row-half">
                      <div className="mini-tile" />
                      <div className="mini-tile" />
                    </div>
                  </div>
                )}

                {layout.id === 'four-squares' && (
                  <div className="mini-grid grid-2x2">
                    <div className="mini-tile" />
                    <div className="mini-tile" />
                    <div className="mini-tile" />
                    <div className="mini-tile" />
                  </div>
                )}

                {layout.id === 'five-squares' && (
                  <div className="mini-col col-five">
                    <div className="mini-row row-two-top">
                      <div className="mini-tile" />
                      <div className="mini-tile" />
                    </div>
                    <div className="mini-row row-three-bottom">
                      <div className="mini-tile" />
                      <div className="mini-tile" />
                      <div className="mini-tile" />
                    </div>
                  </div>
                )}

                {layout.id === 'six-squares' && (
                  <div className="mini-col col-six">
                    <div className="mini-row row-two-top">
                      <div className="mini-tile" />
                      <div className="mini-tile" />
                    </div>
                    <div className="mini-row row-three-bottom">
                      <div className="mini-tile" />
                      <div className="mini-tile" />
                      <div className="mini-tile tile-plus">
                        <span>+1</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Target Crop Size Dropdown Section */}
      <div className="grid-crop-size-section">
        <div className="grid-section-header">
          <div className="grid-section-title-wrap">
            <span className="grid-section-title">Crop Size for Tiles</span>
            <InfoTooltip
              text="Standardize and crop each sliced tile to this specific resolution and aspect ratio upon cutting."
              position="bottom-right"
            />
          </div>
          {isCropActive && (
            <span className="grid-crop-dim-tag">
              {gridCropSettings.targetWidth} × {gridCropSettings.targetHeight} px
            </span>
          )}
        </div>

        <div className="grid-crop-select-wrapper">
          <Select
            size="sm"
            value={targetPresetId}
            onChange={handleSelectCropSize}
            options={cropSizeOptions}
            menuPlacement="auto"
            placeholder="Select tile crop size..."
          />
        </div>
      </div>

      {/* Tile Focus Position Adjustment Section */}
      <div className="grid-focus-section">
        <div className="grid-section-header">
          <div className="grid-section-title-wrap">
            <span className="grid-section-title">Tile Focus Position</span>
            <InfoTooltip
              text="Adjust focal anchor point for each cut tile or click Auto Position for seamless panoramic alignment."
              position="bottom-right"
            />
          </div>
          <div className="grid-focus-quick-actions">
            <button
              type="button"
              className="grid-action-pill-btn auto-btn"
              onClick={handleAutoPosition}
              title="Automatically align focus points between adjacent tiles"
            >
              <FiZap size={11} />
              <span>Auto Position</span>
            </button>
            <button
              type="button"
              className="grid-action-pill-btn"
              onClick={handleCenterAll}
              title="Reset all tile focus points to Center"
            >
              <FiTarget size={11} />
              <span>Center All</span>
            </button>
          </div>
        </div>

        {/* Tile Tabs Selector */}
        <div className="grid-tile-tabs-bar" role="tablist" aria-label="Select Tile to adjust focus">
          {currentLayout.tiles.map((tile) => {
            const isSelected = tile.id === effectiveTileId;
            const tileFocusKey = tileFocusMap[tile.id] || 'center';
            const shortLabel = getShortFocusLabel(tileFocusKey);

            return (
              <button
                key={tile.id}
                type="button"
                className={`grid-tile-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onUpdateGridCropSetting && onUpdateGridCropSetting('selectedTileId', tile.id)}
                role="tab"
                aria-selected={isSelected}
                title={`${tile.label} - Focus: ${FOCUS_POSITIONS[tileFocusKey]?.label || 'Center'}`}
              >
                <span className="tile-tab-num">{tile.id}</span>
                <span className="tile-tab-name">{tile.label}</span>
                <span className="tile-tab-focus-badge">{shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* 3x3 Focus Matrix Card */}
        <div className="grid-focus-editor-card">
          <div className="grid-focus-matrix-col">
            <div className="focus-3x3-grid" role="group" aria-label="9-Point Focus Position Matrix">
              {FOCUS_CELLS.map((cell) => {
                const isActive = currentTileFocus === cell.key;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`focus-cell-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSetTileFocus(cell.key)}
                    title={`Set Tile ${effectiveTileId} Focus: ${cell.label}`}
                    aria-label={`Set Tile ${effectiveTileId} Focus: ${cell.label}`}
                    aria-pressed={isActive}
                  >
                    <span className="focus-cell-dot" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid-focus-info-col">
            <div className="grid-focus-info-header">
              <span className="grid-focus-tile-title">
                Tile {effectiveTileId} • {currentTile?.label}
              </span>
              <span className="grid-focus-badge">
                {currentFocusLabel}
              </span>
            </div>

            <p className="grid-focus-tip">
              {isCropActive ? (
                <>Anchors to <strong>{currentFocusLabel}</strong> when cropped to {activePreset?.name || `${gridCropSettings.targetWidth}×${gridCropSettings.targetHeight}`}.</>
              ) : (
                <>Tile will anchor towards <strong>{currentFocusLabel}</strong> if target crop size is selected above.</>
              )}
            </p>

            <button
              type="button"
              className="grid-focus-auto-single-btn"
              onClick={() => {
                const autoMap = getAutoTileFocusMap(activeLayout);
                if (autoMap[effectiveTileId]) {
                  handleSetTileFocus(autoMap[effectiveTileId]);
                }
              }}
            >
              <FiZap size={11} />
              <span>Smart Auto for Tile {effectiveTileId}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slicing Action Box */}
      <div className="grid-slice-action-box">
        {activeImage ? (
          <>
            <div className="grid-slice-meta-row">
              <span className="meta-source-name" title={activeImage.name}>
                {activeImage.name}
              </span>
              <span className="meta-dim-badge">
                {isCropActive
                  ? `${currentLayout.tileCount} × (${gridCropSettings.targetWidth} × ${gridCropSettings.targetHeight} px)`
                  : `${activeImage.width} × ${activeImage.height} px`}
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              className="slice-action-btn"
              iconLeft={<FiScissors size={14} />}
              loading={isSlicing}
              onClick={onSliceImage}
              title={`Slice image into ${currentLayout.tileCount} tiles`}
            >
              {isSlicing ? 'Slicing...' : `Slice into ${currentLayout.tileCount} Tiles`}
            </Button>

            <button
              type="button"
              className="change-source-image-btn"
              onClick={onTriggerSingleUpload}
            >
              <FiUploadCloud size={13} />
              <span>Change Image</span>
            </button>
          </>
        ) : (
          <div className="grid-slice-empty-state">
            <FiImage size={20} className="empty-icon" />
            <span className="empty-text">No image loaded yet</span>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<FiUploadCloud size={14} />}
              onClick={onTriggerSingleUpload}
            >
              Choose Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
