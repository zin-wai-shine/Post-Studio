import { loadImage } from './imageUtils';

/**
 * Calculates watermark dimensions preserving aspect ratio
 * @param {number} containerWidth 
 * @param {number} containerHeight 
 * @param {number} naturalWidth 
 * @param {number} naturalHeight 
 * @param {number} sizeRatio 
 * @returns {{ width: number, height: number }}
 */
export function calculateWatermarkDimensions(containerWidth, containerHeight, naturalWidth, naturalHeight, sizeRatio) {
  const aspect = (naturalWidth && naturalHeight) ? (naturalWidth / naturalHeight) : 1;
  // Size ratio is relative to image width, bounded sensibly
  const baseDim = Math.min(containerWidth, containerHeight * 1.5);
  const targetWidth = Math.max(24, Math.round(baseDim * sizeRatio));
  const targetHeight = Math.max(12, Math.round(targetWidth / aspect));
  return { width: targetWidth, height: targetHeight };
}

/**
 * Calculates normalized coordinates into absolute canvas pixel coordinates
 * @param {number} canvasWidth 
 * @param {number} canvasHeight 
 * @param {number} wmWidth 
 * @param {number} wmHeight 
 * @param {number} xPercent 0..1
 * @param {number} yPercent 0..1
 * @param {number} edgePaddingRatio 0..0.20
 * @returns {{ x: number, y: number, centerX: number, centerY: number }}
 */
export function calculateWatermarkPosition(canvasWidth, canvasHeight, wmWidth, wmHeight, xPercent, yPercent, edgePaddingRatio = 0.03) {
  const paddingX = Math.round(canvasWidth * edgePaddingRatio);
  const paddingY = Math.round(canvasHeight * edgePaddingRatio);

  const availableWidth = Math.max(0, canvasWidth - 2 * paddingX - wmWidth);
  const availableHeight = Math.max(0, canvasHeight - 2 * paddingY - wmHeight);

  const x = paddingX + (xPercent * availableWidth);
  const y = paddingY + (yPercent * availableHeight);

  return {
    x,
    y,
    centerX: x + (wmWidth / 2),
    centerY: y + (wmHeight / 2)
  };
}

/**
 * Draws a single watermark item (image or text) rotated around its center
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} param1
 */
function drawSingleWatermarkItem(ctx, {
  type,
  image,
  text,
  textColor,
  fontFamily,
  fontSize,
  fontWeight,
  centerX,
  centerY,
  width,
  height,
  rotationDeg
}) {
  ctx.save();
  ctx.translate(centerX, centerY);

  if (rotationDeg !== 0) {
    ctx.rotate((rotationDeg * Math.PI) / 180);
  }

  if (type === 'image' && image) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else if (type === 'text' && text) {
    ctx.font = `${fontWeight || '600'} ${fontSize}px ${fontFamily || 'Inter, sans-serif'}`;
    ctx.fillStyle = textColor || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtle drop shadow for high contrast readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

/**
 * Draws a repeating pattern of watermarks covering the full canvas
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} canvasWidth 
 * @param {number} canvasHeight 
 * @param {Object} watermarkItem 
 * @param {Object} patternConfig 
 */
function drawRepeatedWatermarkPattern(ctx, canvasWidth, canvasHeight, watermarkItem, patternConfig) {
  const {
    rotation = -30,
    horizontalGap = 0.15,
    verticalGap = 0.15,
    densityMultiplier = 1
  } = patternConfig;

  // Calculate diagonal to cover entire canvas under any rotation
  const diagonal = Math.hypot(canvasWidth, canvasHeight);
  const wmWidth = watermarkItem.width;
  const wmHeight = watermarkItem.height;

  const gapX = Math.max(30, (canvasWidth * horizontalGap * densityMultiplier));
  const gapY = Math.max(30, (canvasHeight * verticalGap * densityMultiplier));

  const stepX = wmWidth + gapX;
  const stepY = wmHeight + gapY;

  ctx.save();
  // Move to center of canvas and apply pattern rotation
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  const startX = -diagonal;
  const endX = diagonal;
  const startY = -diagonal;
  const endY = diagonal;

  let row = 0;
  for (let y = startY; y <= endY; y += stepY) {
    // Stagger every other row slightly for pleasant organic pattern
    const offsetX = (row % 2 === 0) ? 0 : (stepX / 2);
    for (let x = startX + offsetX; x <= endX; x += stepX) {
      drawSingleWatermarkItem(ctx, {
        ...watermarkItem,
        centerX: x,
        centerY: y,
        rotationDeg: watermarkItem.rotationDeg // individual item rotation
      });
    }
    row++;
  }

  ctx.restore();
}

/**
 * Renders source image and watermark onto an offscreen canvas and returns Blob
 * @param {Object} param0 
 * @returns {Promise<Blob>}
 */
export async function renderWatermarkedImage({
  sourceImage, // HTMLImageElement or URL
  watermarkImage, // HTMLImageElement, URL, or null
  settings,
  exportOptions = { format: 'original', quality: 0.92 }
}) {
  // 1. Resolve source image
  const img = (sourceImage instanceof HTMLImageElement) ? sourceImage : await loadImage(sourceImage);
  const canvasWidth = img.naturalWidth || img.width;
  const canvasHeight = img.naturalHeight || img.height;

  if (!canvasWidth || !canvasHeight) {
    throw new Error('Invalid source image dimensions.');
  }

  // 2. Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  if (!ctx) {
    throw new Error('Could not create Canvas 2D context.');
  }

  // Determine export MIME type
  let mimeType = 'image/jpeg';
  if (exportOptions.format === 'png') {
    mimeType = 'image/png';
  } else if (exportOptions.format === 'webp') {
    mimeType = 'image/webp';
  } else if (exportOptions.format === 'jpeg' || exportOptions.format === 'jpg') {
    mimeType = 'image/jpeg';
  } else {
    // 'original'
    if (img.src && img.src.includes('.png')) {
      mimeType = 'image/png';
    } else if (img.src && img.src.includes('.webp')) {
      mimeType = 'image/webp';
    } else {
      mimeType = 'image/jpeg';
    }
  }

  // If exporting as JPEG, fill background with white in case source has transparency
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Draw base image
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

  // If no watermark active, return base image directly
  const hasLogoWatermark = settings.type === 'image' && watermarkImage;
  const hasTextWatermark = settings.type === 'text' && settings.text && settings.text.trim().length > 0;

  if (hasLogoWatermark || hasTextWatermark) {
    // 3. Resolve watermark image element if needed
    let wmImg = null;
    let naturalWmWidth = 100;
    let naturalWmHeight = 100;

    if (hasLogoWatermark) {
      wmImg = (watermarkImage instanceof HTMLImageElement) ? watermarkImage : await loadImage(watermarkImage);
      naturalWmWidth = wmImg.naturalWidth || wmImg.width || 100;
      naturalWmHeight = wmImg.naturalHeight || wmImg.height || 100;
    }

    // Watermark dimensions
    let wmDims = { width: 100, height: 100 };
    let scaledFontSize = 24;

    if (hasLogoWatermark) {
      wmDims = calculateWatermarkDimensions(
        canvasWidth,
        canvasHeight,
        naturalWmWidth,
        naturalWmHeight,
        settings.size || 0.20
      );
    } else {
      // Text watermark sizing scaled to image resolution
      const resolutionScale = Math.max(0.5, canvasWidth / 1200);
      scaledFontSize = Math.round((settings.fontSize || 24) * resolutionScale);
      ctx.font = `${settings.fontWeight || '600'} ${scaledFontSize}px ${settings.fontFamily || 'Inter, sans-serif'}`;
      const textMetrics = ctx.measureText(settings.text);
      wmDims = {
        width: Math.round(textMetrics.width + 10),
        height: Math.round(scaledFontSize * 1.3)
      };
    }

    // Set overall opacity
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, settings.opacity || 0.80));

    const watermarkItem = {
      type: settings.type,
      image: wmImg,
      text: settings.text,
      textColor: settings.textColor,
      fontFamily: settings.fontFamily,
      fontSize: scaledFontSize,
      fontWeight: settings.fontWeight,
      width: wmDims.width,
      height: wmDims.height,
      rotationDeg: settings.rotation || 0
    };

    const style = settings.style || 'single';

    if (style === 'single') {
      const pos = calculateWatermarkPosition(
        canvasWidth,
        canvasHeight,
        wmDims.width,
        wmDims.height,
        settings.position?.x ?? 0.95,
        settings.position?.y ?? 0.95,
        settings.edgePadding ?? 0.03
      );

      drawSingleWatermarkItem(ctx, {
        ...watermarkItem,
        centerX: pos.centerX,
        centerY: pos.centerY
      });
    } else {
      // Repeated styles
      let densityMultiplier = 1.0;
      let rotation = settings.pattern?.rotation ?? -30;
      let horizontalGap = settings.pattern?.horizontalGap ?? 0.15;
      let verticalGap = settings.pattern?.verticalGap ?? 0.15;

      if (style === 'diagonal') {
        rotation = settings.pattern?.rotation ?? -35;
        densityMultiplier = 0.9;
      } else if (style === 'dot-grid') {
        rotation = 0;
        densityMultiplier = 0.65;
      } else if (style === 'sparse') {
        densityMultiplier = 1.6;
      } else if (style === 'dense') {
        densityMultiplier = 0.55;
      }

      drawRepeatedWatermarkPattern(ctx, canvasWidth, canvasHeight, watermarkItem, {
        rotation,
        horizontalGap,
        verticalGap,
        densityMultiplier
      });
    }
  }

  // 4. Convert canvas to Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image Blob from canvas.'));
        }
      },
      mimeType,
      exportOptions.quality ?? 0.92
    );
  });
}
