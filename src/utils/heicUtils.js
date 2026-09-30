/**
 * HEIC / HEIF image decoding and format conversion utilities using libheif-js.
 * Enables fast in-browser WebAssembly decoding of HEIC/HEIF files (e.g. iPhone photos)
 * and seamless conversion to PNG, JPEG, WEBP on export.
 */

let libheifInstance = null;
let libheifPromise = null;

async function getLibheif() {
  if (libheifInstance) return libheifInstance;
  if (!libheifPromise) {
    libheifPromise = (async () => {
      if (typeof window === 'undefined') {
        throw new Error('HEIC conversion is only available in the browser.');
      }
      const mod = await import('libheif-js/libheif-wasm/libheif-bundle.mjs');
      const init = mod.default || mod;
      libheifInstance = await init();
      return libheifInstance;
    })();
  }
  return libheifPromise;
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
 * Converts a HEIC/HEIF Blob or File to a JPEG, PNG, or WEBP Blob in the browser using libheif
 * @param {Blob|File} blobOrFile
 * @param {'image/jpeg'|'image/png'|'image/webp'} targetMime
 * @param {number} quality (0 to 1)
 * @returns {Promise<Blob>}
 */
export async function convertHeicBlob(blobOrFile, targetMime = 'image/jpeg', quality = 0.95) {
  if (!blobOrFile) {
    throw new Error('No HEIC blob or file provided.');
  }

  const libheif = await getLibheif();
  const buffer = await blobOrFile.arrayBuffer();
  const decoder = new libheif.HeifDecoder();
  const data = decoder.decode(buffer);

  if (!data || data.length === 0) {
    throw new Error('No readable image frames found in HEIC file.');
  }

  const image = data[0];
  const width = image.get_width();
  const height = image.get_height();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  await new Promise((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) {
        return reject(new Error('HEIF pixel display failed'));
      }
      resolve();
    });
  });

  ctx.putImageData(imageData, 0, 0);

  // If converting to JPEG, ensure white background
  if (targetMime === 'image/jpeg') {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    const compCtx = compositeCanvas.getContext('2d');
    compCtx.fillStyle = '#FFFFFF';
    compCtx.fillRect(0, 0, width, height);
    compCtx.drawImage(canvas, 0, 0);

    return new Promise((resolve, reject) => {
      compositeCanvas.toBlob(
        (blob) => {
          try {
            canvas.width = 0;
            canvas.height = 0;
            compositeCanvas.width = 0;
            compositeCanvas.height = 0;
          } catch (e) {}
          if (blob) resolve(blob);
          else reject(new Error('Failed to encode JPEG Blob'));
        },
        'image/jpeg',
        quality
      );
    });
  }

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
          reject(new Error(`Failed to encode ${targetMime} Blob`));
        }
      },
      targetMime,
      quality
    );
  });
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
 * it renders via libheif / canvas to create a 100% genuine image file of that format.
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
  let targetMime = 'image/png';
  if (targetExt === '.jpg' || targetExt === '.jpeg') {
    targetMime = 'image/jpeg';
  } else if (targetExt === '.webp') {
    targetMime = 'image/webp';
  } else if (targetExt === '.png') {
    targetMime = 'image/png';
  }

  // If target format matches original file type and NOT HEIC, return original file directly
  if (!isOrigHeic && targetMime && item.file && item.file.type === targetMime) {
    return item.file;
  }

  // If source was HEIC, convert directly via libheif
  if (isOrigHeic) {
    const rawHeic = item.originalFile || item.file;
    if (rawHeic) {
      return await convertHeicBlob(rawHeic, targetMime, quality);
    }
  }

  // Non-HEIC conversion (e.g. JPG -> PNG, PNG -> JPG)
  const sourceToLoad = item.previewBlob || item.previewUrl || item.file || item.originalFile;
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
