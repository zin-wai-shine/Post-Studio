import React, { useState, useEffect } from 'react';
import { FiImage, FiCrop, FiMove, FiSliders, FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Slider } from '../common/Slider';
import { Select } from '../common/Select';
import { PositionGrid } from './PositionGrid';
import { WatermarkUploader } from './WatermarkUploader';
import { SavedWatermarks } from './SavedWatermarks';
import { ExportControls } from './ExportControls';
import { CropControls } from './CropControls';
import { WATERMARK_STYLES } from '../../constants/watermark';
import './WatermarkControls.css';

const FONT_WEIGHT_OPTIONS = [
  { id: '400', label: 'Regular (400)' },
  { id: '500', label: 'Medium (500)' },
  { id: '600', label: 'Semi-Bold (600)' },
  { id: '700', label: 'Bold (700)' }
];

const SECTIONS = [
  { id: 'watermark', label: 'Watermark', shortLabel: 'Logo/Text', icon: <FiImage className="tab-nav-icon" /> },
  { id: 'crop', label: 'Crop & Size', shortLabel: 'Crop', icon: <FiCrop className="tab-nav-icon" /> },
  { id: 'position', label: 'Position', shortLabel: 'Position', icon: <FiMove className="tab-nav-icon" /> },
  { id: 'appearance', label: 'Appearance', shortLabel: 'Style', icon: <FiSliders className="tab-nav-icon" /> },
  { id: 'export', label: 'Export', shortLabel: 'Export', icon: <FiDownload className="tab-nav-icon" /> }
];

export function WatermarkControls({
  settings,
  cropSettings,
  exportSettings,
  activeWatermark,
  savedWatermarks,
  isSavedLoading,
  activeImage,
  onUpdateSetting,
  onUpdatePatternSetting,
  onSetPositionPreset,
  onUpdateCropSetting,
  onSetCropPreset,
  onSetCropFocus,
  onUpdateExportSetting,
  onSetTemporaryWatermark,
  onSaveAndSelectWatermark,
  onSelectSavedWatermark,
  onDeleteSavedWatermark,
  onRenameSavedWatermark,
  onClearWatermark,
  onDownloadSingle,
  onDownloadAll,
  isExportingSingle,
  isExportingBatch,
  hasActiveImage,
  totalImagesCount,
  batchPrefix = 'XEA',
  onRegeneratePrefix,
  autoClearAfterDownload = false,
  onToggleAutoClear
}) {
  const [activeSection, setActiveSection] = useState('watermark');
  // Putup box is OPEN by default on mobile so user sees the controls clearly
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  const isSingle = settings.style === 'single';

  return (
    <div className={`controls-panel ${isMobileCollapsed ? 'mobile-collapsed' : 'mobile-open'}`}>
      {/* Mobile Drawer Grab Handle */}
      <div
        className="mobile-sheet-handle-bar"
        onClick={() => setIsMobileCollapsed((prev) => !prev)}
        aria-label="Toggle adjustment panel"
        role="button"
        tabIndex={0}
      >
        <div className="mobile-sheet-handle" />
      </div>

      <div
        className="controls-header"
        onClick={() => {
          if (isMobileCollapsed) setIsMobileCollapsed(false);
        }}
      >
        <div className="controls-header-left">
          <h2 className="controls-title">CONTROLS</h2>
          <span className="controls-active-badge">
            {SECTIONS.find((s) => s.id === activeSection)?.label}
          </span>
        </div>

        <button
          type="button"
          className="mobile-collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileCollapsed((prev) => !prev);
          }}
          aria-label={isMobileCollapsed ? "Show controls" : "Hide controls"}
        >
          {isMobileCollapsed ? (
            <>
              <FiChevronUp size={15} />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <FiChevronDown size={15} />
              <span>Hide Controls</span>
            </>
          )}
        </button>
      </div>

      {/* Section Navigation Menu */}
      <div className="controls-tab-menu" role="tablist" aria-label="Control Sections">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            role="tab"
            aria-selected={activeSection === sec.id}
            className={`tab-nav-btn ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(sec.id);
              if (isMobileCollapsed) setIsMobileCollapsed(false);
            }}
          >
            {sec.icon}
            <span className="tab-label-full">{sec.label}</span>
            <span className="tab-label-short">{sec.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Tab Content - Zero Scrolling on desktop, independent internal scrolling on mobile */}
      <div className="controls-tab-content">
        {/* 1. Watermark Section (Logo / Text) */}
        {activeSection === 'watermark' && (
          <div className="section-pane">
            <div className="section-label">Source Type</div>
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-toggle-btn ${settings.type === 'image' ? 'active' : ''}`}
                onClick={() => onUpdateSetting('type', 'image')}
              >
                Logo Watermark
              </button>
              <button
                type="button"
                className={`type-toggle-btn ${settings.type === 'text' ? 'active' : ''}`}
                onClick={() => onUpdateSetting('type', 'text')}
              >
                Text Watermark
              </button>
            </div>

            {settings.type === 'image' ? (
              <>
                <WatermarkUploader
                  onSetTemporaryWatermark={onSetTemporaryWatermark}
                  onSaveAndSelectWatermark={onSaveAndSelectWatermark}
                />
                <SavedWatermarks
                  savedWatermarks={savedWatermarks}
                  activeWatermarkId={activeWatermark?.id}
                  onSelectWatermark={onSelectSavedWatermark}
                  onDeleteWatermark={onDeleteSavedWatermark}
                  onRenameWatermark={onRenameSavedWatermark}
                  loading={isSavedLoading}
                />
              </>
            ) : (
              <div className="text-inputs-wrap">
                <div>
                  <label className="text-sm font-medium" htmlFor="text-wm-input">
                    Watermark Text
                  </label>
                  <input
                    id="text-wm-input"
                    type="text"
                    value={settings.text || ''}
                    onChange={(e) => onUpdateSetting('text', e.target.value)}
                    placeholder="Enter watermark text..."
                    className="text-field-input"
                  />
                </div>

                <Select
                  label="Font Weight"
                  value={settings.fontWeight || '600'}
                  onChange={(val) => onUpdateSetting('fontWeight', val)}
                  options={FONT_WEIGHT_OPTIONS}
                />

                <div className="color-picker-row">
                  <span>Text Color</span>
                  <input
                    type="color"
                    value={settings.textColor || '#FFFFFF'}
                    onChange={(e) => onUpdateSetting('textColor', e.target.value)}
                    className="color-picker-input"
                    title="Choose text watermark color"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Crop & Standardize Size Section */}
        {activeSection === 'crop' && (
          <CropControls
            cropSettings={cropSettings}
            onUpdateCropSetting={onUpdateCropSetting}
            onSetCropPreset={onSetCropPreset}
            onSetCropFocus={onSetCropFocus}
            totalImagesCount={totalImagesCount}
            activeImage={activeImage}
          />
        )}

        {/* 3. Position & Style Section */}
        {activeSection === 'position' && (
          <div className="section-pane">
            <Select
              label="Watermark Style"
              value={settings.style}
              onChange={(val) => onUpdateSetting('style', val)}
              options={WATERMARK_STYLES}
            />

            {isSingle ? (
              <>
                <PositionGrid
                  currentPreset={settings.position?.preset}
                  onSelectPreset={onSetPositionPreset}
                />
                <Slider
                  label="Edge Margin"
                  value={Math.round((settings.edgePadding ?? 0.03) * 100)}
                  onChange={(val) => onUpdateSetting('edgePadding', val / 100)}
                  min={0}
                  max={20}
                  step={1}
                  unit="%"
                  defaultValue={3}
                  onReset={(val) => onUpdateSetting('edgePadding', val / 100)}
                />
              </>
            ) : (
              <>
                <Slider
                  label="Pattern Angle"
                  value={settings.pattern?.rotation ?? -30}
                  onChange={(val) => onUpdatePatternSetting('rotation', val)}
                  min={-180}
                  max={180}
                  step={5}
                  unit="°"
                  defaultValue={-30}
                  onReset={(val) => onUpdatePatternSetting('rotation', val)}
                />
                <Slider
                  label="Horizontal Spacing"
                  value={Math.round((settings.pattern?.horizontalGap ?? 0.15) * 100)}
                  onChange={(val) => onUpdatePatternSetting('horizontalGap', val / 100)}
                  min={5}
                  max={40}
                  step={1}
                  unit="%"
                  defaultValue={15}
                  onReset={(val) => onUpdatePatternSetting('horizontalGap', val / 100)}
                />
                <Slider
                  label="Vertical Spacing"
                  value={Math.round((settings.pattern?.verticalGap ?? 0.15) * 100)}
                  onChange={(val) => onUpdatePatternSetting('verticalGap', val / 100)}
                  min={5}
                  max={40}
                  step={1}
                  unit="%"
                  defaultValue={15}
                  onReset={(val) => onUpdatePatternSetting('verticalGap', val / 100)}
                />
              </>
            )}
          </div>
        )}

        {/* 3. Appearance Section (Size, Opacity, Rotation) */}
        {activeSection === 'appearance' && (
          <div className="section-pane">
            <Slider
              label="Size"
              value={Math.round((settings.size || 0.20) * 100)}
              onChange={(val) => onUpdateSetting('size', val / 100)}
              min={5}
              max={80}
              step={1}
              unit="%"
              defaultValue={20}
              onReset={(val) => onUpdateSetting('size', val / 100)}
            />

            <Slider
              label="Opacity"
              value={Math.round((settings.opacity || 0.80) * 100)}
              onChange={(val) => onUpdateSetting('opacity', val / 100)}
              min={5}
              max={100}
              step={1}
              unit="%"
              defaultValue={80}
              onReset={(val) => onUpdateSetting('opacity', val / 100)}
            />

            <Slider
              label="Rotation"
              value={settings.rotation || 0}
              onChange={(val) => onUpdateSetting('rotation', val)}
              min={-180}
              max={180}
              step={1}
              unit="°"
              defaultValue={0}
              onReset={(val) => onUpdateSetting('rotation', val)}
            />
          </div>
        )}

        {/* 4. Export Section */}
        {activeSection === 'export' && (
          <div className="section-pane">
            <ExportControls
              exportSettings={exportSettings}
              onChangeExportSettings={onUpdateExportSetting}
              onDownloadSingle={onDownloadSingle}
              onDownloadAll={onDownloadAll}
              isExportingSingle={isExportingSingle}
              isExportingBatch={isExportingBatch}
              hasActiveImage={hasActiveImage}
              totalImagesCount={totalImagesCount}
              batchPrefix={batchPrefix}
              onRegeneratePrefix={onRegeneratePrefix}
              autoClearAfterDownload={autoClearAfterDownload}
              onToggleAutoClear={onToggleAutoClear}
            />
          </div>
        )}
      </div>
    </div>
  );
}
