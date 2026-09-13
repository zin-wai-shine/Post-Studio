import { loadImage, parseFilename } from './imageUtils.js';
import { SOCIAL_GRID_LAYOUTS, FOCUS_POSITIONS } from '../constants/watermark.js';
import { calculateCropRect, drawWatermarkLayer } from './canvasUtils.js';

/**
 * Retrieves layout config by id
 * @param {string} layoutId 
 * @returns {Object}
 */
export function getLayoutConfig(layoutId) {
  return SOCIAL_GRID_LAYOUTS.find((l) => l.id === layoutId) || SOCIAL_GRID_LAYOUTS[3]; // default four-squares
}

/**
 * Computes the source crop rectangle for a specific tile within the source image
 * @param {Object} tile - layout tile config { x, y, w, h }
 * @param {number} naturalWidth 
 * @param {number} naturalHeight 
 * @param {number|null} targetWidth 
 * @param {number|null} targetHeight 
 * @param {string} focusKey 
 * @returns {{ sx: number, sy: number, sw: number, sh: number, tileRawX: number, tileRawY: number, tileRawW: number, tileRawH: number }}
 */
export function computeTileCropRect(tile, naturalWidth, naturalHeight, targetWidth, targetHeight, focusKey = 'center') {
  const tileRawX = Math.round(tile.x * naturalWidth);
  const tileRawY = Math.round(tile.y * naturalHeight);
  const tileRawW = Math.round(tile.w * naturalWidth);
  const tileRawH = Math.round(tile.h * naturalHeight);

  if (!targetWidth || !targetHeight) {
    return {
      sx: tileRawX,
      sy: tileRawY,
      sw: tileRawW,
      sh: tileRawH,
      tileRawX,
      tileRawY,
      tileRawW,
      tileRawH
    };
  }

  const focusDef = FOCUS_POSITIONS[focusKey] || FOCUS_POSITIONS.center;
  const focusX = focusDef.x ?? 0.5;
  const focusY = focusDef.y ?? 0.5;

  const { srcX: localX, srcY: localY, cropWidth: localW, cropHeight: localH } = calculateCropRect(
    tileRawW,
    tileRawH,
    targetWidth,
    targetHeight,
    focusX,
    focusY,
    1
  );

  return {
    sx: tileRawX + localX,
    sy: tileRawY + localY,
    sw: localW,
    sh: localH,
    tileRawX,
    tileRawY,
    tileRawW,
    tileRawH
  };
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
 * Slices a source image into discrete image files based on selected grid layout and optional target crop size
 * @param {HTMLImageElement|File|Blob|string} sourceImage 
 * @param {string} layoutId 
 * @param {Object} options 
 * @returns {Promise<Array<Object>>} Sliced tile objects ready for useImageFiles
 */
export async function sliceImageIntoGridTiles(sourceImage, layoutId = 'four-squares', options = {}) {
  const {
    focus = 'center',
    tileFocusMap = {},
    targetCropPreset = 'original',
    targetWidth = null,
    targetHeight = null,
    baseFilename = 'grid-post.jpg',
    quality = 0.95,
    useWatermark = true,
    watermarkImage = null,
    watermarkSettings = null
  } = options;
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

  // Prepare source drawable: composite watermark if enabled
  let sourceDrawable = img;
  if (useWatermark && watermarkSettings && (watermarkImage || (watermarkSettings.type === 'text' && watermarkSettings.text))) {
    try {
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = naturalWidth;
      compositeCanvas.height = naturalHeight;
      const cCtx = compositeCanvas.getContext('2d');
      if (cCtx) {
        cCtx.drawImage(img, 0, 0, naturalWidth, naturalHeight);
        await drawWatermarkLayer(cCtx, naturalWidth, naturalHeight, watermarkSettings, watermarkImage);
        sourceDrawable = compositeCanvas;
      }
    } catch (wmErr) {
      console.warn('Failed to composite watermark onto grid source:', wmErr);
    }
  }

  const isTargetCropActive = Boolean(
    targetCropPreset &&
    targetCropPreset !== 'original' &&
    targetWidth &&
    targetHeight
  );

  const tileResults = [];

  for (let i = 0; i < layout.tiles.length; i++) {
    const tile = layout.tiles[i];
    const tileFocusKey = (tileFocusMap && tileFocusMap[tile.id]) || focus || 'center';

    const { sx, sy, sw, sh } = computeTileCropRect(
      tile,
      naturalWidth,
      naturalHeight,
      isTargetCropActive ? targetWidth : null,
      isTargetCropActive ? targetHeight : null,
      tileFocusKey
    );

    if (sw <= 0 || sh <= 0) continue;

    const canvasWidth = isTargetCropActive ? Math.round(targetWidth) : sw;
    const canvasHeight = isTargetCropActive ? Math.round(targetHeight) : sh;

    // Create slice canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    if (!ctx) {
      throw new Error(`Failed to create 2D canvas context for tile ${tile.id}.`);
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background for safety
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw slice from sourceDrawable (cropped to target size)
    ctx.drawImage(sourceDrawable, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);

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
      width: canvasWidth,
      height: canvasHeight,
      aspectRatio: canvasWidth / (canvasHeight || 1),
      previewUrl,
      isGridTile: true,
      tileIndex: i + 1,
      totalTiles: layout.tiles.length,
      tileLabel: tile.label,
      layoutId: layout.id,
      layoutName: layout.name,
      focusKey: tileFocusKey,
      targetPreset: targetCropPreset
    };

    tileResults.push(tileItem);
  }

  return tileResults;
}

