import React from 'react';
import { FiScissors, FiUploadCloud, FiImage, FiInfo } from 'react-icons/fi';
import { SOCIAL_GRID_LAYOUTS } from '../../constants/watermark';
import { Button } from '../common/Button';
import './GridSplitControls.css';

export function GridSplitControls({
  activeLayout = 'four-squares',
  onSelectLayout,
  activeImage = null,
  onSliceImage,
  isSlicing = false,
  onTriggerSingleUpload
}) {
  const currentLayout = SOCIAL_GRID_LAYOUTS.find((l) => l.id === activeLayout) || SOCIAL_GRID_LAYOUTS[3];

  return (
    <div className="grid-split-controls-pane">
      {/* Compact Header */}
      <div className="grid-mini-header">
        <span className="grid-mini-title">Select Grid Format</span>
        <span className="grid-mini-current">{currentLayout.name} ({currentLayout.fbBadge || `${currentLayout.tileCount} Tiles`})</span>
      </div>

      {/* Small Compact Grid Wireframe Buttons (Site Colors, No Big Titles) */}
      <div className="grid-mini-matrix" role="radiogroup" aria-label="Facebook Grid Format">
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
              title={`${layout.name} — FB Grid: ${layout.fbSummary}`}
              aria-label={`${layout.name} — FB Grid: ${layout.fbSummary}`}
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

      {/* Slicing Action Box */}
      <div className="grid-slice-action-box">
        {activeImage ? (
          <>
            <div className="grid-slice-meta-row">
              <span className="meta-source-name" title={activeImage.name}>
                {activeImage.name}
              </span>
              <span className="meta-dim-badge">
                {activeImage.width} × {activeImage.height} px
              </span>
            </div>

            {/* Target Facebook Dimensions Display */}
            <div className="grid-slice-target-row">
              <span className="target-label">FB Grid Output:</span>
              <span className="target-val">{currentLayout.fbSummary}</span>
            </div>

            <Button
              variant="primary"
              size="md"
              className="slice-action-btn"
              iconLeft={<FiScissors size={14} />}
              loading={isSlicing}
              onClick={onSliceImage}
              title={`Slice image into Facebook Grid ${currentLayout.fbSummary}`}
            >
              {isSlicing ? 'Slicing...' : `Slice to Facebook Grid (${currentLayout.tileCount} Tiles)`}
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

      {/* Subtle Hint */}
      <div className="grid-hint-card">
        <FiInfo className="grid-hint-icon" />
        <span>
          Outputs exact standard Facebook feed dimensions ({currentLayout.fbSummary}) for automatic collage arrangement.
        </span>
      </div>
    </div>
  );
}
