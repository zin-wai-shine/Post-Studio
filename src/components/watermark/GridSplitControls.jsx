import React from 'react';
import { FiGrid, FiScissors, FiCheck, FiInfo, FiUploadCloud, FiImage } from 'react-icons/fi';
import { SOCIAL_GRID_LAYOUTS, FOCUS_POSITIONS } from '../../constants/watermark';
import { Button } from '../common/Button';
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

export function GridSplitControls({
  activeLayout = 'four-squares',
  onSelectLayout,
  focus = 'center',
  onSetFocus,
  activeImage = null,
  onSliceImage,
  isSlicing = false,
  onTriggerSingleUpload
}) {
  const currentLayout = SOCIAL_GRID_LAYOUTS.find((l) => l.id === activeLayout) || SOCIAL_GRID_LAYOUTS[3];
  const focusLabel = FOCUS_POSITIONS[focus]?.label || 'Center';

  return (
    <div className="grid-split-controls-pane">
      {/* Informative Header Banner */}
      <div className="grid-split-intro-card">
        <div className="grid-split-intro-header">
          <div className="grid-split-icon-badge">
            <FiGrid size={16} />
          </div>
          <div>
            <h3 className="grid-split-intro-title">Social Media Grid Splitter</h3>
            <p className="grid-split-intro-desc">
              Upload a single high-resolution image to crop and slice into a multi-photo social carousel or grid post.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Design Cards Section matching Image 2 */}
      <div className="grid-cards-section">
        <div className="grid-cards-header">
          <span className="grid-cards-title">Choose Grid Layout</span>
          <span className="grid-cards-count">({SOCIAL_GRID_LAYOUTS.length} styles)</span>
        </div>

        <div className="grid-presets-matrix" role="radiogroup" aria-label="Social Grid Designs">
          {SOCIAL_GRID_LAYOUTS.map((layout) => {
            const isSelected = activeLayout === layout.id;

            return (
              <div
                key={layout.id}
                className={`grid-preset-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectLayout(layout.id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLayout(layout.id);
                  }
                }}
              >
                {/* Active Check Indicator */}
                <div className={`grid-preset-check ${isSelected ? 'active' : ''}`}>
                  {isSelected && <FiCheck size={11} strokeWidth={3} />}
                </div>

                {/* Mobile Post Frame Mockup (Matching Image 2) */}
                <div className="social-post-mockup">
                  {/* Avatar & Header bar */}
                  <div className="mockup-header">
                    <div className="mockup-avatar" />
                    <div className="mockup-line" />
                  </div>

                  {/* Tile Graphic based on layout id */}
                  <div className={`mockup-body mockup-${layout.id}`}>
                    {layout.id === 'one-square' && (
                      <div className="mockup-tile tile-full" />
                    )}

                    {layout.id === 'two-squares' && (
                      <div className="mockup-row row-two">
                        <div className="mockup-tile" />
                        <div className="mockup-tile" />
                      </div>
                    )}

                    {layout.id === 'three-squares' && (
                      <div className="mockup-col col-three">
                        <div className="mockup-tile tile-banner" />
                        <div className="mockup-row row-half">
                          <div className="mockup-tile" />
                          <div className="mockup-tile" />
                        </div>
                      </div>
                    )}

                    {layout.id === 'four-squares' && (
                      <div className="mockup-grid grid-2x2">
                        <div className="mockup-tile" />
                        <div className="mockup-tile" />
                        <div className="mockup-tile" />
                        <div className="mockup-tile" />
                      </div>
                    )}

                    {layout.id === 'five-squares' && (
                      <div className="mockup-col col-five">
                        <div className="mockup-row row-two-top">
                          <div className="mockup-tile" />
                          <div className="mockup-tile" />
                        </div>
                        <div className="mockup-row row-three-bottom">
                          <div className="mockup-tile" />
                          <div className="mockup-tile" />
                          <div className="mockup-tile" />
                        </div>
                      </div>
                    )}

                    {layout.id === 'six-squares' && (
                      <div className="mockup-col col-six">
                        <div className="mockup-row row-two-top">
                          <div className="mockup-tile" />
                          <div className="mockup-tile" />
                        </div>
                        <div className="mockup-row row-three-bottom">
                          <div className="mockup-tile" />
                          <div className="mockup-tile" />
                          <div className="mockup-tile tile-plus-one">
                            <span>+1</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Italic Title matching Image 2 */}
                <span className="grid-preset-label">{layout.name}</span>
                <span className="grid-preset-sub">{layout.subtitle}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus / Alignment Anchor */}
      <div className="grid-focus-section">
        <div className="focus-selector-header">
          <span className="focus-selector-title">Crop Alignment Anchor</span>
          <span className="focus-selector-current">{focusLabel}</span>
        </div>

        <div className="focus-grid-layout">
          <div className="focus-3x3-grid" role="group" aria-label="Crop Anchor Position">
            {FOCUS_CELLS.map((cell) => {
              const isActive = focus === cell.key;
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`focus-cell-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSetFocus(cell.key)}
                  title={`Anchor: ${cell.label}`}
                  aria-pressed={isActive}
                >
                  <span className="focus-cell-dot" />
                </button>
              );
            })}
          </div>

          <p className="focus-explanation">
            Anchors the crop box on your source photo before slicing into {currentLayout.tileCount} tiles.
          </p>
        </div>
      </div>

      {/* Slicing Action Box */}
      <div className="grid-slice-action-box">
        {activeImage ? (
          <>
            <div className="grid-slice-meta-row">
              <span className="meta-source-name" title={activeImage.name}>
                Source: <strong>{activeImage.name}</strong>
              </span>
              <span className="meta-tile-badge">
                {currentLayout.tileCount} Tiles ({currentLayout.name})
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              className="slice-action-btn"
              iconLeft={<FiScissors size={15} />}
              loading={isSlicing}
              onClick={onSliceImage}
              title={`Slice image into ${currentLayout.tileCount} tiles and add to workspace`}
            >
              {isSlicing ? 'Slicing Canvas...' : `Slice into ${currentLayout.tileCount} Tiles & Add to Workspace`}
            </Button>

            <button
              type="button"
              className="change-source-image-btn"
              onClick={onTriggerSingleUpload}
            >
              <FiUploadCloud size={13} />
              <span>Upload Different Single Image</span>
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
              Upload Single Photo
            </Button>
          </div>
        )}
      </div>

      {/* Social Media Export Hint */}
      <div className="grid-hint-card">
        <FiInfo className="grid-hint-icon" />
        <span>
          <strong>Social Tip:</strong> After slicing, you can add watermarks or logos to all tiles and click <strong>Download All</strong> to get a sequentially numbered batch ready for Facebook or Instagram.
        </span>
      </div>
    </div>
  );
}
