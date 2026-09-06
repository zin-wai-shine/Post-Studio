import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2, FiPlus, FiX, FiEdit2, FiChevronLeft, FiChevronRight, FiMoreHorizontal, FiSliders } from 'react-icons/fi';
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
  onRenameImage,
  onToggleCustomOverrides,
  onResetImageCustom
}) {
  const fileInputRef = useRef(null);
  const trackRef = useRef(null);
  const [renamingImage, setRenamingImage] = useState(null);
  const [tempName, setTempName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);


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
    const cardWidth = 136; // 124px card + 12px gap
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

  const handleStartRename = (item) => {
    setRenamingImage(item);
    setTempName(item.name || '');
    setMenuAnchor(null);
  };

  const handleConfirmRename = () => {
    if (renamingImage && tempName.trim() && onRenameImage) {
      onRenameImage(renamingImage.id, tempName.trim());
    }
    setRenamingImage(null);
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
            accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.jfif,.heic,.heif"
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
            const isMenuOpen = menuAnchor?.item?.id === item.id;
            const isCustomized = Boolean(item.hasCustomOverrides);

            return (
              <div
                key={item.id}
                data-id={item.id}
                className={`thumbnail-card ${isActive ? 'active' : ''} ${isMenuOpen ? 'menu-active' : ''} ${isCustomized ? 'is-customized' : ''}`}
                onClick={() => onSelectImage(item.id)}
                role="option"
                aria-selected={isActive}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
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

                  {isCustomized && (
                    <span className="thumbnail-custom-badge" title="This image has custom watermark/crop settings">
                      Custom
                    </span>
                  )}

                  <div className="thumbnail-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`thumbnail-more-btn ${menuAnchor?.item?.id === item.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (menuAnchor?.item?.id === item.id) {
                          setMenuAnchor(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuAnchor({
                            top: rect.top,
                            left: rect.left,
                            item
                          });
                        }
                      }}
                      title="Image options"
                      aria-label={`Options for ${item.name}`}
                      aria-expanded={menuAnchor?.item?.id === item.id}
                    >
                      <FiMoreHorizontal size={13} />
                    </button>
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

                  {/* Subtle Base of Image showing size badge */}
                  <div className="thumbnail-base-overlay">
                    <span className="thumbnail-size-badge">
                      {item.width && item.height ? `${item.width}×${item.height}` : 'Loading...'}
                    </span>
                  </div>
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

      {/* Floating Popover / Dropdown "Title Box" */}
      {menuAnchor && typeof document !== 'undefined' && createPortal(
        <div
          className="thumbnail-popover-menu"
          style={{
            position: 'fixed',
            bottom: `${Math.max(16, window.innerHeight - menuAnchor.top + 8)}px`,
            left: `${Math.max(12, Math.min(window.innerWidth - 240, menuAnchor.left - 130))}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="thumbnail-popover-header">
            <span className="thumbnail-popover-title" title={menuAnchor.item.name}>
              {menuAnchor.item.name}
            </span>
            {menuAnchor.item.width && menuAnchor.item.height && (
              <span className="thumbnail-popover-meta">
                {menuAnchor.item.width} × {menuAnchor.item.height} px
              </span>
            )}
          </div>

          <div className="thumbnail-popover-divider" />

          <div className="thumbnail-popover-items">
            {/* Customize / Edit this image toggle or button */}
            <button
              type="button"
              className={`popover-action-item ${menuAnchor.item.hasCustomOverrides ? 'active-custom' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectImage(menuAnchor.item.id);
                if (menuAnchor.item.hasCustomOverrides) {
                  onResetImageCustom?.(menuAnchor.item.id);
                } else {
                  onToggleCustomOverrides?.(menuAnchor.item.id);
                }
                setMenuAnchor(null);
              }}
            >
              <span className="popover-action-icon">
                <FiSliders size={13} />
              </span>
              <div className="popover-action-text">
                <span className="popover-action-label">
                  {menuAnchor.item.hasCustomOverrides ? 'Single Image Edit (ON)' : 'Customize This Image'}
                </span>
                <span className="popover-action-sub">
                  {menuAnchor.item.hasCustomOverrides
                    ? 'Click to revert to batch settings'
                    : 'Edit settings only for this image'}
                </span>
              </div>
            </button>

            {/* Rename action */}
            <button
              type="button"
              className="popover-action-item"
              onClick={(e) => {
                e.stopPropagation();
                handleStartRename(menuAnchor.item);
              }}
            >
              <span className="popover-action-icon">
                <FiEdit2 size={13} />
              </span>
              <div className="popover-action-text">
                <span className="popover-action-label">Rename Image</span>
              </div>
            </button>

            {/* Remove action */}
            <button
              type="button"
              className="popover-action-item danger"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingImage(menuAnchor.item);
                setMenuAnchor(null);
              }}
            >
              <span className="popover-action-icon">
                <FiTrash2 size={13} />
              </span>
              <div className="popover-action-text">
                <span className="popover-action-label">Remove from Batch</span>
              </div>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Rename Single Image Modal */}
      <Modal
        isOpen={Boolean(renamingImage)}
        onClose={() => setRenamingImage(null)}
        title="Rename Image"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRenamingImage(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRename}
              disabled={!tempName.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmRename();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <label htmlFor="rename-img-input" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Enter a new name for this image:
          </label>
          <input
            id="rename-img-input"
            type="text"
            className="thumbnail-rename-modal-input"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            autoFocus
          />
        </form>
      </Modal>

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

