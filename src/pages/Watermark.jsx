import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
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
import { sliceImageIntoGridTiles } from '../utils/gridCropUtils';
import { generateRandomBatchPrefix } from '../utils/downloadUtils';
import { FiDownload, FiArchive, FiRotateCcw } from 'react-icons/fi';
import { Select } from '../components/common/Select';
import { EXPORT_FORMATS, FOCUS_POSITIONS, POSITION_PRESETS, CROP_PRESETS } from '../constants/watermark';
import './Watermark.css';

export function Watermark() {
  const { registerResetHandler, setHeaderActions } = useOutletContext?.() || {};
  const [searchParams] = useSearchParams();

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
    setImageCropFocus,
    enableImageCustomOverrides,
    updateImageCustomSetting,
    updateImagePatternSetting,
    updateImageCropSetting,
    clearImageCustomOverrides,
    isProcessingUpload
  } = useImageFiles();


  const {
    settings,
    cropSettings,
    gridCropSettings,
    exportSettings,
    updateSetting,
    updatePatternSetting,
    updateCropSetting,
    updateGridCropSetting,
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
  const [batchPrefix, setBatchPrefix] = useState(() => generateRandomBatchPrefix());
  const [autoClearAfterDownload, setAutoClearAfterDownload] = useState(() => {
    try {
      return localStorage.getItem('pofix_auto_clear') === 'true';
    } catch {
      return false;
    }
  });
  const uploaderTriggerRef = useRef(null);
  const singleUploaderRef = useRef(null);
  const [activeSection, setActiveSection] = useState(() => {
    return searchParams.get('mode') === 'grid' || searchParams.get('tab') === 'crop'
      ? 'crop'
      : 'watermark';
  });
  const [isSlicing, setIsSlicing] = useState(false);

  // Auto-activate grid mode if URL has ?mode=grid
  useEffect(() => {
    if (searchParams.get('mode') === 'grid') {
      updateGridCropSetting('mode', 'grid');
      setActiveSection('crop');
    }
  }, [searchParams, updateGridCropSetting]);

  const handleToggleAutoClear = (checked) => {
    setAutoClearAfterDownload(checked);
    try {
      localStorage.setItem('pofix_auto_clear', String(checked));
    } catch (e) {
      console.warn('Failed to save auto clear setting:', e);
    }
  };

  // Per-image customization mode vs batch mode
  const isCustomImageMode = Boolean(activeImage?.hasCustomOverrides);

  // Focus resolution: per-image if syncFocus is false and activeImage has cropFocus
  const activeCropFocus = (!cropSettings.syncFocus && activeImage?.cropFocus)
    ? activeImage.cropFocus
    : (cropSettings.focus || 'center');
  const activeFocusObj = FOCUS_POSITIONS[activeCropFocus] || FOCUS_POSITIONS.center;

  const effectiveSettings = isCustomImageMode
    ? {
        ...settings,
        ...(activeImage.customSettings || {}),
        position: {
          ...settings.position,
          ...(activeImage.customSettings?.position || {})
        },
        pattern: {
          ...settings.pattern,
          ...(activeImage.customSettings?.pattern || {})
        }
      }
    : settings;

  const effectiveCropSettings = isCustomImageMode
    ? {
        ...cropSettings,
        ...(activeImage.customCropSettings || {}),
        focus: activeImage.customCropSettings?.focus || activeCropFocus,
        focusX: activeFocusObj.x,
        focusY: activeFocusObj.y
      }
    : {
        ...cropSettings,
        focus: activeCropFocus,
        focusX: activeFocusObj.x,
        focusY: activeFocusObj.y
      };

  const handleUpdateSetting = (key, val) => {
    if (activeImage?.hasCustomOverrides) {
      updateImageCustomSetting(activeImage.id, key, val);
    } else {
      updateSetting(key, val);
    }
  };

  const handleUpdatePatternSetting = (key, val) => {
    if (activeImage?.hasCustomOverrides) {
      updateImagePatternSetting(activeImage.id, key, val);
    } else {
      updatePatternSetting(key, val);
    }
  };

  const handleSetPositionPreset = (presetKey) => {
    if (activeImage?.hasCustomOverrides) {
      const preset = POSITION_PRESETS[presetKey];
      if (preset) {
        updateImageCustomSetting(activeImage.id, 'position', {
          preset: presetKey,
          x: preset.x,
          y: preset.y
        });
      }
    } else {
      setPositionPreset(presetKey);
    }
  };

  const handleCustomPosition = (xPercent, yPercent) => {
    if (activeImage?.hasCustomOverrides) {
      const clampedX = Math.max(0, Math.min(1, xPercent));
      const clampedY = Math.max(0, Math.min(1, yPercent));
      updateImageCustomSetting(activeImage.id, 'position', {
        preset: 'custom',
        x: clampedX,
        y: clampedY
      });
    } else {
      setCustomPosition(xPercent, yPercent);
    }
  };

  const handleUpdateCropSetting = (key, val) => {
    if (key === 'syncFocus') {
      updateCropSetting('syncFocus', val);
      return;
    }
    if (activeImage?.hasCustomOverrides) {
      updateImageCropSetting(activeImage.id, key, val);
    } else {
      updateCropSetting(key, val);
    }
  };

  const handleSetCropPreset = (presetId) => {
    if (activeImage?.hasCustomOverrides) {
      const preset = CROP_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      if (presetId === 'original') {
        updateImageCropSetting(activeImage.id, 'enabled', false);
        updateImageCropSetting(activeImage.id, 'preset', 'original');
      } else {
        updateImageCropSetting(activeImage.id, 'enabled', true);
        updateImageCropSetting(activeImage.id, 'preset', presetId);
        updateImageCropSetting(activeImage.id, 'width', preset.width);
        updateImageCropSetting(activeImage.id, 'height', preset.height);
        updateImageCropSetting(activeImage.id, 'aspect', preset.aspect);
      }
    } else {
      setCropPreset(presetId);
    }
  };

  const handleSetCropFocus = (focusKey) => {
    const focus = FOCUS_POSITIONS[focusKey];
    if (!focus) return;

    if (activeImage?.hasCustomOverrides) {
      updateImageCropSetting(activeImage.id, 'focus', focusKey);
      updateImageCropSetting(activeImage.id, 'focusX', focus.x);
      updateImageCropSetting(activeImage.id, 'focusY', focus.y);
      setImageCropFocus(activeImage.id, focusKey, focus.x, focus.y, cropSettings);
    } else if (cropSettings.syncFocus === false && activeImage) {
      setImageCropFocus(activeImage.id, focusKey, focus.x, focus.y, cropSettings);
    } else {
      setCropFocus(focusKey);
    }
  };

  const handleToggleCustomOverrides = (imageId) => {
    const target = images.find((img) => img.id === imageId);
    if (!target) return;
    if (target.hasCustomOverrides) {
      clearImageCustomOverrides(imageId);
      setToast({ type: 'info', message: `Reverted ${target.name} to batch defaults.` });
    } else {
      enableImageCustomOverrides(imageId, settings, cropSettings);
      setToast({ type: 'success', message: `Custom editing enabled for ${target.name}.` });
    }
  };

  const handleResetImageCustom = (imageId) => {
    clearImageCustomOverrides(imageId);
    const target = images.find((img) => img.id === imageId);
    setToast({ type: 'info', message: `Reverted ${target?.name || 'image'} to batch defaults.` });
  };

  const handleApplyImageCustomToAll = (imageId) => {
    const target = images.find((img) => img.id === imageId);
    if (!target || !target.hasCustomOverrides) return;

    if (target.customSettings) {
      Object.entries(target.customSettings).forEach(([k, v]) => {
        if (k === 'pattern') {
          Object.entries(v).forEach(([pk, pv]) => updatePatternSetting(pk, pv));
        } else {
          updateSetting(k, v);
        }
      });
    }

    if (target.customCropSettings) {
      Object.entries(target.customCropSettings).forEach(([k, v]) => {
        updateCropSetting(k, v);
      });
    }

    clearImageCustomOverrides(imageId);
    setToast({
      type: 'success',
      message: `Applied settings from ${target.name} across all batch images.`
    });
  };


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

  const handleSingleImageSelected = async (fileList) => {
    try {
      if (!fileList || fileList.length === 0) return;
      const singleFile = fileList[0];
      const added = await addImages([singleFile]);
      if (added && added.length > 0) {
        setActiveImageId(added[0].id);
        setToast({
          type: 'success',
          message: `Loaded single image for grid crop: ${added[0].name}`
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload image.' });
    }
  };

  const handleSliceImage = async () => {
    if (!activeImage) {
      setToast({ type: 'error', message: 'Please upload or select an image to slice.' });
      return;
    }

    try {
      setIsSlicing(true);
      const layoutId = gridCropSettings?.activeLayout || 'four-squares';
      const focus = gridCropSettings?.gridFocus || 'center';

      const tiles = await sliceImageIntoGridTiles(
        activeImage.file || activeImage.previewUrl,
        layoutId,
        {
          focus,
          baseFilename: activeImage.name
        }
      );

      if (!tiles || tiles.length === 0) {
        throw new Error('No grid tiles generated.');
      }

      const tileFiles = tiles.map((t) => t.file);
      const added = await addImages(tileFiles);

      if (added && added.length > 0) {
        setActiveImageId(added[0].id);
      }

      setToast({
        type: 'success',
        message: `Successfully sliced into ${tiles.length} tiles! Added to workspace.`
      });
    } catch (err) {
      console.error('Failed to slice image:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to slice image into grid.'
      });
    } finally {
      setIsSlicing(false);
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
        settings: effectiveSettings,
        cropSettings: effectiveCropSettings,
        exportOptions: exportSettings,
        batchPrefix
      });

      if (autoClearAfterDownload) {
        removeImage(activeImage.id);
        if (images.length <= 1) {
          const nextPrefix = generateRandomBatchPrefix();
          setBatchPrefix(nextPrefix);
        }
        setToast({
          type: 'success',
          message: `Downloaded ${activeImage.name}. Workspace auto-cleared.`
        });
      } else {
        setToast({
          type: 'success',
          message: `Downloaded ${activeImage.name}`
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to export image.'
      });
    }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    const downloadCount = images.length;
    try {
      await exportBatch({
        images,
        watermarkImage: watermarkImgEl || activeWatermark?.previewUrl,
        settings,
        cropSettings,
        exportOptions: exportSettings,
        batchPrefix
      });

      if (autoClearAfterDownload) {
        clearAllImages();
        const nextPrefix = generateRandomBatchPrefix();
        setBatchPrefix(nextPrefix);
        setToast({
          type: 'success',
          message: `Successfully downloaded ${downloadCount} images. Workspace auto-cleared (New batch: ${nextPrefix}).`
        });
      } else {
        setToast({
          type: 'success',
          message: `Successfully downloaded batch of ${downloadCount} images directly.`
        });
      }
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
    const nextPrefix = generateRandomBatchPrefix();
    setBatchPrefix(nextPrefix);
    setShowResetConfirm(false);
    setToast({
      type: 'info',
      message: `Workspace reset to defaults. New batch prefix: ${nextPrefix}.`
    });
  };

const HEADER_FORMAT_OPTIONS = [
  { id: 'original', label: 'Original' },
  { id: 'jpeg', label: 'JPEG' },
  { id: 'png', label: 'PNG' },
  { id: 'webp', label: 'WEBP' }
];

  // Register persistent Top Header Actions (Format, Download Selected, Download All, Reset)
  useEffect(() => {
    if (!setHeaderActions) return;

    setHeaderActions(
      <div className="header-actions-group">
        <div className="header-format-select-wrap">
          <Select
            size="sm"
            value={exportSettings.format}
            onChange={(val) => setExportSettings((prev) => ({ ...prev, format: val }))}
            options={HEADER_FORMAT_OPTIONS}
            menuPlacement="bottom"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="header-btn-download-selected"
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
          className="header-btn-download-all"
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
          className="header-btn-reset"
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
      {/* Toast Notification (Apple Notification style) */}
      {toast && (
        <div className="toast-container">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
            duration={3500}
          />
        </div>
      )}

      {/* Hidden Single Image Uploader Ref */}
      <input
        ref={singleUploaderRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.jfif,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSingleImageSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Hidden Batch Image Uploader Ref */}
      <input
        ref={uploaderTriggerRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.jfif,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Main Left Workspace (Preview & Thumbnails) */}
      <div className="workspace-left">
        {images.length === 0 ? (
          <div className="preview-area empty-preview-area">
            <ImageUploader
              onFilesSelected={gridCropSettings?.mode === 'grid' ? handleSingleImageSelected : handleFilesSelected}
              onLoadSample={handleLoadDemoSamples}
              loading={isProcessingUpload}
              isSingleImageMode={gridCropSettings?.mode === 'grid'}
            />
          </div>
        ) : (
          <>
            <div className="preview-area">
              <ImagePreview
                activeImage={activeImage}
                watermarkSource={activeWatermark?.previewUrl}
                watermarkImgEl={watermarkImgEl}
                settings={effectiveSettings}
                cropSettings={effectiveCropSettings}
                onCustomPosition={handleCustomPosition}
                onUploadClick={() =>
                  gridCropSettings?.mode === 'grid'
                    ? singleUploaderRef.current?.click()
                    : uploaderTriggerRef.current?.click()
                }
                gridCropSettings={gridCropSettings}
                onSliceImage={handleSliceImage}
                isSlicing={isSlicing}
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
                onToggleCustomOverrides={handleToggleCustomOverrides}
                onResetImageCustom={handleResetImageCustom}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Controls Panel */}
      <WatermarkControls
        settings={effectiveSettings}
        cropSettings={effectiveCropSettings}
        gridCropSettings={gridCropSettings}
        exportSettings={exportSettings}
        activeWatermark={activeWatermark}
        savedWatermarks={savedWatermarks}
        isSavedLoading={isSavedLoading}
        activeImage={activeImage}
        onUpdateSetting={handleUpdateSetting}
        onUpdatePatternSetting={handleUpdatePatternSetting}
        onSetPositionPreset={handleSetPositionPreset}
        onUpdateCropSetting={handleUpdateCropSetting}
        onUpdateGridCropSetting={updateGridCropSetting}
        onSetCropPreset={handleSetCropPreset}
        onSetCropFocus={handleSetCropFocus}
        onResetImageCustom={handleResetImageCustom}
        onApplyImageCustomToAll={handleApplyImageCustomToAll}
        onSliceImage={handleSliceImage}
        isSlicing={isSlicing}
        onTriggerSingleUpload={() => singleUploaderRef.current?.click()}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
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
        batchPrefix={batchPrefix}
        onRegeneratePrefix={() => setBatchPrefix(generateRandomBatchPrefix())}
        autoClearAfterDownload={autoClearAfterDownload}
        onToggleAutoClear={handleToggleAutoClear}
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
