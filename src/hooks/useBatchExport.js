import { useState, useCallback, useRef } from 'react';
import { renderWatermarkedImage } from '../utils/canvasUtils';
import { triggerDownload, generateUniqueImageName, batchDownloadImagesDirectly } from '../utils/downloadUtils';

export function useBatchExport() {
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentFilename: ''
  });
  const [exportError, setExportError] = useState(null);
  const isCancelledRef = useRef(false);

  const exportSingleImage = useCallback(async ({
    image,
    watermarkImage,
    settings,
    cropSettings,
    exportOptions,
    batchPrefix
  }) => {
    if (!image) return;
    try {
      setIsExportingSingle(true);
      setExportError(null);

      const blob = await renderWatermarkedImage({
        sourceImage: image.file || image.previewUrl,
        watermarkImage,
        settings,
        cropSettings,
        exportOptions
      });

      // Generate name following: XEA_23523_BAS.[ext]
      const filename = generateUniqueImageName(image.name, exportOptions, batchPrefix);
      triggerDownload(blob, filename);
    } catch (err) {
      console.error('Failed to export image:', err);
      setExportError(err.message || 'Failed to export image.');
      throw err;
    } finally {
      setIsExportingSingle(false);
    }
  }, []);

  const exportBatch = useCallback(async ({
    images,
    watermarkImage,
    settings,
    cropSettings,
    exportOptions,
    batchPrefix
  }) => {
    if (!images || images.length === 0) return;
    try {
      setIsExportingBatch(true);
      setExportError(null);
      isCancelledRef.current = false;
      setProgress({
        current: 0,
        total: images.length,
        percentage: 0,
        currentFilename: ''
      });

      // Direct sequential downloads (no zip archive)
      await batchDownloadImagesDirectly({
        images,
        watermarkImage,
        settings,
        cropSettings,
        exportOptions,
        batchPrefix,
        onProgress: (p) => setProgress(p),
        isCancelledRef
      });
    } catch (err) {
      if (err.message && err.message.includes('cancelled')) {
        console.log('Export cancelled by user.');
      } else {
        console.error('Batch export failed:', err);
        setExportError(err.message || 'Failed to export images.');
      }
    } finally {
      setIsExportingBatch(false);
    }
  }, []);

  const cancelExport = useCallback(() => {
    isCancelledRef.current = true;
    setIsExportingBatch(false);
  }, []);

  return {
    isExportingSingle,
    isExportingBatch,
    progress,
    exportError,
    exportSingleImage,
    exportBatch,
    cancelExport,
    clearError: () => setExportError(null)
  };
}
