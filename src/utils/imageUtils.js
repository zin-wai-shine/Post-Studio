/**
 * Validates whether a file is an accepted image type
 * @param {File} file 
 * @returns {boolean}
 */
export function isValidImageFile(file) {
  if (!file) return false;
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const matchesMime = validMimeTypes.includes(file.type.toLowerCase());
  const matchesExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  return matchesMime || matchesExt;
}

/**
 * Loads an HTMLImageElement from a URL or Object URL
 * @param {string} src 
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image from source: ${err}`));
    img.src = src;
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
