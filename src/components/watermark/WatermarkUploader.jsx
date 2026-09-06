import React, { useRef, useState } from 'react';
import { FiUpload, FiX, FiSave, FiClock } from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { isValidImageFile } from '../../utils/imageUtils';
import './WatermarkUploader.css';

export function WatermarkUploader({
  onSetTemporaryWatermark,
  onSaveAndSelectWatermark
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

      {/* 1. Pending file uploaded - Ask inline: Name, Save or Use Temporarily */}
      {pendingPreview ? (
        <div className="wm-pending-box">
          <div className="wm-pending-header">
            <img
              src={pendingPreview}
              alt="Uploaded Watermark Preview"
              className="wm-pending-thumb"
            />
            <div className="wm-pending-info">
              <label htmlFor="pending-name-input" className="sr-only">
                Watermark Name
              </label>
              <input
                id="pending-name-input"
                type="text"
                value={watermarkName}
                onChange={(e) => setWatermarkName(e.target.value)}
                placeholder="Name your watermark..."
                className="wm-name-input"
                autoFocus
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
      ) : (
        /* Only have the upload button */
        <div className="wm-upload-btn-wrap">
          <Button
            variant="secondary"
            size="md"
            iconLeft={<FiUpload size={14} />}
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            title="Upload watermark image"
          >
            Upload Watermark Logo
          </Button>
        </div>
      )}
    </div>
  );
}
