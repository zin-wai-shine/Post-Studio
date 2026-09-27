import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Slider } from '../common/Slider';
import { Select } from '../common/Select';
import { ImagePreview } from '../watermark/ImagePreview';
import {
  POSITION_PRESETS,
  BORDER_STYLES,
  EXPORT_FORMATS,
  DEFAULT_WATERMARK_SETTINGS,
  DEFAULT_CROP_SETTINGS,
  DEFAULT_EXPORT_SETTINGS
} from '../../constants/watermark';
import { generatePresetFilename } from '../../utils/presetUtils';
import { FiTag, FiImage, FiCrop, FiSliders, FiCheck, FiUploadCloud, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './PresetModal.css';

const PRESET_RATIOS = [
  { id: 'original', name: 'Original', sub: 'No Crop' },
  { id: '4:5', name: '4:5 Portrait', sub: '1080 × 1350' },
  { id: '1:1', name: '1:1 Square', sub: '1080 × 1080' },
  { id: '16:9', name: '16:9 Web', sub: '1920 × 1080' },
  { id: '4:3', name: '4:3 Listing', sub: '1440 × 1080' },
  { id: '9:16', name: '9:16 Story', sub: '1080 × 1920' }
];

const PRESET_COLORS = [
  { label: 'Amber Gold', value: '#D97706' },
  { label: 'Crimson Red', value: '#C0392B' },
  { label: 'Pure White', value: '#FFFFFF' },
  { label: 'Deep Black', value: '#111111' },
  { label: 'Cyan Accent', value: '#06B6D4' }
];

const DEFAULT_FALLBACK_IMAGE = {
  id: 'preset_preview_demo',
  name: 'Demo Property Interior.jpg',
  previewUrl: '/demo-assets/living-room.jpg',
  width: 1920,
  height: 1280,
  aspectRatio: 1.5
};

export function PresetModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  savedWatermarks = [],
  activeImage = null,
  images = []
}) {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('BOL');
  const [watermarkType, setWatermarkType] = useState('text');
  const [selectedWatermarkId, setSelectedWatermarkId] = useState('');
  const [watermarkText, setWatermarkText] = useState('POFIX');
  const [watermarkSize, setWatermarkSize] = useState(0.20);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.85);
  const [positionKey, setPositionKey] = useState('bottom-right');
  const [cropPreset, setCropPreset] = useState('4:5');
  const [borderStyle, setBorderStyle] = useState('none');
  const [borderColor, setBorderColor] = useState('#D97706');
  const [borderSize, setBorderSize] = useState(10);
  const [exportFormat, setExportFormat] = useState('jpeg');
  const [uploadedLogo, setUploadedLogo] = useState(null); // { file, previewUrl, name }
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const fileInputRef = useRef(null);

  // Sync state when opened or initialData changes
  useEffect(() => {
    if (isOpen) {
      setPreviewImageIndex(0);
      if (initialData) {
        setName(initialData.name || '');
        setPrefix((initialData.prefix || 'BOL').toUpperCase().slice(0, 5));
        const wmSettings = initialData.settings || {};
        setWatermarkType(wmSettings.type || (wmSettings.watermarkId ? 'image' : 'text'));
        setSelectedWatermarkId(wmSettings.watermarkId || '');
        setWatermarkText(wmSettings.text || 'POFIX');
        setWatermarkSize(wmSettings.size ?? 0.20);
        setWatermarkOpacity(wmSettings.opacity ?? 0.85);
        setPositionKey(wmSettings.position?.preset || 'bottom-right');
        
        const crop = initialData.cropSettings || {};
        setCropPreset(crop.enabled ? (crop.preset || '4:5') : 'original');

        const border = wmSettings.border || {};
        setBorderStyle(border.style || 'none');
        setBorderColor(border.color || '#D97706');
        setBorderSize(border.size || 10);

        setExportFormat(initialData.exportSettings?.format || 'jpeg');
      } else {
        setName('');
        setPrefix('BOL');
        setWatermarkType(savedWatermarks.length > 0 ? 'image' : 'text');
        setSelectedWatermarkId(savedWatermarks[0]?.id || '');
        setWatermarkText('POFIX');
        setWatermarkSize(0.20);
        setWatermarkOpacity(0.85);
        setPositionKey('bottom-right');
        setCropPreset('4:5');
        setBorderStyle('none');
        setBorderColor('#D97706');
        setBorderSize(10);
        setExportFormat('jpeg');
        setUploadedLogo(null);
      }
    }
  }, [isOpen, initialData, savedWatermarks]);

  const handlePrefixChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setPrefix(val);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedLogo({
        file,
        previewUrl: url,
        name: file.name
      });
      setWatermarkType('image');
    }
  };

  // Determine which image to preview
  const currentPreviewImage = useMemo(() => {
    if (images && images.length > 0) {
      return images[previewImageIndex] || images[0];
    }
    if (activeImage) {
      return activeImage;
    }
    return DEFAULT_FALLBACK_IMAGE;
  }, [images, previewImageIndex, activeImage]);

  // Live crop settings for live canvas preview
  const liveCropSettings = useMemo(() => {
    switch (cropPreset) {
      case '4:5':
        return {
          enabled: true,
          preset: '4:5',
          width: 1080,
          height: 1350,
          aspect: 4 / 5,
          label: '4:5 Portrait',
          fitMode: 'cover',
          focus: 'center',
          focusX: 0.5,
          focusY: 0.5
        };
      case '1:1':
        return {
          enabled: true,
          preset: '1:1',
          width: 1080,
          height: 1080,
          aspect: 1,
          label: '1:1 Square',
          fitMode: 'cover',
          focus: 'center',
          focusX: 0.5,
          focusY: 0.5
        };
      case '16:9':
        return {
          enabled: true,
          preset: '16:9',
          width: 1920,
          height: 1080,
          aspect: 16 / 9,
          label: '16:9 Web',
          fitMode: 'cover',
          focus: 'center',
          focusX: 0.5,
          focusY: 0.5
        };
      case '4:3':
        return {
          enabled: true,
          preset: '4:3',
          width: 1440,
          height: 1080,
          aspect: 4 / 3,
          label: '4:3 Listing',
          fitMode: 'cover',
          focus: 'center',
          focusX: 0.5,
          focusY: 0.5
        };
      case '9:16':
        return {
          enabled: true,
          preset: '9:16',
          width: 1080,
          height: 1920,
          aspect: 9 / 16,
          label: '9:16 Story',
          fitMode: 'cover',
          focus: 'center',
          focusX: 0.5,
          focusY: 0.5
        };
      case 'original':
      default:
        return {
          enabled: false,
          preset: 'original',
          aspect: null,
          label: 'Original Size',
          fitMode: 'contain',
          focus: 'center',
          focusX: 0.5,
          focusY: 0.5
        };
    }
  }, [cropPreset]);

  // Live watermark preview URL
  const liveWatermarkUrl = useMemo(() => {
    if (watermarkType !== 'image') return null;
    if (uploadedLogo) return uploadedLogo.previewUrl;
    const found = savedWatermarks.find((w) => w.id === selectedWatermarkId);
    return found?.previewUrl || (found?.blob ? URL.createObjectURL(found.blob) : null);
  }, [watermarkType, uploadedLogo, savedWatermarks, selectedWatermarkId]);

  // Live settings for preview
  const liveSettings = useMemo(() => {
    const pos = POSITION_PRESETS[positionKey] || POSITION_PRESETS['bottom-right'];
    return {
      ...DEFAULT_WATERMARK_SETTINGS,
      enabled: true,
      style: 'single',
      type: watermarkType,
      text: watermarkText,
      size: watermarkSize,
      opacity: watermarkOpacity,
      position: {
        preset: positionKey,
        x: pos.x,
        y: pos.y
      },
      border: {
        style: borderStyle,
        size: borderSize,
        color: borderColor,
        shadowEnabled: true
      }
    };
  }, [watermarkType, watermarkText, watermarkSize, watermarkOpacity, positionKey, borderStyle, borderSize, borderColor]);

  const handleSave = () => {
    const cleanPrefix = (prefix || 'BOL').trim().toUpperCase();
    const finalName = name.trim() || `${cleanPrefix} Style Preset`;

    // Resolve watermark preview
    let watermarkPreviewUrl = null;
    let watermarkId = null;
    let watermarkName = null;

    if (watermarkType === 'image') {
      if (uploadedLogo) {
        watermarkPreviewUrl = uploadedLogo.previewUrl;
        watermarkName = uploadedLogo.name;
      } else {
        const found = savedWatermarks.find((w) => w.id === selectedWatermarkId);
        if (found) {
          watermarkPreviewUrl = found.previewUrl || (found.blob ? URL.createObjectURL(found.blob) : null);
          watermarkId = found.id;
          watermarkName = found.name;
        }
      }
    }

    const pos = POSITION_PRESETS[positionKey] || POSITION_PRESETS['bottom-right'];

    // Crop settings
    let finalCropSettings = { ...DEFAULT_CROP_SETTINGS };
    if (cropPreset === 'original') {
      finalCropSettings = {
        ...DEFAULT_CROP_SETTINGS,
        enabled: false,
        preset: 'original',
        aspect: null
      };
    } else if (cropPreset === '4:5') {
      finalCropSettings = {
        ...DEFAULT_CROP_SETTINGS,
        enabled: true,
        preset: '4:5',
        width: 1080,
        height: 1350,
        aspect: 4 / 5
      };
    } else if (cropPreset === '1:1') {
      finalCropSettings = {
        ...DEFAULT_CROP_SETTINGS,
        enabled: true,
        preset: '1:1',
        width: 1080,
        height: 1080,
        aspect: 1
      };
    } else if (cropPreset === '16:9') {
      finalCropSettings = {
        ...DEFAULT_CROP_SETTINGS,
        enabled: true,
        preset: '16:9',
        width: 1920,
        height: 1080,
        aspect: 16 / 9
      };
    } else if (cropPreset === '4:3') {
      finalCropSettings = {
        ...DEFAULT_CROP_SETTINGS,
        enabled: true,
        preset: '4:3',
        width: 1440,
        height: 1080,
        aspect: 4 / 3
      };
    } else if (cropPreset === '9:16') {
      finalCropSettings = {
        ...DEFAULT_CROP_SETTINGS,
        enabled: true,
        preset: '9:16',
        width: 1080,
        height: 1920,
        aspect: 9 / 16
      };
    }

    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: finalName,
      prefix: cleanPrefix,
      watermarkType,
      watermarkId,
      watermarkName,
      watermarkPreviewUrl,
      settings: {
        ...DEFAULT_WATERMARK_SETTINGS,
        enabled: true,
        type: watermarkType,
        text: watermarkText,
        watermarkId,
        size: watermarkSize,
        opacity: watermarkOpacity,
        position: {
          preset: positionKey,
          x: pos.x,
          y: pos.y
        },
        border: {
          style: borderStyle,
          size: borderSize,
          color: borderColor,
          shadowEnabled: true
        }
      },
      cropSettings: finalCropSettings,
      exportSettings: {
        ...DEFAULT_EXPORT_SETTINGS,
        format: exportFormat,
        quality: 0.92
      }
    };

    onSave(payload);
    onClose();
  };

  const sampleFilename = generatePresetFilename(prefix || 'BOL', `.${exportFormat === 'original' ? 'jpg' : exportFormat}`);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Preset Style' : 'Create Ready-to-Use Preset'}
      maxWidth="1100px"
      className="preset-edit-modal-wrapper"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} icon={<FiCheck />}>
            {initialData?.id ? 'Update Preset' : 'Save Preset'}
          </Button>
        </div>
      }
    >
      <div className="preset-modal-layout">
        {/* Left Column: Form Controls */}
        <div className="preset-modal-controls-pane">
          {/* Section 1: Identification & Filename Prefix */}
          <div className="preset-modal-section">
            <div className="preset-modal-section-title">
              <FiTag /> Preset Details & Image Naming Prefix
            </div>
            <div className="preset-form-row">
              <div className="preset-form-group">
                <label className="preset-form-label">Preset Name</label>
                <input
                  type="text"
                  className="preset-form-input"
                  placeholder="e.g. BOL Portrait Listing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="preset-form-group" style={{ flex: '0 0 auto' }}>
                <label className="preset-form-label">3-Letter Prefix</label>
                <input
                  type="text"
                  className="preset-form-input preset-prefix-input"
                  placeholder="BOL"
                  maxLength={4}
                  value={prefix}
                  onChange={handlePrefixChange}
                />
              </div>
            </div>

            <div className="preset-filename-preview-box">
              <span className="preset-filename-tag">Auto Filename Format:</span>
              <code className="preset-filename-code">{sampleFilename}</code>
            </div>
          </div>

          {/* Section 2: Watermark Setup */}
          <div className="preset-modal-section">
            <div className="preset-modal-section-title">
              <FiImage /> Watermark Setup
            </div>

            <div className="preset-toggle-group">
              <button
                type="button"
                className={`preset-toggle-btn ${watermarkType === 'text' ? 'active' : ''}`}
                onClick={() => setWatermarkType('text')}
              >
                Text Watermark
              </button>
              <button
                type="button"
                className={`preset-toggle-btn ${watermarkType === 'image' ? 'active' : ''}`}
                onClick={() => setWatermarkType('image')}
              >
                Logo Image
              </button>
            </div>

            {watermarkType === 'text' ? (
              <div className="preset-form-group">
                <label className="preset-form-label">Watermark Text</label>
                <input
                  type="text"
                  className="preset-form-input"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. POFIX • BOL"
                />
              </div>
            ) : (
              <div className="preset-form-group">
                <label className="preset-form-label">Select Watermark Logo</label>
                <div className="preset-wm-list">
                  {savedWatermarks.map((wm) => {
                    const isSel = selectedWatermarkId === wm.id && !uploadedLogo;
                    return (
                      <div
                        key={wm.id}
                        className={`preset-wm-item ${isSel ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedWatermarkId(wm.id);
                          setUploadedLogo(null);
                        }}
                      >
                        {wm.previewUrl && (
                          <img src={wm.previewUrl} alt={wm.name} className="preset-wm-thumb" />
                        )}
                        <span className="preset-wm-name">{wm.name}</span>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className={`preset-wm-item ${uploadedLogo ? 'active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ borderStyle: 'dashed' }}
                  >
                    <FiUploadCloud size={16} />
                    <span className="preset-wm-name">
                      {uploadedLogo ? uploadedLogo.name : '+ Upload Logo'}
                    </span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            )}

            <div className="preset-form-row" style={{ marginTop: '8px' }}>
              <div className="preset-form-group">
                <Slider
                  label="Watermark Size"
                  value={Math.round(watermarkSize * 100)}
                  min={8}
                  max={50}
                  step={1}
                  unit="%"
                  onChange={(val) => setWatermarkSize(val / 100)}
                />
              </div>

              <div className="preset-form-group">
                <Slider
                  label="Opacity"
                  value={Math.round(watermarkOpacity * 100)}
                  min={10}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={(val) => setWatermarkOpacity(val / 100)}
                />
              </div>
            </div>

            {/* Position Selector */}
            <div className="preset-form-group">
              <label className="preset-form-label">Watermark Position</label>
              <div className="preset-pos-grid">
                {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((k) => (
                  <div
                    key={k}
                    className={`preset-pos-cell ${positionKey === k ? 'active' : ''}`}
                    onClick={() => setPositionKey(k)}
                    title={k}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Crop & Aspect Ratio */}
          <div className="preset-modal-section">
            <div className="preset-modal-section-title">
              <FiCrop /> Crop & Standardize Ratio
            </div>
            <div className="preset-ratio-grid">
              {PRESET_RATIOS.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={`preset-ratio-btn ${cropPreset === r.id ? 'active' : ''}`}
                  onClick={() => setCropPreset(r.id)}
                >
                  <span className="preset-ratio-name">{r.name}</span>
                  <span className="preset-ratio-sub">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Image Border Style */}
          <div className="preset-modal-section">
            <div className="preset-modal-section-title">
              <FiSliders /> Image Frame / Border
            </div>
            <div className="preset-form-row">
              <div className="preset-form-group">
                <label className="preset-form-label">Border Style</label>
                <select
                  className="preset-form-input"
                  value={borderStyle}
                  onChange={(e) => setBorderStyle(e.target.value)}
                >
                  {BORDER_STYLES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {borderStyle !== 'none' && (
                <div className="preset-form-group">
                  <label className="preset-form-label">Border Accent Color</label>
                  <div className="preset-color-chips">
                    {PRESET_COLORS.map((c) => (
                      <div
                        key={c.value}
                        className={`preset-color-chip ${borderColor === c.value ? 'active' : ''}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setBorderColor(c.value)}
                        title={c.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="Custom color"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Export Format */}
          <div className="preset-modal-section">
            <div className="preset-modal-section-title">
              <FiTag /> Export File Format
            </div>
            <div className="preset-form-group">
              <select
                className="preset-form-input"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                {EXPORT_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Live Style & Crop Preview */}
        <div className="preset-modal-preview-pane">
          <div className="preset-modal-preview-header">
            <div className="preset-modal-preview-title">
              <FiEye size={14} /> Live Style Preview
            </div>
            <div className="preset-modal-preview-badges">
              <span className="preset-card-badge">
                {liveCropSettings.label} {liveCropSettings.width ? `(${liveCropSettings.width}×${liveCropSettings.height})` : ''}
              </span>
              <span className="preset-card-filename-badge">{sampleFilename}</span>
            </div>
          </div>

          <div className="preset-modal-preview-viewport-wrap">
            <ImagePreview
              activeImage={currentPreviewImage}
              watermarkSource={liveWatermarkUrl}
              settings={liveSettings}
              cropSettings={liveCropSettings}
              hideTopbar={true}
            />
          </div>

          <div className="preset-modal-preview-footer">
            <div className="preset-modal-preview-source-info" title={currentPreviewImage.name}>
              <span className="preset-modal-preview-indicator" />
              <span>{currentPreviewImage.name}</span>
            </div>

            {images && images.length > 1 && (
              <div className="preset-modal-photo-pager">
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={previewImageIndex <= 0}
                  onClick={() => setPreviewImageIndex((i) => Math.max(0, i - 1))}
                  icon={<FiChevronLeft size={13} />}
                >
                  Prev
                </Button>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                  {previewImageIndex + 1} / {images.length}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={previewImageIndex >= images.length - 1}
                  onClick={() => setPreviewImageIndex((i) => Math.min(images.length - 1, i + 1))}
                  icon={<FiChevronRight size={13} />}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
