import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import './SavedWatermarks.css';

export function SavedWatermarks({
  savedWatermarks = [],
  activeWatermarkId,
  onSelectWatermark,
  onDeleteWatermark,
  loading = false
}) {
  const [deletingId, setDeletingId] = useState(null);

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

  return (
    <div className="saved-wm-section">
      <div className="saved-wm-header">
        <span className="saved-wm-title">Saved Watermarks</span>
        <span className="saved-wm-count">
          {savedWatermarks.length} saved
        </span>
      </div>

      {loading ? (
        <div className="saved-wm-empty">Loading saved logos...</div>
      ) : savedWatermarks.length === 0 ? (
        <div className="saved-wm-empty">
          No saved watermarks yet. Upload a logo and select "Save to Library".
        </div>
      ) : (
        <div className="saved-wm-grid">
          {savedWatermarks.map((item) => {
            const isActive = item.id === activeWatermarkId;
            return (
              <div
                key={item.id}
                className={`saved-wm-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectWatermark(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectWatermark(item);
                  }
                }}
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="saved-wm-thumb"
                />
                <span className="saved-wm-name" title={item.name}>
                  {item.name}
                </span>
                <IconButton
                  icon={<FiTrash2 size={12} />}
                  size="sm"
                  variant="danger"
                  className="saved-wm-delete-btn"
                  onClick={(e) => handleDeleteClick(e, item.id)}
                  title="Delete from library"
                  aria-label={`Delete ${item.name}`}
                />
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
