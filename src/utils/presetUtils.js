import { renderWatermarkedImage } from './canvasUtils';
import { triggerDownload } from './downloadUtils';
import { parseFilename } from './imageUtils';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a 6-digit random number string
 * @returns {string} e.g. "482951"
 */
export function randomDigits6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generates a 4-character random UPPERCASE letter string
 * @returns {string} e.g. "XKQM"
 */
export function randomCaps4() {
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  }
  return result;
}

/**
 * Generates a formatted preset filename:
 * e.g. "BOL-482951-XKQM.jpg" or "DOT-294812-MNBA.png"
 * 
 * @param {string} prefix 3-letter prefix (e.g. 'BOL', 'DOT')
 * @param {string} ext Extension (e.g. '.jpg')
 * @returns {string}
 */
export function generatePresetFilename(prefix = 'BOL', ext = '.jpg') {
  const cleanPrefix = (prefix || 'BOL')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'BOL';

  const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
  return `${cleanPrefix}-${randomDigits6()}-${randomCaps4()}${cleanExt}`;
}

/**
 * Resolves target extension from export options or original filename
 * @param {string} originalName 
 * @param {Object} exportOptions 
 * @returns {string}
 */
export function resolvePresetExtension(originalName = '', exportOptions = {}) {
  if (exportOptions?.format === 'jpeg' || exportOptions?.format === 'jpg') return '.jpg';
  if (exportOptions?.format === 'png') return '.png';
  if (exportOptions?.format === 'webp') return '.webp';
  if (originalName && originalName.includes('.')) {
    const { ext } = parseFilename(originalName);
    if (ext) return ext.toLowerCase();
  }
  return '.jpg';
}

/**
 * Export a single image with preset configuration and triggers download
 * @param {Object} param0
 */
export async function exportPresetImage({
  image, // { file, previewUrl, name }
  preset, // { prefix, settings, cropSettings, exportSettings, watermarkSource }
  watermarkSource
}) {
  if (!image) throw new Error('No image provided.');

  const ext = resolvePresetExtension(image.name, preset.exportSettings);
  const filename = generatePresetFilename(preset.prefix || 'BOL', ext);

  const effectiveWatermark = watermarkSource || preset.watermarkPreviewUrl || preset.watermarkDataUrl || null;

  const blob = await renderWatermarkedImage({
    sourceImage: image.file || image.previewUrl,
    watermarkImage: effectiveWatermark,
    settings: preset.settings,
    cropSettings: preset.cropSettings,
    exportOptions: preset.exportSettings
  });

  triggerDownload(blob, filename);
  return { filename, blob };
}

/**
 * Batch export multiple images using a preset configuration
 * @param {Object} param0
 */
export async function batchExportPresetImages({
  images,
  preset,
  watermarkSource,
  onProgress,
  isCancelledRef
}) {
  if (!images || images.length === 0) throw new Error('No images to export.');

  const total = images.length;
  const effectiveWatermark = watermarkSource || preset.watermarkPreviewUrl || preset.watermarkDataUrl || null;

  for (let i = 0; i < total; i++) {
    if (isCancelledRef?.current) {
      throw new Error('Export cancelled by user.');
    }

    const item = images[i];
    const ext = resolvePresetExtension(item.name, preset.exportSettings);
    const filename = generatePresetFilename(preset.prefix || 'BOL', ext);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        currentFilename: filename
      });
    }

    const blob = await renderWatermarkedImage({
      sourceImage: item.file || item.previewUrl,
      watermarkImage: effectiveWatermark,
      settings: preset.settings,
      cropSettings: preset.cropSettings,
      exportOptions: preset.exportSettings
    });

    if (isCancelledRef?.current) {
      throw new Error('Export cancelled by user.');
    }

    triggerDownload(blob, filename);

    // Stagger downloads by 320ms so browser download manager doesn't drop requests
    await new Promise((res) => setTimeout(res, 320));
  }
}
