import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useImageFiles } from '../hooks/useImageFiles';
import { useSavedPresets } from '../hooks/useSavedPresets';
import { useSavedWatermarks } from '../hooks/useSavedWatermarks';
import { PresetEditorCard } from '../components/presets/PresetEditorCard';
import { PresetModal } from '../components/presets/PresetModal';
import { ImageUploader } from '../components/watermark/ImageUploader';
import { ProcessingModal } from '../components/watermark/ProcessingModal';
import { Button } from '../components/common/Button';
import { IconButton } from '../components/common/IconButton';
import { Toast } from '../components/common/Toast';
import {
  exportPresetImage,
  batchExportPresetImages,
  generatePresetFilename,
  resolvePresetExtension
} from '../utils/presetUtils';
import {
  FiLayers,
  FiPlus,
  FiDownload,
  FiTrash2,
  FiCheck,
  FiImage,
  FiEdit2,
  FiCopy,
  FiRotateCcw
} from 'react-icons/fi';
import './Presets.css';

export function Presets() {
  const { registerResetHandler, setHeaderActions } = useOutletContext?.() || {};

  const {
    images,
    activeImageId,
    activeImage,
    setActiveImageId,
    addImages,
    removeImage,
    clearAllImages,
    isProcessingUpload
  } = useImageFiles();

  const {
    presets,
    loading: isPresetsLoading,
    addPreset,
    updatePreset,
    removePreset,
    duplicatePreset
  } = useSavedPresets();

  const { savedWatermarks } = useSavedWatermarks();

  // Selected presets IDs to apply & compare side-by-side
  const [selectedPresetIds, setSelectedPresetIds] = useState([]);

  // Auto-select first two presets when presets load if none selected yet
  useEffect(() => {
    if (presets.length > 0 && selectedPresetIds.length === 0) {
      if (presets.length >= 2) {
        setSelectedPresetIds([presets[0].id, presets[1].id]);
      } else {
        setSelectedPresetIds([presets[0].id]);
      }
    }
  }, [presets, selectedPresetIds.length]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  // UI state
  const [toast, setToast] = useState(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const isCancelledRef = useRef(false);

  // Auto-clear setting
  const [autoClearAfterDownload, setAutoClearAfterDownload] = useState(() => {
    try {
      return localStorage.getItem('pofix_auto_clear') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAutoClear = (checked) => {
    setAutoClearAfterDownload(checked);
    try {
      localStorage.setItem('pofix_auto_clear', String(checked));
    } catch (e) {
      console.warn('Failed to save auto clear:', e);
    }
  };

  // Register reset workspace
  useEffect(() => {
    if (registerResetHandler) {
      registerResetHandler(() => {
        clearAllImages();
        setToast({ type: 'info', message: 'Workspace cleared.' });
      });
    }
  }, [registerResetHandler, clearAllImages]);

  // Selected preset objects
  const selectedPresets = useMemo(() => {
    return presets.filter((p) => selectedPresetIds.includes(p.id));
  }, [presets, selectedPresetIds]);

  // Toggle selection of a preset
  const handleTogglePresetSelection = (id) => {
    setSelectedPresetIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          // Keep at least one selected if available
          return prev;
        }
        return prev.filter((pId) => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Open modal for new preset
  const handleCreatePreset = () => {
    setEditingPreset(null);
    setIsModalOpen(true);
  };

  // Open modal to edit existing
  const handleEditPreset = (preset) => {
    setEditingPreset(preset);
    setIsModalOpen(true);
  };

  // Save preset from modal
  const handleSavePresetModal = async (presetData) => {
    try {
      if (editingPreset?.id) {
        await updatePreset(editingPreset.id, presetData);
        setToast({ type: 'success', message: `Preset "${presetData.name}" updated!` });
      } else {
        const saved = await addPreset(presetData);
        // Also auto-select it
        setSelectedPresetIds((prev) => [...prev, saved.id]);
        setToast({ type: 'success', message: `Preset "${presetData.name}" created!` });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save preset.' });
    }
  };

  // Delete preset
  const handleDeletePreset = async (id, name) => {
    try {
      await removePreset(id);
      setSelectedPresetIds((prev) => prev.filter((pId) => pId !== id));
      setToast({ type: 'info', message: `Preset "${name}" removed.` });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete preset.' });
    }
  };

  // Duplicate preset
  const handleDuplicatePreset = async (id) => {
    try {
      const copy = await duplicatePreset(id);
      if (copy) {
        setSelectedPresetIds((prev) => [...prev, copy.id]);
        setToast({ type: 'success', message: `Created copy "${copy.name}".` });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to duplicate preset.' });
    }
  };

  // Update a preset's settings inline (e.g. from tuning slider)
  const handleUpdatePresetSettings = async (id, updates) => {
    try {
      await updatePreset(id, updates);
    } catch (err) {
      console.warn('Failed to update inline settings:', err);
    }
  };

  // Load sample demo assets
  const handleLoadDemoSamples = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/demo-assets/villa-exterior.jpg'),
        fetch('/demo-assets/living-room.jpg')
      ]);
      const [b1, b2] = await Promise.all([r1.blob(), r2.blob()]);
      const f1 = new File([b1], 'villa-exterior.jpg', { type: 'image/jpeg' });
      const f2 = new File([b2], 'living-room.jpg', { type: 'image/jpeg' });
      await addImages([f1, f2]);
      setToast({ type: 'success', message: 'Loaded demo property photos.' });
    } catch (err) {
      console.error('Failed to load demo photos:', err);
      setToast({ type: 'error', message: 'Could not load sample photos.' });
    }
  };

  // Download Single Image for a Preset
  const handleDownloadSingle = async (preset) => {
    if (!activeImage) return;
    try {
      const res = await exportPresetImage({
        image: activeImage,
        preset
      });

      if (autoClearAfterDownload) {
        removeImage(activeImage.id);
        setToast({
          type: 'success',
          message: `Exported ${res.filename}. Workspace auto-cleared.`
        });
      } else {
        setToast({
          type: 'success',
          message: `Exported ${res.filename}`
        });
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.message || 'Export failed.' });
    }
  };

  // Download All Images for One Preset
  const handleDownloadAllForPreset = async (preset) => {
    if (images.length === 0) return;
    isCancelledRef.current = false;
    setIsProcessingBatch(true);
    setBatchProgress({
      current: 0,
      total: images.length,
      percentage: 0,
      currentFilename: `Starting ${preset.prefix} export...`
    });

    try {
      await batchExportPresetImages({
        images,
        preset,
        onProgress: (prog) => setBatchProgress(prog),
        isCancelledRef
      });

      if (autoClearAfterDownload) {
        clearAllImages();
        setToast({
          type: 'success',
          message: `Downloaded ${images.length} images for ${preset.name}. Workspace auto-cleared.`
        });
      } else {
        setToast({
          type: 'success',
          message: `Successfully downloaded ${images.length} images for ${preset.name}!`
        });
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        setToast({ type: 'error', message: err.message || 'Batch export failed.' });
      }
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress(null);
    }
  };

  // Download All Images for ALL Selected Presets
  const handleDownloadAllSelectedPresets = async () => {
    if (images.length === 0 || selectedPresets.length === 0) return;
    isCancelledRef.current = false;
    setIsProcessingBatch(true);

    const totalOps = images.length * selectedPresets.length;
    let completedOps = 0;

    try {
      for (const preset of selectedPresets) {
        if (isCancelledRef.current) break;

        await batchExportPresetImages({
          images,
          preset,
          onProgress: (prog) => {
            completedOps++;
            setBatchProgress({
              current: completedOps,
              total: totalOps,
              percentage: Math.round((completedOps / totalOps) * 100),
              currentFilename: `[${preset.prefix}] ${prog.currentFilename}`
            });
          },
          isCancelledRef
        });
      }

      if (!isCancelledRef.current) {
        if (autoClearAfterDownload) {
          clearAllImages();
          setToast({
            type: 'success',
            message: `Downloaded all ${totalOps} images across ${selectedPresets.length} styles! Workspace auto-cleared.`
          });
        } else {
          setToast({
            type: 'success',
            message: `Downloaded all ${totalOps} images across ${selectedPresets.length} styles!`
          });
        }
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        setToast({ type: 'error', message: err.message || 'Batch export failed.' });
      }
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress(null);
    }
  };

  const handleCancelExport = () => {
    isCancelledRef.current = true;
    setIsProcessingBatch(false);
    setBatchProgress(null);
    setToast({ type: 'info', message: 'Export cancelled.' });
  };

  // Set Header Actions in App layout
  useEffect(() => {
    if (setHeaderActions) {
      setHeaderActions(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {images.length > 0 && selectedPresets.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAllSelectedPresets}
              icon={<FiDownload size={14} />}
              disabled={isProcessingBatch}
            >
              Download All ({selectedPresets.length} Styles × {images.length})
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCreatePreset}
            icon={<FiPlus size={14} />}
          >
            New Preset
          </Button>
        </div>
      );
    }
    return () => {
      if (setHeaderActions) setHeaderActions(null);
    };
  }, [setHeaderActions, images.length, selectedPresets.length, isProcessingBatch]);

  return (
    <div className="presets-page">
      {/* Top Presets Selector Bar */}
      <div className="presets-top-bar">
        <div className="presets-selection-group">
          <span className="presets-bar-title">
            <FiLayers size={14} /> Active Styles:
          </span>

          <div className="presets-chips-list">
            {presets.map((p) => {
              const isSelected = selectedPresetIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`preset-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleTogglePresetSelection(p.id)}
                  title={`Toggle ${p.name}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="preset-chip-checkbox"
                  />
                  <span className="preset-chip-prefix">{p.prefix}</span>
                  <span className="preset-chip-name">{p.name}</span>
                </div>
              );
            })}

            <button
              type="button"
              className="preset-chip"
              onClick={handleCreatePreset}
              style={{ borderStyle: 'dashed' }}
            >
              <FiPlus size={13} />
              <span>Add Style</span>
            </button>
          </div>
        </div>

        <div className="presets-top-actions">
          {images.length > 0 && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={autoClearAfterDownload}
                onChange={(e) => handleToggleAutoClear(e.target.checked)}
                style={{ accentColor: 'var(--color-main)' }}
              />
              Auto-clear workspace
            </label>
          )}

          {images.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllImages}
              icon={<FiTrash2 size={13} />}
            >
              Clear Images
            </Button>
          )}
        </div>
      </div>

      {/* Image Thumbnails Strip (When Images Uploaded) */}
      {images.length > 0 && (
        <div className="presets-images-strip">
          <div className="presets-thumbs-row">
            {images.map((img, idx) => {
              const isActive = img.id === activeImageId;
              return (
                <div
                  key={img.id}
                  className={`presets-thumb-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveImageId(img.id)}
                  title={`${img.name} (Photo ${idx + 1} of ${images.length})`}
                >
                  <img src={img.previewUrl} alt={img.name} className="presets-thumb-img" />
                </div>
              );
            })}
          </div>

          <div className="presets-strip-info">
            <span>
              Photo {images.findIndex((i) => i.id === activeImageId) + 1} of {images.length}
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="presets-workspace">
        {images.length === 0 ? (
          /* Empty State: Upload or Manage Library */
          <div className="presets-empty-container">
            <div className="presets-upload-box">
              <ImageUploader
                onImagesSelected={addImages}
                isProcessing={isProcessingUpload}
                disabled={isProcessingUpload}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>or</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadDemoSamples}
                icon={<FiImage size={14} />}
              >
                Load Sample Real Estate Photos
              </Button>
            </div>

            {/* Saved Presets Library Grid */}
            <div className="presets-library-section">
              <div className="presets-library-header">
                <span className="presets-library-title">Saved Presets Library ({presets.length})</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCreatePreset}
                  icon={<FiPlus size={13} />}
                >
                  Create Preset
                </Button>
              </div>

              <div className="presets-library-grid">
                {presets.map((preset) => {
                  const isSel = selectedPresetIds.includes(preset.id);
                  const sampleName = generatePresetFilename(preset.prefix || 'BOL', '.jpg');
                  const cropDesc = preset.cropSettings?.enabled
                    ? `${preset.cropSettings.preset} (${preset.cropSettings.width}×${preset.cropSettings.height})`
                    : 'Original Size';

                  return (
                    <div key={preset.id} className="preset-library-card">
                      <div className="preset-card-top">
                        <span className="preset-library-prefix">{preset.prefix}</span>
                        <span className="preset-library-name">{preset.name}</span>
                      </div>

                      <div className="preset-library-details">
                        <div className="preset-library-badge-row">
                          <span className="preset-detail-pill">{cropDesc}</span>
                          <span className="preset-detail-pill">
                            {preset.settings?.type === 'text'
                              ? `Text: ${preset.settings.text || 'POFIX'}`
                              : 'Logo Watermark'}
                          </span>
                          {preset.settings?.border?.style !== 'none' && (
                            <span className="preset-detail-pill">
                              Border: {preset.settings.border.style}
                            </span>
                          )}
                        </div>
                        <code style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                          {sampleName}
                        </code>
                      </div>

                      <div className="preset-library-footer">
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => handleTogglePresetSelection(preset.id)}
                            style={{ accentColor: 'var(--color-main)' }}
                          />
                          {isSel ? 'Active' : 'Select'}
                        </label>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <IconButton
                            icon={<FiCopy size={13} />}
                            size="sm"
                            onClick={() => handleDuplicatePreset(preset.id)}
                            title="Duplicate preset"
                          />
                          <IconButton
                            icon={<FiEdit2 size={13} />}
                            size="sm"
                            onClick={() => handleEditPreset(preset)}
                            title="Edit preset"
                          />
                          {presets.length > 1 && (
                            <IconButton
                              icon={<FiTrash2 size={13} />}
                              size="sm"
                              onClick={() => handleDeletePreset(preset.id, preset.name)}
                              title="Delete preset"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="preset-create-card" onClick={handleCreatePreset}>
                  <FiPlus size={24} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Create New Style Preset</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Save custom watermark & 3-letter naming prefix
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Preset Editor Comparison Grid */
          <div className="presets-editors-grid">
            {selectedPresets.map((preset) => (
              <PresetEditorCard
                key={preset.id}
                preset={preset}
                activeImage={activeImage}
                images={images}
                onEditPreset={handleEditPreset}
                onUpdatePresetSettings={handleUpdatePresetSettings}
                onDownloadSingle={handleDownloadSingle}
                onDownloadAll={handleDownloadAllForPreset}
                isDownloading={isProcessingBatch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preset Create / Edit Modal */}
      <PresetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePresetModal}
        initialData={editingPreset}
        savedWatermarks={savedWatermarks}
      />

      {/* Batch Processing Modal */}
      <ProcessingModal
        isOpen={isProcessingBatch}
        current={batchProgress?.current || 0}
        total={batchProgress?.total || 1}
        percentage={batchProgress?.percentage || 0}
        currentFilename={batchProgress?.currentFilename || 'Processing...'}
        onCancel={handleCancelExport}
      />

      {/* Toast Feedback */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3500}
        />
      )}
    </div>
  );
}
export default Presets;
