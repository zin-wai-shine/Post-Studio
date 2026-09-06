import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { renderWatermarkedImage } from './canvasUtils';
import { parseFilename } from './imageUtils';

/**
 * Triggers a browser download for a Blob
 * @param {Blob} blob 
 * @param {string} filename 
 */
export function triggerDownload(blob, filename) {
  saveAs(blob, filename);
}

/**
 * Calculates output filename based on export options
 * @param {string} originalName 
 * @param {Object} exportOptions 
 * @returns {string}
 */
export function getExportFilename(originalName, exportOptions = {}) {
  const { base, ext } = parseFilename(originalName);
  const suffix = exportOptions.suffix !== undefined ? exportOptions.suffix : '-watermarked';
  
  let targetExt = ext.toLowerCase();
  if (exportOptions.format === 'jpeg' || exportOptions.format === 'jpg') {
    targetExt = '.jpg';
  } else if (exportOptions.format === 'png') {
    targetExt = '.png';
  } else if (exportOptions.format === 'webp') {
    targetExt = '.webp';
  }

  return `${base}${suffix}${targetExt}`;
}

/**
 * Exports all images in batch as a ZIP file with progress feedback
 * Sequential processing guarantees low memory footprint
 * @param {Object} param0 
 * @returns {Promise<void>}
 */
export async function batchExportImagesAsZip({
  images, // Array<{ id, file, previewUrl, name }>
  watermarkImage,
  settings,
  cropSettings,
  exportOptions,
  onProgress, // ({ current, total, percentage, currentFilename }) => void
  isCancelledRef // { current: boolean }
}) {
  if (!images || images.length === 0) {
    throw new Error('No images to export.');
  }

  const zip = new JSZip();
  const total = images.length;

  for (let i = 0; i < total; i++) {
    if (isCancelledRef?.current) {
      throw new Error('Export cancelled by user.');
    }

    const item = images[i];
    const exportFilename = getExportFilename(item.name || `image_${i + 1}`, exportOptions);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        currentFilename: exportFilename
      });
    }

    // Render image with standardized crop dimensions and watermark
    const blob = await renderWatermarkedImage({
      sourceImage: item.file || item.previewUrl,
      watermarkImage,
      settings,
      cropSettings,
      exportOptions
    });

    // Add to zip archive
    zip.file(exportFilename, blob);

    // Give browser event loop a small tick to process UI updates and GC
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  if (isCancelledRef?.current) {
    throw new Error('Export cancelled by user.');
  }

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFilename = `post-studio-watermarked-${Date.now().toString().slice(-4)}.zip`;
  saveAs(zipBlob, zipFilename);
}
