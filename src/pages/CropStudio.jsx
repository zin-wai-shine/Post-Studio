import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useImageFiles } from '../hooks/useImageFiles';
import { useWatermarkSettings } from '../hooks/useWatermarkSettings';
import { CropControls } from '../components/watermark/CropControls';
import { ImagePreview } from '../components/watermark/ImagePreview';
import { ImageThumbnailList } from '../components/watermark/ImageThumbnailList';
import { ImageUploader } from '../components/watermark/ImageUploader';
import { ProcessingModal } from '../components/watermark/ProcessingModal';
import { Toast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { renderWatermarkedImage } from '../utils/canvasUtils';
import { triggerDownload, generateRandomBatchPrefix } from '../utils/downloadUtils';
import { sliceImageIntoGridTiles } from '../utils/gridCropUtils';
import { parseFilename } from '../utils/imageUtils';
import { EXPORT_FORMATS } from '../constants/watermark';
import { FiDownload, FiRotateCcw, FiCrop, FiGrid, FiScissors } from 'react-icons/fi';
import './CropStudio.css';

const HEADER_FORMAT_OPTIONS = [
  { id: 'original', label: 'Original Format' },
  { id: 'jpeg', label: 'JPEG (.jpg)' },
  { id: 'png', label: 'PNG (.png)' },
  { id: 'webp', label: 'WEBP (.webp)' }
];

export function CropStudio() {
  const { registerResetHandler, setHeaderActions } = useOutletContext?.() || {};
  const [searchParams] = useSearchParams();

  const {
    images,
    activeImageId,
    activeImage,
    setActiveImageId,
    addImages,
    removeImage,
    clearAllImages,
    isProcessingUpload
  } = useImageFiles();

  const {
    cropSettings,
    gridCropSettings,
    exportSettings,
    updateCropSetting,
    updateGridCropSetting,
    setCropPreset,
    setCropFocus,
    setExportSettings,
    resetSettings
  } = useWatermarkSettings();

  const [toast, setToast] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [isSlicing, setIsSlicing] = useState(false);
  const isCancelledRef = useRef(false);
  const singleUploaderRef = useRef(null);

  // Auto-clear workspace setting
  const [autoClearAfterDownload, setAutoClearAfterDownload] = useState(() => {
    try {
      return localStorage.getItem('pofix_auto_clear') === 'true';
    } catch {
      return false;
    }
  });

  // Ensure crop is enabled by default in Crop Studio if preset is chosen
  useEffect(() => {
    if (!cropSettings.enabled && cropSettings.preset !== 'original') {
      updateCropSetting('enabled', true);
    }
  }, [cropSettings.enabled, cropSettings.preset, updateCropSetting]);

  // Activate grid mode if query has ?mode=grid
  useEffect(() => {
    if (searchParams.get('mode') === 'grid') {
      updateGridCropSetting('mode', 'grid');
    }
  }, [searchParams, updateGridCropSetting]);

  // Register reset
  useEffect(() => {
    if (registerResetHandler) {
      registerResetHandler(() => {
        setShowResetConfirm(true);
      });
    }
  }, [registerResetHandler]);

  const handleFilesSelected = async (fileList) => {
    try {
      const added = await addImages(fileList);
      if (added && added.length > 0) {
        setToast({
          type: 'success',
          message: `Loaded ${added.length} photo${added.length > 1 ? 's' : ''}.`
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload images.' });
    }
  };

  const handleLoadDemo = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/demo-assets/villa-exterior.jpg'),
        fetch('/demo-assets/living-room.jpg')
      ]);
      const [b1, b2] = await Promise.all([r1.blob(), r2.blob()]);
      const f1 = new File([b1], 'villa-exterior.jpg', { type: 'image/jpeg' });
      const f2 = new File([b2], 'living-room.jpg', { type: 'image/jpeg' });
      await addImages([f1, f2]);
      setToast({ type: 'success', message: 'Loaded sample property photos.' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load demo photos.' });
    }
  };

  const handleSliceImage = async () => {
    if (!activeImage) return;
    setIsSlicing(true);

    try {
      const layoutId = gridCropSettings?.activeLayout || 'four-squares';
      const focus = gridCropSettings?.gridFocus || 'center';
      const targetCropPreset = gridCropSettings?.targetCropPreset || 'original';
      const targetWidth = gridCropSettings?.targetWidth || null;
      const targetHeight = gridCropSettings?.targetHeight || null;
      const tileFocusMap = gridCropSettings?.tileFocusMap || {};

      const tiles = await sliceImageIntoGridTiles(
        activeImage.file || activeImage.previewUrl,
        layoutId,
        {
          focus,
          tileFocusMap,
          targetCropPreset,
          targetWidth,
          targetHeight,
          baseFilename: activeImage.name,
          useWatermark: false
        }
      );

      if (!tiles || tiles.length === 0) {
        throw new Error('No grid tiles generated.');
      }

      // Automatically download all sliced tiles
      for (const tile of tiles) {
        triggerDownload(tile.blob, tile.filename);
        await new Promise((res) => setTimeout(res, 250));
      }

      setToast({
        type: 'success',
        message: `Successfully sliced and downloaded ${tiles.length} social grid tiles!`
      });

      if (autoClearAfterDownload) {
        removeImage(activeImage.id);
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.message || 'Grid slicing failed.' });
    } finally {
      setIsSlicing(false);
    }
  };

  const handleDownloadSingle = async () => {
    if (!activeImage) return;
    setIsExporting(true);

    try {
      const { nameWithoutExt, ext } = parseFilename(activeImage.name);
      const targetExt = exportSettings.format === 'jpeg' ? '.jpg' :
                        exportSettings.format === 'png' ? '.png' :
                        exportSettings.format === 'webp' ? '.webp' : ext || '.jpg';
      const filename = `${nameWithoutExt}-cropped${targetExt}`;

      const blob = await renderWatermarkedImage({
        sourceImage: activeImage.file || activeImage.previewUrl,
        watermarkImage: null,
        settings: { enabled: false },
        cropSettings,
        exportOptions: exportSettings
      });

      triggerDownload(blob, filename);

      if (autoClearAfterDownload) {
        removeImage(activeImage.id);
        setToast({ type: 'success', message: `Downloaded ${filename}. Workspace cleared.` });
      } else {
        setToast({ type: 'success', message: `Downloaded ${filename}` });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Export failed.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    isCancelledRef.current = false;
    setIsExporting(true);

    const total = images.length;
    try {
      for (let i = 0; i < total; i++) {
        if (isCancelledRef.current) break;

        const img = images[i];
        const { nameWithoutExt, ext } = parseFilename(img.name);
        const targetExt = exportSettings.format === 'jpeg' ? '.jpg' :
                          exportSettings.format === 'png' ? '.png' :
                          exportSettings.format === 'webp' ? '.webp' : ext || '.jpg';
        const filename = `${nameWithoutExt}-cropped${targetExt}`;

        setExportProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          currentFilename: filename
        });

        const blob = await renderWatermarkedImage({
          sourceImage: img.file || img.previewUrl,
          watermarkImage: null,
          settings: { enabled: false },
          cropSettings,
          exportOptions: exportSettings
        });

        triggerDownload(blob, filename);
        await new Promise((res) => setTimeout(res, 300));
      }

      if (!isCancelledRef.current) {
        if (autoClearAfterDownload) {
          clearAllImages();
          setToast({ type: 'success', message: `Exported ${total} cropped photos. Workspace cleared.` });
        } else {
          setToast({ type: 'success', message: `Exported all ${total} cropped photos!` });
        }
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        setToast({ type: 'error', message: err.message || 'Batch export failed.' });
      }
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const confirmReset = () => {
    clearAllImages();
    resetSettings();
    setShowResetConfirm(false);
    setToast({ type: 'info', message: 'Workspace reset to defaults.' });
  };

  const isGridMode = gridCropSettings?.mode === 'grid';

  // Top header actions
  useEffect(() => {
    if (!setHeaderActions) return;

    setHeaderActions(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '140px' }}>
          <Select
            size="sm"
            value={exportSettings.format}
            onChange={(val) => setExportSettings((prev) => ({ ...prev, format: val }))}
            options={HEADER_FORMAT_OPTIONS}
            menuPlacement="bottom"
          />
        </div>

        {isGridMode ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSliceImage}
            iconLeft={<FiScissors size={14} />}
            disabled={!activeImage || isSlicing}
            loading={isSlicing}
          >
            {isSlicing ? 'Slicing Grid...' : 'Slice & Export Tiles'}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSingle}
              iconLeft={<FiDownload size={13} />}
              disabled={!activeImage || isExporting}
            >
              Download Cropped
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAll}
              iconLeft={<FiDownload size={13} />}
              disabled={images.length === 0 || isExporting}
              loading={isExporting}
            >
              Download All ({images.length})
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResetConfirm(true)}
          iconLeft={<FiRotateCcw size={13} />}
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
    isGridMode,
    activeImage,
    images.length,
    isExporting,
    isSlicing,
    exportSettings.format
  ]);

  return (
    <div className="crop-studio-page">
      {/* Main Preview and Thumbnails Area */}
      <div className="crop-studio-main">
        {images.length === 0 ? (
          <div className="crop-preview-area crop-empty-preview-area">
            <ImageUploader
              onFilesSelected={handleFilesSelected}
              onLoadSample={handleLoadDemo}
              loading={isProcessingUpload}
            />
          </div>
        ) : (
          <>
            <div className="crop-preview-area">
              <ImagePreview
                activeImage={activeImage}
                watermarkSource={null}
                settings={{ enabled: false }}
                cropSettings={cropSettings}
                gridCropSettings={gridCropSettings}
                onUpdateGridCropSetting={updateGridCropSetting}
                onSliceImage={handleSliceImage}
                isSlicing={isSlicing}
              />
            </div>

            <div className="crop-thumbnails-bar">
              <ImageThumbnailList
                images={images}
                activeImageId={activeImageId}
                onSelectImage={setActiveImageId}
                onRemoveImage={removeImage}
                onImagesAdded={handleFilesSelected}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Controls Panel */}
      <div className="crop-controls-sidebar">
        <div className="crop-controls-header">
          <span className="crop-controls-title">
            <FiScissors size={16} /> Crop & Cut Controls
          </span>
        </div>

        <div className="crop-controls-content">
          <CropControls
            cropSettings={cropSettings}
            onUpdateCropSetting={updateCropSetting}
            onSetCropPreset={setCropPreset}
            onSetCropFocus={setCropFocus}
            totalImagesCount={images.length}
            activeImage={activeImage}
            gridCropSettings={gridCropSettings}
            onUpdateGridCropSetting={updateGridCropSetting}
            onSliceImage={handleSliceImage}
            isSlicing={isSlicing}
            onTriggerSingleUpload={() => singleUploaderRef.current?.click()}
          />
        </div>
      </div>

      <input
        type="file"
        ref={singleUploaderRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Batch Processing Modal */}
      <ProcessingModal
        isOpen={isExporting}
        current={exportProgress?.current || 0}
        total={exportProgress?.total || 1}
        percentage={exportProgress?.percentage || 0}
        currentFilename={exportProgress?.currentFilename || 'Processing...'}
        onCancel={() => {
          isCancelledRef.current = true;
          setIsExporting(false);
        }}
      />

      {/* Reset Workspace Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Crop Workspace"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReset}>
              Reset Workspace
            </Button>
          </div>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Are you sure you want to reset the current workspace? All loaded images will be cleared.
        </p>
      </Modal>

      {/* Toast Feedback */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3500}
        />
      )}
    </div>
  );
}

export default CropStudio;
