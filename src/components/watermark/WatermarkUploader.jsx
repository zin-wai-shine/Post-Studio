import React, { useRef, useState, useEffect } from 'react';
import { FiUpload, FiCheck, FiX, FiSave, FiClock, FiEdit2, FiPlus } from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { isValidImageFile } from '../../utils/imageUtils';
import './WatermarkUploader.css';

export function WatermarkUploader({
  activeWatermark, // { id, name, previewUrl, isTemporary }
  onSetTemporaryWatermark,
  onSaveAndSelectWatermark,
  onClearWatermark,
  onRenameWatermark
}) {
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [watermarkName, setWatermarkName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Inline rename state for active watermark
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [activeNameInput, setActiveNameInput] = useState('');

  useEffect(() => {
    if (activeWatermark) {
      setActiveNameInput(activeWatermark.name || '');
    }
  }, [activeWatermark]);

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

  const handleSaveActiveRename = () => {
    if (activeWatermark && activeNameInput.trim() && onRenameWatermark) {
      onRenameWatermark(activeWatermark.id, activeNameInput.trim());
    }
    setIsEditingActive(false);
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
      ) : activeWatermark ? (
        /* 2. Currently active watermark card with inline rename & add more */
        <div className="wm-active-card">
          <div className="wm-active-details">
            <img
              src={activeWatermark.previewUrl}
              alt={activeWatermark.name}
              className="wm-active-thumb"
            />
            <div className="wm-active-meta">
              {isEditingActive ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={activeNameInput}
                    onChange={(e) => setActiveNameInput(e.target.value)}
                    className="wm-inline-edit-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveActiveRename();
                      if (e.key === 'Escape') setIsEditingActive(false);
                    }}
                  />
                  <IconButton
                    icon={<FiCheck size={12} />}
                    size="sm"
                    onClick={handleSaveActiveRename}
                    aria-label="Save name"
                  />
                  <IconButton
                    icon={<FiX size={12} />}
                    size="sm"
                    onClick={() => setIsEditingActive(false)}
                    aria-label="Cancel rename"
                  />
                </div>
              ) : (
                <div className="wm-active-name-row">
                  <span className="wm-active-name" title={activeWatermark.name}>
                    {activeWatermark.name}
                  </span>
                  <IconButton
                    icon={<FiEdit2 size={11} />}
                    size="sm"
                    onClick={() => setIsEditingActive(true)}
                    title="Rename watermark"
                    aria-label="Rename active watermark"
                  />
                </div>
              )}
              <span className="wm-active-tag">
                {activeWatermark.isTemporary ? 'Temporary logo' : 'Active from library'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<FiPlus size={12} />}
              onClick={() => fileInputRef.current?.click()}
              title="Upload another watermark to your library"
            >
              Upload More
            </Button>
            <IconButton
              icon={<FiX size={14} />}
              size="sm"
              onClick={onClearWatermark}
              title="Deselect watermark"
              aria-label="Deselect watermark"
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
