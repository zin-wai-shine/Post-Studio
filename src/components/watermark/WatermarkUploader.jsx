import React, { useRef, useState } from 'react';
import { FiUpload, FiCheck, FiX, FiSave, FiClock } from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { isValidImageFile } from '../../utils/imageUtils';
import './WatermarkUploader.css';

export function WatermarkUploader({
  activeWatermark, // { id, name, previewUrl, isTemporary }
  onSetTemporaryWatermark,
  onSaveAndSelectWatermark,
  onClearWatermark
}) {
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [watermarkName, setWatermarkName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      alert('Please upload a valid PNG, JPG, or WEBP image.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreview(preview);
    setWatermarkName(file.name.replace(/\.[^/.]+$/, ''));
    e.target.value = '';
  };

  const handleCancelPending = () => {
    if (pendingPreview) {
      URL.revokeObjectURL(pendingPreview);
    }
    setPendingFile(null);
    setPendingPreview(null);
    setWatermarkName('');
  };

  const handleUseTemporarily = () => {
    if (!pendingFile || !pendingPreview) return;
    onSetTemporaryWatermark({
      id: `temp_${Date.now()}`,
      name: watermarkName || 'Temporary Logo',
      previewUrl: pendingPreview,
      file: pendingFile,
      isTemporary: true
    });
    setPendingFile(null);
    setPendingPreview(null);
    setWatermarkName('');
  };

  const handleSaveToLibrary = async () => {
    if (!pendingFile) return;
    try {
      setIsSaving(true);
      await onSaveAndSelectWatermark({
        name: watermarkName || 'Watermark Logo',
        blob: pendingFile,
        mimeType: pendingFile.type
      });
      handleCancelPending();
    } catch (err) {
      console.error('Failed to save watermark:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="watermark-uploader">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* 1. Pending file uploaded - Ask inline: Save or Use Temporarily */}
      {pendingPreview ? (
        <div className="wm-pending-box">
          <div className="wm-pending-header">
            <img
              src={pendingPreview}
              alt="Uploaded Watermark Preview"
              className="wm-pending-thumb"
            />
            <div className="wm-pending-info">
              <input
                type="text"
                value={watermarkName}
                onChange={(e) => setWatermarkName(e.target.value)}
                placeholder="Watermark name"
                className="wm-name-input"
              />
            </div>
            <IconButton
              icon={<FiX size={14} />}
              size="sm"
              onClick={handleCancelPending}
              aria-label="Cancel upload"
            />
          </div>

          <div className="wm-pending-actions">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<FiSave size={12} />}
              loading={isSaving}
              onClick={handleSaveToLibrary}
            >
              Save to Library
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<FiClock size={12} />}
              disabled={isSaving}
              onClick={handleUseTemporarily}
            >
              Use Temporarily
            </Button>
          </div>
        </div>
      ) : activeWatermark ? (
        /* 2. Currently active watermark card */
        <div className="wm-active-card">
          <div className="wm-active-details">
            <img
              src={activeWatermark.previewUrl}
              alt={activeWatermark.name}
              className="wm-active-thumb"
            />
            <div>
              <div className="wm-active-name">{activeWatermark.name}</div>
              <div className="wm-active-tag">
                {activeWatermark.isTemporary ? 'Temporary logo' : 'Saved in library'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <IconButton
              icon={<FiX size={14} />}
              size="sm"
              onClick={onClearWatermark}
              aria-label="Remove active watermark"
            />
          </div>
        </div>
      ) : (
        /* 3. Empty drop/click zone */
        <div
          className="wm-drop-zone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <FiUpload size={18} className="wm-drop-icon" />
          <span className="wm-drop-title">Upload Watermark Logo</span>
          <span className="wm-drop-hint">PNG (transparent recommended), JPG, WEBP</span>
        </div>
      )}
    </div>
  );
}
