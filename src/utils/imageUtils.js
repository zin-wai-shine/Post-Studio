/**
 * Validates whether a file is an accepted image type
 * @param {File} file 
 * @returns {boolean}
 */
export function isValidImageFile(file) {
  if (!file) return false;

  const mime = typeof file.type === 'string' ? file.type.toLowerCase().trim() : '';
  const name = typeof file.name === 'string' ? file.name.toLowerCase().trim() : '';

  // Standard image mime types
  if (mime.startsWith('image/')) {
    return true;
  }

  // File extension checks
  const validExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.avif', '.jfif',
    '.heic', '.heif', '.bmp', '.gif', '.svg', '.tif', '.tiff', '.ico'
  ];

  if (validExtensions.some((ext) => name.endsWith(ext))) {
    return true;
  }

  // Blob fallback
  if (typeof Blob !== 'undefined' && file instanceof Blob && mime.includes('image')) {
    return true;
  }

  return false;
}

/**
 * Loads an HTMLImageElement from a URL, Blob, File, or existing HTMLImageElement
 * @param {HTMLImageElement|File|Blob|string} source 
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(source) {
  if (!source) {
    return Promise.reject(new Error('No image source provided.'));
  }

  // If already an HTMLImageElement
  if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    if (source.complete && source.naturalWidth > 0) {
      return Promise.resolve(source);
    }
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = (err) => reject(new Error(`Failed to load image element: ${err?.message || 'error'}`));
    });
  }

  let url = '';
  let needRevoke = false;

  if (typeof source === 'string') {
    url = source;
  } else if ((typeof Blob !== 'undefined' && source instanceof Blob) || (typeof File !== 'undefined' && source instanceof File)) {
    url = URL.createObjectURL(source);
    needRevoke = true;
  } else {
    return Promise.reject(new Error(`Invalid image source type: ${typeof source}`));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Do NOT set crossOrigin on blob: or data: URLs as it causes errors in Safari & WebKit
    if (typeof url === 'string' && !url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (needRevoke) {
        // Keep object URL alive briefly so canvas can finish accessing pixel buffer
        setTimeout(() => {
          try { URL.revokeObjectURL(url); } catch (e) {}
        }, 1000);
      }
      resolve(img);
    };

    img.onerror = (err) => {
      if (needRevoke) {
        try { URL.revokeObjectURL(url); } catch (e) {}
      }
      reject(new Error(`Failed to load image from source: ${err?.message || 'unknown'}`));
    };

    img.src = url;
  });
}


/**
 * Gets the natural width and height of an image file
 * @param {File|Blob|string} source 
 * @returns {Promise<{width: number, height: number, aspectRatio: number}>}
 */
export async function getImageDimensions(source) {
  let url = '';
  let needRevoke = false;

  if (typeof source === 'string') {
    url = source;
  } else if (source instanceof Blob || source instanceof File) {
    url = URL.createObjectURL(source);
    needRevoke = true;
  } else {
    throw new Error('Invalid image source type');
  }

  try {
    const img = await loadImage(url);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    return {
      width,
      height,
      aspectRatio: width / (height || 1)
    };
  } finally {
    if (needRevoke) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Formats bytes into human readable string
 * @param {number} bytes 
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Extracts base filename and extension
 * @param {string} filename 
 * @returns {{ base: string, ext: string }}
 */
export function parseFilename(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return { base: filename, ext: '' };
  }
  return {
    base: filename.substring(0, lastDot),
    ext: filename.substring(lastDot)
  };
}
