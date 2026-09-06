import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiImage, FiUploadCloud } from 'react-icons/fi';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { calculateWatermarkDimensions } from '../../utils/canvasUtils';
import { loadImage } from '../../utils/imageUtils';
import './ImagePreview.css';

export function ImagePreview({
  activeImage,
  watermarkSource, // previewUrl or null
  watermarkImgEl, // HTMLImageElement or null
  settings,
  cropSettings,
  onCustomPosition,
  onUploadClick
}) {
  const viewportRef = useRef(null);
  const wrapRef = useRef(null);
  const patternCanvasRef = useRef(null);
  const [wrapDims, setWrapDims] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

  const isCropActive = Boolean(cropSettings?.enabled && cropSettings.width && cropSettings.height);

  // Update wrap dimensions when active image, crop settings, or viewport size changes
  const updateRenderedDimensions = useCallback(() => {
    if (!viewportRef.current || !activeImage) return;

    const viewportRect = viewportRef.current.getBoundingClientRect();
    const availableWidth = viewportRect.width - 32;
    const availableHeight = viewportRect.height - 32;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    // Use crop target aspect if crop is enabled, otherwise use natural image aspect
    const targetAspect = (isCropActive && cropSettings.width && cropSettings.height)
      ? (cropSettings.width / cropSettings.height)
      : ((activeImage.width && activeImage.height)
        ? (activeImage.width / activeImage.height)
        : (16 / 9));

    const viewportAspect = availableWidth / availableHeight;

    let renderedWidth = 0;
    let renderedHeight = 0;

    if (viewportAspect > targetAspect) {
      // Height is constraining
      renderedHeight = availableHeight;
      renderedWidth = Math.round(availableHeight * targetAspect);
    } else {
      // Width is constraining
      renderedWidth = availableWidth;
      renderedHeight = Math.round(availableWidth / targetAspect);
    }

    setWrapDims({ width: renderedWidth, height: renderedHeight });
  }, [activeImage, isCropActive, cropSettings?.width, cropSettings?.height]);

  useEffect(() => {
    updateRenderedDimensions();
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateRenderedDimensions();
    });
    ro.observe(el);

    window.addEventListener('resize', updateRenderedDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateRenderedDimensions);
    };
  }, [updateRenderedDimensions]);

  // Compute watermark display dimensions inside preview wrap
  const wmAspect = (watermarkImgEl?.naturalWidth && watermarkImgEl?.naturalHeight)
    ? (watermarkImgEl.naturalWidth / watermarkImgEl.naturalHeight)
    : 1;

  let displayWmWidth = Math.max(24, Math.round(wrapDims.width * (settings.size || 0.20)));
  let displayWmHeight = Math.max(12, Math.round(displayWmWidth / wmAspect));

  if (settings.type === 'text') {
    const textScale = Math.max(0.6, wrapDims.width / 600);
    const scaledFontSize = Math.round((settings.fontSize || 24) * textScale);
    displayWmHeight = Math.round(scaledFontSize * 1.3);
    displayWmWidth = Math.round((settings.text?.length || 10) * scaledFontSize * 0.6 + 16);
  }

  const paddingX = Math.round(wrapDims.width * (settings.edgePadding ?? 0.03));
  const paddingY = Math.round(wrapDims.height * (settings.edgePadding ?? 0.03));

  const availableDragWidth = Math.max(0, wrapDims.width - 2 * paddingX - displayWmWidth);
  const availableDragHeight = Math.max(0, wrapDims.height - 2 * paddingY - displayWmHeight);

  const currentLeft = paddingX + ((settings.position?.x ?? 0.95) * availableDragWidth);
  const currentTop = paddingY + ((settings.position?.y ?? 0.95) * availableDragHeight);

  // Drag handlers
  const handlePointerDown = (e) => {
    if (settings.style !== 'single') return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: currentLeft,
      initialTop: currentTop
    };

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      const targetLeft = dragStartRef.current.initialLeft + deltaX;
      const targetTop = dragStartRef.current.initialTop + deltaY;

      const normX = availableDragWidth > 0
        ? (targetLeft - paddingX) / availableDragWidth
        : 0;
      const normY = availableDragHeight > 0
        ? (targetTop - paddingY) / availableDragHeight
        : 0;

      onCustomPosition(
        Math.max(0, Math.min(1, normX)),
        Math.max(0, Math.min(1, normY))
      );
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Draw pattern canvas for repeating watermark modes
  useEffect(() => {
    if (!patternCanvasRef.current || wrapDims.width === 0 || wrapDims.height === 0) return;
    if (settings.style === 'single') return;

    const canvas = patternCanvasRef.current;
    canvas.width = wrapDims.width;
    canvas.height = wrapDims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, settings.opacity || 0.80));

    const style = settings.style || 'repeated';
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

    const diagonal = Math.hypot(canvas.width, canvas.height);
    const gapX = Math.max(20, (canvas.width * horizontalGap * densityMultiplier));
    const gapY = Math.max(20, (canvas.height * verticalGap * densityMultiplier));

    const stepX = displayWmWidth + gapX;
    const stepY = displayWmHeight + gapY;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const startX = -diagonal;
    const endX = diagonal;
    const startY = -diagonal;
    const endY = diagonal;

    let row = 0;
    for (let y = startY; y <= endY; y += stepY) {
      const offsetX = (row % 2 === 0) ? 0 : (stepX / 2);
      for (let x = startX + offsetX; x <= endX; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        if (settings.rotation) {
          ctx.rotate((settings.rotation * Math.PI) / 180);
        }

        if (settings.type === 'image' && watermarkImgEl) {
          ctx.drawImage(
            watermarkImgEl,
            -displayWmWidth / 2,
            -displayWmHeight / 2,
            displayWmWidth,
            displayWmHeight
          );
        } else if (settings.type === 'text' && settings.text) {
          const fontSize = Math.max(12, Math.round(displayWmHeight * 0.7));
          ctx.font = `${settings.fontWeight || '600'} ${fontSize}px ${settings.fontFamily || 'Inter, sans-serif'}`;
          ctx.fillStyle = settings.textColor || '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 4;
          ctx.fillText(settings.text, 0, 0);
        }
        ctx.restore();
      }
      row++;
    }

    ctx.restore();
  }, [
    wrapDims,
    settings,
    watermarkImgEl,
    displayWmWidth,
    displayWmHeight
  ]);

  if (!activeImage) {
    return (
      <div className="preview-container">
        <div className="preview-empty-wrap">
          <EmptyState
            icon={<FiImage size={24} />}
            title="No Image Selected"
            description="Upload multiple images to apply one watermark configuration across the entire batch."
            action={
              <Button
                variant="primary"
                size="md"
                iconLeft={<FiUploadCloud size={14} />}
                onClick={onUploadClick}
              >
                Upload Images
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const hasWatermark = (settings.type === 'image' && watermarkSource) ||
    (settings.type === 'text' && settings.text && settings.text.trim().length > 0);

  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <span className="preview-filename" title={activeImage.name}>
          {activeImage.name}
        </span>
        <div className="preview-meta">
          {isCropActive ? (
            <>
              <span className="meta-badge" title="Original Dimensions">
                Orig: {activeImage.width} × {activeImage.height} px
              </span>
              <span className="meta-badge crop-active-badge" title="Standardized Dimensions">
                Standardized: {cropSettings.width} × {cropSettings.height} px ({cropSettings.preset !== 'custom' ? cropSettings.preset : 'Custom'})
              </span>
            </>
          ) : (
            <>
              <span className="meta-badge">
                {activeImage.width} × {activeImage.height} px
              </span>
              {activeImage.aspectRatio && (
                <span className="meta-badge">
                  {activeImage.aspectRatio.toFixed(2)}:1
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="preview-viewport" ref={viewportRef}>
        <div
          className="preview-canvas-wrap"
          ref={wrapRef}
          style={{
            width: wrapDims.width > 0 ? `${wrapDims.width}px` : 'auto',
            height: wrapDims.height > 0 ? `${wrapDims.height}px` : 'auto'
          }}
        >
          <img
            src={activeImage.previewUrl}
            alt={activeImage.name}
            className="preview-base-img"
            style={isCropActive ? {
              objectFit: cropSettings.fitMode === 'contain' ? 'contain' : 'cover',
              objectPosition: `${(cropSettings.focusX ?? 0.5) * 100}% ${(cropSettings.focusY ?? 0.5) * 100}%`,
              backgroundColor: cropSettings.bgColor || '#000000'
            } : undefined}
            onLoad={updateRenderedDimensions}
          />

          {hasWatermark && (
            <div className="preview-overlay-layer">
              {settings.style === 'single' ? (
                <div
                  className={`draggable-watermark ${isDragging ? 'is-dragging' : ''}`}
                  style={{
                    left: `${currentLeft}px`,
                    top: `${currentTop}px`,
                    width: `${displayWmWidth}px`,
                    height: `${displayWmHeight}px`,
                    opacity: settings.opacity ?? 0.8,
                    transform: `rotate(${settings.rotation ?? 0}deg)`
                  }}
                  onPointerDown={handlePointerDown}
                  title="Drag to position watermark"
                >
                  {settings.type === 'image' && watermarkSource && (
                    <img
                      src={watermarkSource}
                      alt="Watermark Preview"
                      className="watermark-img-preview"
                      draggable={false}
                    />
                  )}
                  {settings.type === 'text' && (
                    <span
                      className="watermark-text-preview"
                      style={{
                        fontFamily: settings.fontFamily || 'Inter, sans-serif',
                        fontSize: `${Math.max(12, Math.round(displayWmHeight * 0.7))}px`,
                        fontWeight: settings.fontWeight || '600',
                        color: settings.textColor || '#FFFFFF'
                      }}
                    >
                      {settings.text}
                    </span>
                  )}
                </div>
              ) : (
                <canvas
                  ref={patternCanvasRef}
                  className="pattern-preview-canvas"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
