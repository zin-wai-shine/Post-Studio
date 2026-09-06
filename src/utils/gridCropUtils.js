import { loadImage, parseFilename } from './imageUtils.js';
import { SOCIAL_GRID_LAYOUTS, FOCUS_POSITIONS } from '../constants/watermark.js';

/**
 * Retrieves layout config by id
 * @param {string} layoutId 
 * @returns {Object}
 */
export function getLayoutConfig(layoutId) {
  return SOCIAL_GRID_LAYOUTS.find((l) => l.id === layoutId) || SOCIAL_GRID_LAYOUTS[3]; // default four-squares
}

/**
 * Calculates crop bounding box on the original image for the grid container
 * @param {number} naturalWidth 
 * @param {number} naturalHeight 
 * @param {number} targetAspect 
 * @param {string} focusKey 
 * @returns {{ cropX: number, cropY: number, cropWidth: number, cropHeight: number }}
 */
export function computeGridCropRect(naturalWidth, naturalHeight, targetAspect = 1, focusKey = 'center') {
  const imageAspect = naturalWidth / (naturalHeight || 1);
  const focus = FOCUS_POSITIONS[focusKey] || FOCUS_POSITIONS.center;

  let cropWidth = naturalWidth;
  let cropHeight = naturalHeight;

  if (imageAspect > targetAspect) {
    // Image is wider than target aspect: crop sides
    cropHeight = naturalHeight;
    cropWidth = Math.round(naturalHeight * targetAspect);
  } else {
    // Image is taller than target aspect: crop top/bottom
    cropWidth = naturalWidth;
    cropHeight = Math.round(naturalWidth / targetAspect);
  }

  const maxOffsetX = Math.max(0, naturalWidth - cropWidth);
  const maxOffsetY = Math.max(0, naturalHeight - cropHeight);

  const cropX = Math.round(maxOffsetX * (focus.x ?? 0.5));
  const cropY = Math.round(maxOffsetY * (focus.y ?? 0.5));

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight
  };
}

/**
 * Slices a source image into discrete image files based on selected grid layout
 * @param {HTMLImageElement|File|Blob|string} sourceImage 
 * @param {string} layoutId 
 * @param {Object} options 
 * @returns {Promise<Array<Object>>} Sliced tile objects ready for useImageFiles
 */
export async function sliceImageIntoGridTiles(sourceImage, layoutId = 'four-squares', options = {}) {
  const { focus = 'center', baseFilename = 'grid-post.jpg', quality = 0.95 } = options;
  const layout = getLayoutConfig(layoutId);

  const img = (sourceImage instanceof HTMLImageElement)
    ? sourceImage
    : await loadImage(sourceImage);

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  if (!naturalWidth || !naturalHeight) {
    throw new Error('Unable to read source image dimensions for grid slice.');
  }

  const { base: rawBaseName } = parseFilename(baseFilename);
  const cleanBaseName = rawBaseName.replace(/[-_]grid[-_]\d+.*$/i, ''); // Strip previous grid suffix if any

  // Calculate master crop bounding box
  const { cropX, cropY, cropWidth, cropHeight } = computeGridCropRect(
    naturalWidth,
    naturalHeight,
    layout.aspect || 1,
    focus
  );

  const tileResults = [];

  for (let i = 0; i < layout.tiles.length; i++) {
    const tile = layout.tiles[i];

    // Calculate source rect in natural pixel space
    const sx = Math.round(cropX + (tile.x * cropWidth));
    const sy = Math.round(cropY + (tile.y * cropHeight));
    const sw = Math.round(tile.w * cropWidth);
    const sh = Math.round(tile.h * cropHeight);

    if (sw <= 0 || sh <= 0) continue;

    // Create slice canvas
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    if (!ctx) {
      throw new Error(`Failed to create 2D canvas context for tile ${tile.id}.`);
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background for safety
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sw, sh);

    // Draw slice
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    // Convert to Blob
    const mimeType = 'image/jpeg';
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to export tile ${tile.id} blob.`));
        },
        mimeType,
        quality
      );
    });

    const tileFileName = `${cleanBaseName}-tile${tile.id}-${tile.key}.jpg`;
    const tileFile = new File([blob], tileFileName, { type: mimeType });
    const previewUrl = URL.createObjectURL(tileFile);

    const tileItem = {
      id: `grid_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      file: tileFile,
      name: tileFileName,
      size: tileFile.size,
      width: sw,
      height: sh,
      aspectRatio: sw / (sh || 1),
      previewUrl,
      isGridTile: true,
      tileIndex: i + 1,
      totalTiles: layout.tiles.length,
      tileLabel: tile.label,
      layoutId: layout.id,
      layoutName: layout.name
    };

    tileResults.push(tileItem);
  }

  return tileResults;
}
