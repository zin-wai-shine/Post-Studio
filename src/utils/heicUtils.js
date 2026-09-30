/**
 * HEIC / HEIF image decoding and format conversion utilities.
 * Enables in-browser decoding of HEIC/HEIF files (e.g. iPhone photos)
 * and seamless conversion to PNG, JPEG, WEBP on export.
 */

let heic2anyModule = null;

async function getHeic2Any() {
  if (!heic2anyModule) {
    if (typeof window === 'undefined') {
      throw new Error('HEIC conversion is only available in the browser.');
    }
    const mod = await import('heic2any');
    heic2anyModule = mod.default || mod;
  }
  return heic2anyModule;
}

/**
 * Checks if a file or blob is a HEIC or HEIF image
 * @param {File|Blob|{name?: string, type?: string}} file
 * @returns {boolean}
 */
export function isHeicFile(file) {
  if (!file) return false;
  const name = typeof file.name === 'string' ? file.name.toLowerCase() : '';
  const type = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence'
  );
}

/**
 * Converts a HEIC/HEIF Blob or File to a JPEG or PNG Blob in the browser
 * @param {Blob|File} blobOrFile
 * @param {'image/jpeg'|'image/png'} targetMime
 * @param {number} quality (0 to 1)
 * @returns {Promise<Blob>}
 */
export async function convertHeicBlob(blobOrFile, targetMime = 'image/jpeg', quality = 0.95) {
  if (!blobOrFile) {
    throw new Error('No HEIC blob or file provided.');
  }

  const heic2any = await getHeic2Any();
  const result = await heic2any({
    blob: blobOrFile,
    toType: targetMime,
    quality: quality
  });

  const blob = Array.isArray(result) ? result[0] : result;
  return blob;
}

/**
 * Normalizes an image extension to lowercase with leading dot
 * @param {string} ext
 * @returns {string} e.g. ".png"
 */
export function normalizeExtension(ext) {
  if (!ext) return '';
  const clean = ext.trim().toLowerCase();
  return clean.startsWith('.') ? clean : `.${clean}`;
}

/**
 * Replaces the extension of a filename with a new extension
 * @param {string} filename
 * @param {string} newExt
 * @returns {string}
 */
export function replaceExtension(filename, newExt) {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  const base = lastDot === -1 ? filename : filename.substring(0, lastDot);
  const targetExt = normalizeExtension(newExt);
  return `${base}${targetExt}`;
}

/**
 * Processes and converts an image item to match the requested targetFilename extension.
 * If target filename has a different format (e.g. .png, .jpg, .webp) or source was HEIC,
 * it renders via canvas to create a 100% genuine image file of that format.
 *
 * @param {Object} item - { file, originalFile, previewBlob, previewUrl, width, height, isHeic }
 * @param {string} targetFilename - e.g. "BDO-123456-ABCD.png"
 * @param {number} [quality=0.95]
 * @returns {Promise<Blob>}
 */
export async function getProcessedImageBlob(item, targetFilename, quality = 0.95) {
  if (!item) {
    throw new Error('No image item provided for processing.');
  }

  const filename = targetFilename || item.name || 'image.png';
  const lastDot = filename.lastIndexOf('.');
  const targetExt = lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '.png';

  const origName = item.originalName || item.file?.name || item.name || '';
  const origLastDot = origName.lastIndexOf('.');
  const origExt = origLastDot !== -1 ? origName.substring(origLastDot).toLowerCase() : '';
  const isOrigHeic = origExt === '.heic' || origExt === '.heif' || item.isHeic || isHeicFile(item.file);

  // If user requested .heic and source was original HEIC, preserve pristine raw HEIC file bytes
  if ((targetExt === '.heic' || targetExt === '.heif') && isOrigHeic) {
    return item.originalFile || item.file;
  }

  // Determine target MIME type
  let targetMime = null;
  if (targetExt === '.png') {
    targetMime = 'image/png';
  } else if (targetExt === '.jpg' || targetExt === '.jpeg') {
    targetMime = 'image/jpeg';
  } else if (targetExt === '.webp') {
    targetMime = 'image/webp';
  }

  // If target format matches original file type and NOT HEIC, return original file directly
  if (!isOrigHeic && targetMime && item.file && item.file.type === targetMime) {
    return item.file;
  }

  // Fallback target MIME if unknown extension
  if (!targetMime) {
    targetMime = isOrigHeic ? 'image/jpeg' : (item.file?.type || 'image/jpeg');
  }

  // Source element / blob to load into Canvas
  let sourceToLoad = item.previewBlob || item.previewUrl || item.file || item.originalFile;

  // If source is still raw HEIC without previewBlob, convert it first
  if (isHeicFile(sourceToLoad)) {
    try {
      sourceToLoad = await convertHeicBlob(sourceToLoad, 'image/jpeg', 0.95);
    } catch (err) {
      console.warn('HEIC fallback conversion failed in getProcessedImageBlob:', err);
    }
  }

  // Load into HTMLImageElement
  const img = await new Promise((resolve, reject) => {
    let url = '';
    let needRevoke = false;

    if (typeof sourceToLoad === 'string') {
      url = sourceToLoad;
    } else if (sourceToLoad instanceof Blob || sourceToLoad instanceof File) {
      url = URL.createObjectURL(sourceToLoad);
      needRevoke = true;
    } else if (typeof HTMLImageElement !== 'undefined' && sourceToLoad instanceof HTMLImageElement) {
      if (sourceToLoad.complete && sourceToLoad.naturalWidth > 0) {
        return resolve(sourceToLoad);
      }
      sourceToLoad.onload = () => resolve(sourceToLoad);
      sourceToLoad.onerror = (err) => reject(new Error('Failed to load image element'));
      return;
    }

    const imageEl = new Image();
    imageEl.onload = () => {
      if (needRevoke) {
        setTimeout(() => {
          try { URL.revokeObjectURL(url); } catch (e) {}
        }, 1000);
      }
      resolve(imageEl);
    };
    imageEl.onerror = (err) => {
      if (needRevoke) {
        try { URL.revokeObjectURL(url); } catch (e) {}
      }
      reject(new Error(`Failed to load image for format conversion: ${err?.message || 'error'}`));
    };
    imageEl.src = url;
  });

  const naturalWidth = img.naturalWidth || img.width || item.width || 1200;
  const naturalHeight = img.naturalHeight || img.height || item.height || 800;

  const canvas = document.createElement('canvas');
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext('2d');

  if (targetMime === 'image/jpeg') {
    // Fill white background for JPEG so any transparency in PNG doesn't become black
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, naturalWidth, naturalHeight);
  }

  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        try {
          canvas.width = 0;
          canvas.height = 0;
        } catch (e) {}
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to convert image to ${targetExt.toUpperCase()}`));
        }
      },
      targetMime,
      quality
    );
  });
}
