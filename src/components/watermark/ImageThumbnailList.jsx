import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiPlus, FiX, FiEdit2, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import './ImageThumbnailList.css';

export function ImageThumbnailList({
  images,
  activeImageId,
  onSelectImage,
  onRemoveImage,
  onClearAll,
  onAddMore,
  onRenameImage
}) {
  const fileInputRef = useRef(null);
  const trackRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);

  const [hasScroll, setHasScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasScroll(overflow);
    setCanScrollLeft(overflow && scrollLeft > 6);
    setCanScrollRight(overflow && scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = 142; // 130px card + 12px gap
    const visibleCards = Math.max(1, Math.floor(el.clientWidth / cardWidth));
    const scrollCards = Math.max(1, visibleCards - 1);
    const distance = scrollCards * cardWidth;

    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    const timer = setTimeout(updateScrollState, 150);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [images, updateScrollState]);

  useEffect(() => {
    if (!activeImageId || !trackRef.current) return;
    const activeEl = trackRef.current.querySelector(`[data-id="${activeImageId}"]`);
    if (activeEl) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const cardRect = activeEl.getBoundingClientRect();
      if (cardRect.left < trackRect.left || cardRect.right > trackRect.right) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeImageId]);

  if (!images || images.length === 0) return null;

  const handleStartRename = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setTempName(item.name);
  };

  const handleSaveRename = (e, id) => {
    e?.stopPropagation();
    if (tempName.trim() && onRenameImage) {
      onRenameImage(id, tempName.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setTempName('');
  };

  return (
    <div className="thumbnail-strip">
      <div className="thumbnail-header">
        <div className="thumbnail-count">
          <span className="thumbnail-title-text">Batch Images</span>
          <span className="text-muted text-sm">({images.length})</span>

          {hasScroll && (
            <div className="thumbnail-header-nav" aria-label="Thumbnail navigation">
              <button
                type="button"
                className="thumbnail-header-nav-btn"
                disabled={!canScrollLeft}
                onClick={() => handleScroll('left')}
                title="Scroll previous images"
                aria-label="Previous images"
              >
                <FiChevronLeft size={13} />
              </button>
              <button
                type="button"
                className="thumbnail-header-nav-btn"
                disabled={!canScrollRight}
                onClick={() => handleScroll('right')}
                title="Scroll next images"
                aria-label="Next images"
              >
                <FiChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="thumbnail-actions">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddMore(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<FiPlus size={13} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Add More
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<FiTrash2 size={13} />}
            disabled={images.length === 0}
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="thumbnail-track-wrapper">
        {hasScroll && canScrollLeft && (
          <>
            <div className="thumbnail-edge-fade left" />
            <button
              type="button"
              className="thumbnail-track-arrow prev"
              onClick={() => handleScroll('left')}
              title="Scroll previous"
              aria-label="Previous images"
            >
              <FiChevronLeft size={18} />
            </button>
          </>
        )}

        <div
          ref={trackRef}
          className="thumbnail-track"
          onScroll={updateScrollState}
          role="listbox"
          aria-label="Uploaded images thumbnail list"
        >
          {images.map((item) => {
            const isActive = item.id === activeImageId;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                data-id={item.id}
                className={`thumbnail-card ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (!isEditing) onSelectImage(item.id);
              }}
              role="option"
              aria-selected={isActive}
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isEditing) {
                  e.preventDefault();
                  onSelectImage(item.id);
                }
              }}
            >
              <div className="thumbnail-img-wrap">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="thumbnail-img"
                  loading="lazy"
                />
                <button
                  type="button"
                  className="thumbnail-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingImage(item);
                  }}
                  title="Remove this image"
                  aria-label={`Remove ${item.name}`}
                >
                  <FiX size={13} />
                </button>
              </div>

              <div className="thumbnail-info">
                {isEditing ? (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="thumbnail-rename-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(e, item.id);
                        if (e.key === 'Escape') handleCancelRename(e);
                      }}
                    />
                    <IconButton
                      icon={<FiCheck size={10} />}
                      size="sm"
                      onClick={(e) => handleSaveRename(e, item.id)}
                      aria-label="Save image name"
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span
                      className="thumbnail-name"
                      title={`${item.name} (Click to rename)`}
                      onDoubleClick={(e) => handleStartRename(e, item)}
                    >
                      {item.name}
                    </span>
                    <button
                      type="button"
                      className="thumbnail-rename-btn"
                      onClick={(e) => handleStartRename(e, item)}
                      title="Rename file"
                      aria-label={`Rename ${item.name}`}
                    >
                      <FiEdit2 size={10} />
                    </button>
                  </div>
                )}
                <span className="thumbnail-dims">
                  {item.width && item.height ? `${item.width}×${item.height}` : 'Loading...'}
                </span>
              </div>
            </div>
          );
        })}
        </div>

        {hasScroll && canScrollRight && (
          <>
            <div className="thumbnail-edge-fade right" />
            <button
              type="button"
              className="thumbnail-track-arrow next"
              onClick={() => handleScroll('right')}
              title="Scroll next"
              aria-label="Next images"
            >
              <FiChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Clear All Batch Images Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Images"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowClearConfirm(false);
                onClearAll();
              }}
            >
              Clear All Images
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to remove all {images.length} images from the workspace?
          This action cannot be undone.
        </p>
      </Modal>

      {/* Remove Single Image Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingImage)}
        onClose={() => setDeletingImage(null)}
        title="Remove Image"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingImage(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deletingImage) {
                  onRemoveImage(deletingImage.id);
                  setDeletingImage(null);
                }
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to remove <strong>{deletingImage?.name}</strong> from your batch?
        </p>
      </Modal>
    </div>
  );
}

