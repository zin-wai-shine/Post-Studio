import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useImageFiles } from '../hooks/useImageFiles';
import { useWatermarkSettings } from '../hooks/useWatermarkSettings';
import { useSavedWatermarks } from '../hooks/useSavedWatermarks';
import { useBatchExport } from '../hooks/useBatchExport';
import { ImagePreview } from '../components/watermark/ImagePreview';
import { ImageThumbnailList } from '../components/watermark/ImageThumbnailList';
import { ImageUploader } from '../components/watermark/ImageUploader';
import { WatermarkControls } from '../components/watermark/WatermarkControls';
import { ProcessingModal } from '../components/watermark/ProcessingModal';
import { Toast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { loadImage } from '../utils/imageUtils';
import { FiDownload, FiArchive, FiRotateCcw } from 'react-icons/fi';
import { Select } from '../components/common/Select';
import { EXPORT_FORMATS } from '../constants/watermark';
import './Watermark.css';

export function Watermark() {
  const { registerResetHandler, setHeaderActions } = useOutletContext?.() || {};

  // Custom Hooks
  const {
    images,
    activeImageId,
    activeImage,
    setActiveImageId,
    addImages,
    removeImage,
    clearAllImages,
    renameImage,
    isProcessingUpload
  } = useImageFiles();

  const {
    settings,
    cropSettings,
    exportSettings,
    updateSetting,
    updatePatternSetting,
    updateCropSetting,
    setCropPreset,
    setCropFocus,
    setPositionPreset,
    setCustomPosition,
    setExportSettings,
    resetSettings
  } = useWatermarkSettings();

  const {
    savedWatermarks,
    loading: isSavedLoading,
    addWatermark,
    removeWatermark,
    editWatermarkName
  } = useSavedWatermarks();

  const {
    isExportingSingle,
    isExportingBatch,
    progress,
    exportError,
    exportSingleImage,
    exportBatch,
    cancelExport,
    clearError
  } = useBatchExport();

  // Local state for active watermark & UI feedback
  const [activeWatermark, setActiveWatermark] = useState(null);
  const [watermarkImgEl, setWatermarkImgEl] = useState(null);
  const [toast, setToast] = useState(null); // { type, message }
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const uploaderTriggerRef = useRef(null);

  // Automatically select the first saved watermark if none is active
  useEffect(() => {
    if (!activeWatermark && savedWatermarks.length > 0) {
      setActiveWatermark(savedWatermarks[0]);
    }
  }, [savedWatermarks, activeWatermark]);

  // Pre-load HTMLImageElement for watermark whenever activeWatermark changes
  useEffect(() => {
    let isCurrent = true;
    if (activeWatermark?.previewUrl) {
      loadImage(activeWatermark.previewUrl)
        .then((img) => {
          if (isCurrent) setWatermarkImgEl(img);
        })
        .catch((err) => {
          console.warn('Failed to preload watermark image element:', err);
          if (isCurrent) setWatermarkImgEl(null);
        });
    } else {
      setWatermarkImgEl(null);
    }
    return () => {
      isCurrent = false;
    };
  }, [activeWatermark]);

  // Connect reset handler to outlet context or trigger
  useEffect(() => {
    if (registerResetHandler) {
      registerResetHandler(() => setShowResetConfirm(true));
    }
  }, [registerResetHandler]);

  const handleFilesSelected = async (fileList) => {
    try {
      const added = await addImages(fileList);
      setToast({
        type: 'success',
        message: `Successfully added ${added.length} image${added.length > 1 ? 's' : ''}.`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload images.' });
    }
  };

  const handleSetTemporaryWatermark = (tempWm) => {
    setActiveWatermark(tempWm);
    setToast({
      type: 'info',
      message: 'Temporary watermark loaded. It will not be stored in your library.'
    });
  };

  const handleSaveAndSelectWatermark = async (wmData) => {
    try {
      const record = await addWatermark(wmData);
      // Construct preview record to make immediately active
      const preview = URL.createObjectURL(record.blob);
      setActiveWatermark({ ...record, previewUrl: preview });
      setToast({
        type: 'success',
        message: 'Watermark logo saved to browser IndexedDB.'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to save watermark to browser storage.'
      });
    }
  };

  const handleSelectSavedWatermark = (item) => {
    setActiveWatermark(item);
  };

  const handleDeleteSavedWatermark = async (id) => {
    try {
      await removeWatermark(id);
      if (activeWatermark?.id === id) {
        setActiveWatermark(null);
      }
      setToast({
        type: 'info',
        message: 'Watermark deleted from library.'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to delete watermark.'
      });
    }
  };

  const handleRenameSavedWatermark = async (id, newName) => {
    try {
      await editWatermarkName(id, newName);
      if (activeWatermark?.id === id) {
        setActiveWatermark((prev) => ({ ...prev, name: newName }));
      }
      setToast({
        type: 'success',
        message: 'Watermark renamed successfully.'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to rename watermark.'
      });
    }
  };

  const handleClearWatermark = () => {
    setActiveWatermark(null);
  };

  const handleLoadDemoSamples = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/demo-assets/villa-exterior.jpg'),
        fetch('/demo-assets/living-room.jpg'),
        fetch('/demo-assets/brand-logo.jpg')
      ]);
      const [b1, b2, b3] = await Promise.all([r1.blob(), r2.blob(), r3.blob()]);
      const f1 = new File([b1], 'villa-exterior.jpg', { type: 'image/jpeg' });
      const f2 = new File([b2], 'living-room.jpg', { type: 'image/jpeg' });
      await addImages([f1, f2]);

      if (!activeWatermark) {
        const preview = URL.createObjectURL(b3);
        setActiveWatermark({
          id: `sample_logo_${Date.now()}`,
          name: 'Acme Brand Emblem',
          previewUrl: preview,
          file: new File([b3], 'brand-logo.jpg', { type: 'image/jpeg' }),
          isTemporary: true
        });
      }

      setToast({
        type: 'success',
        message: 'Loaded sample property photos and brand logo.'
      });
    } catch (err) {
      console.error('Failed to load sample assets:', err);
      setToast({ type: 'error', message: 'Failed to load sample demo assets.' });
    }
  };

  const handleDownloadSingle = async () => {
    if (!activeImage) return;
    try {
      await exportSingleImage({
        image: activeImage,
        watermarkImage: watermarkImgEl || activeWatermark?.previewUrl,
        settings,
        cropSettings,
        exportOptions: exportSettings
      });
      setToast({
        type: 'success',
        message: `Downloaded ${activeImage.name}`
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to export image.'
      });
    }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    try {
      await exportBatch({
        images,
        watermarkImage: watermarkImgEl || activeWatermark?.previewUrl,
        settings,
        cropSettings,
        exportOptions: exportSettings
      });
      setToast({
        type: 'success',
        message: `Successfully downloaded batch of ${images.length} images directly.`
      });
    } catch (err) {
      if (!err.message?.includes('cancelled')) {
        setToast({
          type: 'error',
          message: err.message || 'Batch download failed.'
        });
      }
    }
  };

  const confirmResetWorkspace = () => {
    clearAllImages();
    if (activeWatermark?.isTemporary) {
      setActiveWatermark(null);
    }
    resetSettings();
    setShowResetConfirm(false);
    setToast({
      type: 'info',
      message: 'Workspace reset to defaults. Saved watermark library was preserved.'
    });
  };

  // Register persistent Top Header Actions (Format, Download Selected, Download All, Reset)
  useEffect(() => {
    if (!setHeaderActions) return;

    setHeaderActions(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '135px' }}>
          <Select
            size="sm"
            value={exportSettings.format}
            onChange={(val) => setExportSettings((prev) => ({ ...prev, format: val }))}
            options={EXPORT_FORMATS}
            menuPlacement="bottom"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          iconLeft={<FiDownload size={13} />}
          disabled={!activeImage || isExportingSingle || isExportingBatch}
          loading={isExportingSingle}
          onClick={handleDownloadSingle}
          title="Download current selected image"
        >
          {isExportingSingle ? 'Processing...' : 'Download Selected'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          iconLeft={<FiDownload size={13} />}
          disabled={images.length === 0 || isExportingBatch || isExportingSingle}
          loading={isExportingBatch}
          onClick={handleDownloadAll}
          title="Download all watermarked images directly"
        >
          {isExportingBatch ? 'Downloading...' : `Download All (${images.length})`}
        </Button>

        <span className="header-action-divider" />

        <Button
          variant="ghost"
          size="sm"
          iconLeft={<FiRotateCcw size={13} />}
          onClick={() => setShowResetConfirm(true)}
          title="Reset current workspace"
        >
          Reset
        </Button>
      </div>
    );

    return () => {
      setHeaderActions(null);
    };
  }, [
    setHeaderActions,
    exportSettings.format,
    setExportSettings,
    activeImage,
    images.length,
    isExportingSingle,
    isExportingBatch,
    handleDownloadSingle,
    handleDownloadAll
  ]);

  return (
    <div className="watermark-page">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Main Left Workspace (Preview & Thumbnails) */}
      <div className="workspace-left">
        {images.length === 0 ? (
          <div className="preview-area">
            <ImageUploader
              onFilesSelected={handleFilesSelected}
              onLoadSample={handleLoadDemoSamples}
              loading={isProcessingUpload}
            />
          </div>
        ) : (
          <>
            <div className="preview-area">
              <ImagePreview
                activeImage={activeImage}
                watermarkSource={activeWatermark?.previewUrl}
                watermarkImgEl={watermarkImgEl}
                settings={settings}
                cropSettings={cropSettings}
                onCustomPosition={setCustomPosition}
                onUploadClick={() => uploaderTriggerRef.current?.click()}
              />
            </div>
            <div className="thumbnails-area">
              <ImageThumbnailList
                images={images}
                activeImageId={activeImageId}
                onSelectImage={setActiveImageId}
                onRemoveImage={removeImage}
                onClearAll={clearAllImages}
                onAddMore={handleFilesSelected}
                onRenameImage={renameImage}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Controls Panel */}
      <WatermarkControls
        settings={settings}
        cropSettings={cropSettings}
        exportSettings={exportSettings}
        activeWatermark={activeWatermark}
        savedWatermarks={savedWatermarks}
        isSavedLoading={isSavedLoading}
        activeImage={activeImage}
        onUpdateSetting={updateSetting}
        onUpdatePatternSetting={updatePatternSetting}
        onSetPositionPreset={setPositionPreset}
        onUpdateCropSetting={updateCropSetting}
        onSetCropPreset={setCropPreset}
        onSetCropFocus={setCropFocus}
        onUpdateExportSetting={(key, val) =>
          setExportSettings((prev) => ({ ...prev, [key]: val }))
        }
        onSetTemporaryWatermark={handleSetTemporaryWatermark}
        onSaveAndSelectWatermark={handleSaveAndSelectWatermark}
        onSelectSavedWatermark={handleSelectSavedWatermark}
        onDeleteSavedWatermark={handleDeleteSavedWatermark}
        onRenameSavedWatermark={handleRenameSavedWatermark}
        onClearWatermark={handleClearWatermark}
        onDownloadSingle={handleDownloadSingle}
        onDownloadAll={handleDownloadAll}
        isExportingSingle={isExportingSingle}
        isExportingBatch={isExportingBatch}
        hasActiveImage={Boolean(activeImage)}
        totalImagesCount={images.length}
      />

      {/* Batch Processing Modal */}
      <ProcessingModal
        isOpen={isExportingBatch}
        progress={progress}
        onCancel={cancelExport}
      />

      {/* Reset Workspace Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Workspace"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmResetWorkspace}
            >
              Reset Workspace
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to reset the current workspace?
          This will clear all uploaded batch images and reset watermark parameters to default.
          Your saved watermark library in IndexedDB will remain intact.
        </p>
      </Modal>
    </div>
  );
}
