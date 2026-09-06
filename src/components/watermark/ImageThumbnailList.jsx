import React, { useRef } from 'react';
import { FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { Button } from '../common/Button';
import './ImageThumbnailList.css';

export function ImageThumbnailList({
  images,
  activeImageId,
  onSelectImage,
  onRemoveImage,
  onClearAll,
  onAddMore
}) {
  const fileInputRef = useRef(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="thumbnail-strip">
      <div className="thumbnail-header">
        <div className="thumbnail-count">
          <span>Batch Images</span>
          <span className="text-muted text-sm">({images.length})</span>
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
            onClick={onClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="thumbnail-track" role="listbox" aria-label="Uploaded images thumbnail list">
        {images.map((item) => {
          const isActive = item.id === activeImageId;
          return (
            <div
              key={item.id}
              className={`thumbnail-card ${isActive ? 'active' : ''}`}
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
                <button
                  type="button"
                  className="thumbnail-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(item.id);
                  }}
                  title="Remove this image"
                  aria-label={`Remove ${item.name}`}
                >
                  <FiX size={13} />
                </button>
              </div>
              <div className="thumbnail-info">
                <span className="thumbnail-name" title={item.name}>
                  {item.name}
                </span>
                <span className="thumbnail-dims">
                  {item.width && item.height ? `${item.width}×${item.height}` : 'Loading...'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
