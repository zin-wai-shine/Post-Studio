import React, { useState } from 'react';
import { FiTrash2, FiEdit2, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import './SavedWatermarks.css';

export function SavedWatermarks({
  savedWatermarks = [],
  activeWatermarkId,
  onSelectWatermark,
  onDeleteWatermark,
  onRenameWatermark,
  onUploadNewWatermark,
  loading = false
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await onDeleteWatermark(deletingId);
      setDeletingId(null);
    }
  };

  const handleStartRename = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingName(item.name || '');
  };

  const handleSaveRename = async (e, id) => {
    e?.stopPropagation();
    if (editingName.trim() && onRenameWatermark) {
      await onRenameWatermark(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="saved-wm-section">
      <div className="saved-wm-header">
        <div className="saved-wm-title-wrap">
          <span className="saved-wm-title">Saved Watermarks</span>
          <span className="saved-wm-count">({savedWatermarks.length})</span>
        </div>

        {onUploadNewWatermark && (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<FiPlus size={12} />}
            onClick={onUploadNewWatermark}
            title="Upload a new watermark logo"
          >
            Add Logo
          </Button>
        )}
      </div>

      {loading ? (
        <div className="saved-wm-empty">Loading saved logos...</div>
      ) : savedWatermarks.length === 0 ? (
        <div className="saved-wm-empty">
          No saved watermarks yet. Upload a logo above and select "Save to Library".
        </div>
      ) : (
        <div className="saved-wm-list">
          {savedWatermarks.map((item) => {
            const isActive = item.id === activeWatermarkId;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`saved-wm-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!isEditing) onSelectWatermark(item);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isEditing) {
                    e.preventDefault();
                    onSelectWatermark(item);
                  }
                }}
              >
                <div className="saved-wm-left">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="saved-wm-thumb"
                  />

                  <div className="saved-wm-name-wrap">
                    {isEditing ? (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="saved-wm-edit-input"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(e, item.id);
                            if (e.key === 'Escape') handleCancelRename(e);
                          }}
                        />
                        <IconButton
                          icon={<FiCheck size={12} />}
                          size="sm"
                          onClick={(e) => handleSaveRename(e, item.id)}
                          aria-label="Save name"
                        />
                        <IconButton
                          icon={<FiX size={12} />}
                          size="sm"
                          onClick={handleCancelRename}
                          aria-label="Cancel rename"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="saved-wm-name" title={item.name}>
                          {item.name}
                        </span>
                        {isActive && (
                          <span className="saved-wm-active-badge">
                            <FiCheck size={11} /> Selected
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="saved-wm-actions">
                    <IconButton
                      icon={<FiEdit2 size={12} />}
                      size="sm"
                      onClick={(e) => handleStartRename(e, item)}
                      title="Rename this watermark"
                      aria-label={`Rename ${item.name}`}
                    />
                    <IconButton
                      icon={<FiTrash2 size={12} />}
                      size="sm"
                      variant="danger"
                      onClick={(e) => handleDeleteClick(e, item.id)}
                      title="Delete from library"
                      aria-label={`Delete ${item.name}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation modal for watermark deletion */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Delete Saved Watermark"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
            >
              Delete Watermark
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this saved watermark from your browser storage?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
