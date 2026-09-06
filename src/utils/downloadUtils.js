import { saveAs } from 'file-saver';
import { renderWatermarkedImage } from './canvasUtils';
import { parseFilename } from './imageUtils';

/**
 * Triggers a direct browser download for a Blob
 * @param {Blob} blob 
 * @param {string} filename 
 */
export function triggerDownload(blob, filename) {
  if (!blob) return;

  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    link.style.top = '-9999px';
    link.href = url;
    link.download = filename || 'watermarked-image.jpg';

    // Must be attached to DOM for modern Chrome, Firefox and Safari to permit download
    document.body.appendChild(link);
    link.click();

    // Clean up DOM and revoke object URL
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    }, 15000);
  } catch (err) {
    console.warn('Direct anchor download failed, falling back to FileSaver:', err);
    try {
      saveAs(blob, filename);
    } catch (saveAsErr) {
      console.error('All download mechanisms failed:', saveAsErr);
    }
  }
}


const BATCH_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a 3-character uppercase batch prefix code (e.g. "XEA")
 * @returns {string}
 */
export function generateRandomBatchPrefix() {
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += BATCH_LETTERS.charAt(Math.floor(Math.random() * BATCH_LETTERS.length));
  }
  return result;
}

/**
 * Generates an image filename following the pattern: [PREFIX]_[5DIGITS]_[SUFFIX].[ext]
 * Example: "XEA_23523_BAS.png"
 * 
 * @param {Object} param0
 * @returns {string}
 */
export function generateBatchImageName({
  batchPrefix = 'XEA',
  suffix = 'BAS',
  originalName = '',
  exportOptions = {}
} = {}) {
  // 1. Five random digits (10000 - 99999)
  const num5 = Math.floor(10000 + Math.random() * 90000);

  // 2. Format 3-character prefix (e.g. "XEA")
  const cleanPrefix = (batchPrefix || 'XEA')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'XEA';

  // 3. Format suffix (e.g. "BAS")
  const rawSuffix = exportOptions?.suffix !== undefined && exportOptions.suffix.trim() !== ''
    ? exportOptions.suffix.replace(/^-+/, '')
    : (suffix || 'BAS');
  const cleanSuffix = rawSuffix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'BAS';

  // 4. Resolve extension
  let targetExt = '.png';
  if (exportOptions.format === 'jpeg' || exportOptions.format === 'jpg') {
    targetExt = '.jpg';
  } else if (exportOptions.format === 'png') {
    targetExt = '.png';
  } else if (exportOptions.format === 'webp') {
    targetExt = '.webp';
  } else if (originalName && originalName.includes('.')) {
    const { ext } = parseFilename(originalName);
    if (ext) targetExt = ext.toLowerCase();
  }

  return `${cleanPrefix}_${num5}_${cleanSuffix}${targetExt}`;
}

/**
 * Generates unique filename (backward compatibility alias)
 */
export function generateUniqueImageName(originalName = '', exportOptions = {}, batchPrefix = 'XEA') {
  return generateBatchImageName({
    batchPrefix,
    suffix: exportOptions?.suffix ? exportOptions.suffix.replace(/^-+/, '') : 'BAS',
    originalName,
    exportOptions
  });
}

/**
 * Legacy filename helper preserved for backward compatibility
 */
export function getExportFilename(originalName, exportOptions = {}, batchPrefix = 'XEA') {
  return generateBatchImageName({
    batchPrefix,
    suffix: exportOptions?.suffix ? exportOptions.suffix.replace(/^-+/, '') : 'BAS',
    originalName,
    exportOptions
  });
}

/**
 * Directly downloads all processed images sequentially into the browser download manager
 * Ensures that all images in this batch share the exact same 3-letter prefix (e.g. "XEA")
 * 
 * @param {Object} param0 
 * @returns {Promise<void>}
 */
export async function batchDownloadImagesDirectly({
  images, // Array<{ id, file, previewUrl, name }>
  watermarkImage,
  settings,
  cropSettings,
  exportOptions,
  batchPrefix, // Consistent 3-letter prefix for this batch, e.g. "XEA"
  onProgress, // ({ current, total, percentage, currentFilename }) => void
  isCancelledRef // { current: boolean }
}) {
  if (!images || images.length === 0) {
    throw new Error('No images to export.');
  }

  const total = images.length;
  // Use the session batchPrefix or create a new consistent one for this batch
  const activeBatchPrefix = batchPrefix || generateRandomBatchPrefix();
  const activeSuffix = exportOptions?.suffix ? exportOptions.suffix.replace(/^-+/, '') : 'BAS';

  for (let i = 0; i < total; i++) {
    if (isCancelledRef?.current) {
      throw new Error('Export cancelled by user.');
    }

    const item = images[i];
    // Generate name matching: XEA_23523_BAS.ext (prefix stays identical across the batch)
    const filename = generateBatchImageName({
      batchPrefix: activeBatchPrefix,
      suffix: activeSuffix,
      originalName: item.name || `image_${i + 1}`,
      exportOptions
    });

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        currentFilename: filename
      });
    }

    // Render image at standardized resolution with watermark
    const blob = await renderWatermarkedImage({
      sourceImage: item.file || item.previewUrl,
      watermarkImage,
      settings,
      cropSettings,
      exportOptions
    });

    if (isCancelledRef?.current) {
      throw new Error('Export cancelled by user.');
    }

    // Direct browser download
    triggerDownload(blob, filename);

    // Stagger downloads by 350ms to allow browser download manager to process smoothly
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

