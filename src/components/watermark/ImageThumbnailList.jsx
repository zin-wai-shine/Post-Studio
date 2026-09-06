import React, { useRef, useState } from 'react';
import { FiTrash2, FiPlus, FiX, FiEdit2, FiCheck } from 'react-icons/fi';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
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
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

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
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
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
                    onRemoveImage(item.id);
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
    </div>
  );
}
