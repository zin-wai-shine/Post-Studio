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

// Curated dictionary pools for generating aesthetic, clean unique names
const WORD_POOL_A = [
  'sky', 'sun', 'sea', 'bay', 'oak', 'zen', 'arc', 'fox', 'lux', 'mod',
  'neo', 'pro', 'pix', 'urb', 'top', 'gem', 'art', 'vue', 'geo', 'raw',
  'air', 'ice', 'eco', 'pop', 'hub', 'dot', 'pad', 'red', 'den', 'one'
];

const WORD_POOL_B = [
  'loft', 'view', 'home', 'room', 'deck', 'hall', 'pool', 'arch', 'lawn', 'gate',
  'peak', 'cove', 'park', 'wall', 'wood', 'pine', 'palm', 'dune', 'base', 'hill'
];

const WORD_POOL_C = [
  'wm', 'hd', 'hq', 'pro', 'std', 'art', 'res', 'fin', 'img', 'pic',
  'out', 'post', 'view', 'card', 'glow', 'pure', 'prime', 'mark', 'tone', 'flow'
];

/**
 * Generates unique filename following pattern: 3words_5numbers_2words.[ext]
 * Example: "sky_loft_zen_74829_hd_wm.jpg"
 * @param {string} originalName 
 * @param {Object} exportOptions 
 * @returns {string}
 */
export function generateUniqueImageName(originalName = '', exportOptions = {}) {
  // 1. Pick 3 distinct words
  const w1 = WORD_POOL_A[Math.floor(Math.random() * WORD_POOL_A.length)];
  const w2 = WORD_POOL_B[Math.floor(Math.random() * WORD_POOL_B.length)];
  let w3 = WORD_POOL_A[Math.floor(Math.random() * WORD_POOL_A.length)];
  if (w3 === w1) {
    w3 = WORD_POOL_B[Math.floor(Math.random() * WORD_POOL_B.length)];
  }

  // 2. 5 random digits (10000 - 99999)
  const num5 = Math.floor(10000 + Math.random() * 90000);

  // 3. 2 distinct words
  const w4 = WORD_POOL_C[Math.floor(Math.random() * WORD_POOL_C.length)];
  let w5 = WORD_POOL_C[Math.floor(Math.random() * WORD_POOL_C.length)];
  if (w5 === w4) {
    w5 = 'wm';
  }

  // 4. Resolve target extension
  let targetExt = '.jpg';
  if (exportOptions.format === 'jpeg' || exportOptions.format === 'jpg') {
    targetExt = '.jpg';
  } else if (exportOptions.format === 'png') {
    targetExt = '.png';
  } else if (exportOptions.format === 'webp') {
    targetExt = '.webp';
  } else if (originalName) {
    const { ext } = parseFilename(originalName);
    if (ext) targetExt = ext.toLowerCase();
  }

  return `${w1}_${w2}_${w3}_${num5}_${w4}_${w5}${targetExt}`;
}

/**
 * Legacy filename helper preserved for backward compatibility
 */
export function getExportFilename(originalName, exportOptions = {}) {
  return generateUniqueImageName(originalName, exportOptions);
}

/**
 * Directly downloads all processed images sequentially into the browser download manager
 * (Direct downloads with zero zip requirement)
 * @param {Object} param0 
 * @returns {Promise<void>}
 */
export async function batchDownloadImagesDirectly({
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

  const total = images.length;

  for (let i = 0; i < total; i++) {
    if (isCancelledRef?.current) {
      throw new Error('Export cancelled by user.');
    }

    const item = images[i];
    // Generate unique name following: 3words_5numbers_2words.[ext]
    const filename = generateUniqueImageName(item.name || `image_${i + 1}`, exportOptions);

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

    // Stagger downloads by 250ms to allow browser download manager to process smoothly
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
