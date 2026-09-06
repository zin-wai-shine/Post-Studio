import { useState, useCallback, useRef } from 'react';
import { renderWatermarkedImage } from '../utils/canvasUtils';
import { triggerDownload, getExportFilename, batchExportImagesAsZip } from '../utils/downloadUtils';

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
    exportOptions
  }) => {
    if (!image) return;
    try {
      setIsExportingSingle(true);
      setExportError(null);

      const blob = await renderWatermarkedImage({
        sourceImage: image.file || image.previewUrl,
        watermarkImage,
        settings,
        exportOptions
      });

      const filename = getExportFilename(image.name, exportOptions);
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
    exportOptions
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

      await batchExportImagesAsZip({
        images,
        watermarkImage,
        settings,
        exportOptions,
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
