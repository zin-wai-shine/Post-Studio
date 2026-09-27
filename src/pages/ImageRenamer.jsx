import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useImageFiles } from '../hooks/useImageFiles';
import { ImageUploader } from '../components/watermark/ImageUploader';
import { ProcessingModal } from '../components/watermark/ProcessingModal';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { IconButton } from '../components/common/IconButton';
import { Toast } from '../components/common/Toast';
import { triggerDownload } from '../utils/downloadUtils';
import { parseFilename, formatBytes } from '../utils/imageUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FiDownload,
  FiArchive,
  FiRotateCcw,
  FiTrash2,
  FiEdit3,
  FiPlus,
  FiCheck,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSearch,
  FiHash,
  FiType
} from 'react-icons/fi';
import './ImageRenamer.css';

// ─── BDO Naming Helpers ───────────────────────────────────────────────────────

/**
 * Generates a 6-digit random number string, zero-padded.
 * @returns {string} e.g. "482951"
 */
function randomDigits6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generates a 4-character random UPPERCASE letter string.
 * @returns {string} e.g. "XKQM"
 */
function randomCaps4() {
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  }
  return result;
}

/**
 * Generates a unique BDO filename: BDO-{6digits}-{4CAPS}{ext}
 * @param {string} ext  e.g. ".jpg"
 * @returns {string} e.g. "BDO-482951-XKQM.jpg"
 */
function generateBdoName(ext) {
  return `BDO-${randomDigits6()}-${randomCaps4()}${ext}`;
}

// ──────────────────────────────────────────────────────────────────────────────

export function ImageRenamer() {
  const { registerResetHandler, setHeaderActions } = useOutletContext?.() || {};

  const {
    images,
    addImages,
    removeImage,
    clearAllImages,
    renameImage,
    batchRenameImages,
    resetAllNamesToOriginal,
    isProcessingUpload
  } = useImageFiles();

  // View mode
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('pofix_renamer_view_mode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('pofix_renamer_view_mode', mode);
    } catch {}
  };

  // Batch rename tool tab: 'sequence' | 'prefix-suffix' | 'replace' | 'casing'
  const [activeTab, setActiveTab] = useState('sequence');

  // Sequence state — default to BDO pattern
  const [baseName, setBaseName] = useState('');
  const [startNum, setStartNum] = useState(1);
  const [paddingDigits, setPaddingDigits] = useState(6);
  const [separator, setSeparator] = useState('-');
  const [seqPrefix, setSeqPrefix] = useState('BDO-');
  const [seqSuffix, setSeqSuffix] = useState('');

  // BDO mode: auto-generate a unique random name per image (true = BDO, false = sequential numbering)
  const [bdoMode, setBdoMode] = useState(true);

  // Track the last count of images so we only auto-apply on new additions
  const prevImageCountRef = useRef(0);

  // Prefix & Suffix state
  const [customPrefix, setCustomPrefix] = useState('');
  const [customSuffix, setCustomSuffix] = useState('');

  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  // Text Casing state
  const [textCase, setTextCase] = useState('lowercase');
  const [spaceHandling, setSpaceHandling] = useState('underscore');

  // Download & processing state
  const [isDownloading, setIsDownloading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0, currentFilename: '' });
  const isCancelledRef = useRef(false);

  // UI Modals & Toast
  const [toast, setToast] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Hidden file input for adding more images
  const addMoreInputRef = useRef(null);

  // Register Reset Workspace
  useEffect(() => {
    if (registerResetHandler) {
      registerResetHandler(() => {
        if (images.length > 0) {
          setShowClearConfirm(true);
        }
      });
    }
  }, [registerResetHandler, images.length]);

  // Auto-apply BDO naming whenever images are added (count increases)
  useEffect(() => {
    if (images.length > prevImageCountRef.current) {
      // New images were added — apply BDO names to ALL current images
      const nameMap = {};
      images.forEach((img) => {
        const { ext } = parseFilename(img.name);
        nameMap[img.id] = generateBdoName(ext);
      });
      batchRenameImages(nameMap);
    }
    prevImageCountRef.current = images.length;
  }, [images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle uploading files
  const handleFilesSelected = async (fileList) => {
    try {
      const added = await addImages(fileList);
      setToast({
        type: 'success',
        message: `Added ${added.length} image${added.length > 1 ? 's' : ''}.`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload images.' });
    }
  };

  // Load demo sample images
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
      setToast({
        type: 'success',
        message: 'Loaded sample images successfully.'
      });
    } catch (err) {
      console.error('Failed to load sample assets:', err);
      setToast({ type: 'error', message: 'Failed to load demo assets.' });
    }
  };

  // Direct Sequential Download All
  const handleDownloadAllDirect = useCallback(async () => {
    if (images.length === 0 || isDownloading || isZipping) return;

    setIsDownloading(true);
    isCancelledRef.current = false;
    const total = images.length;
    setProgress({ current: 0, total, percentage: 0, currentFilename: '' });

    try {
      for (let i = 0; i < total; i++) {
        if (isCancelledRef.current) {
          throw new Error('Download cancelled by user.');
        }

        const item = images[i];
        const filename = item.name;

        setProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          currentFilename: filename
        });

        // Trigger direct browser download
        triggerDownload(item.file, filename);

        // Stagger browser downloads to prevent throttling
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      setToast({
        type: 'success',
        message: `Downloaded all ${total} images! Workspace cleared.`
      });
      // Auto-clear uploaded images after successful download
      clearAllImages();
    } catch (err) {
      if (!isCancelledRef.current) {
        setToast({ type: 'error', message: err.message || 'Failed to download images.' });
      }
    } finally {
      setIsDownloading(false);
    }
  }, [images, isDownloading, isZipping, clearAllImages]);

  // ZIP Archive Download All
  const handleDownloadZip = useCallback(async () => {
    if (images.length === 0 || isDownloading || isZipping) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      images.forEach((img) => {
        zip.file(img.name, img.file);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `renamed-images-${Date.now().toString(36)}.zip`);

      setToast({
        type: 'success',
        message: `Exported ${images.length} images to ZIP! Workspace cleared.`
      });
      // Auto-clear uploaded images after successful ZIP export
      clearAllImages();
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
      setToast({ type: 'error', message: 'Failed to generate ZIP archive.' });
    } finally {
      setIsZipping(false);
    }
  }, [images, isDownloading, isZipping, clearAllImages]);

  // Cancel sequential download
  const handleCancelDownload = () => {
    isCancelledRef.current = true;
    setIsDownloading(false);
    setToast({ type: 'info', message: 'Download cancelled.' });
  };

  // Download single image
  const handleDownloadSingle = (item) => {
    try {
      triggerDownload(item.file, item.name);
      setToast({ type: 'success', message: `Downloaded: ${item.name}` });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to download image.' });
    }
  };

  // Inline rename single image
  const handleInlineBaseRename = (id, newBase, ext) => {
    // Sanitize illegal filename characters
    const cleanBase = newBase.replace(/[/\\?%*:|"<>]/g, '');
    const newFullName = cleanBase ? `${cleanBase}${ext}` : `image${ext}`;
    renameImage(id, newFullName);
  };

  // Batch: Apply BDO or Sequential Renaming
  const handleApplySequence = () => {
    if (images.length === 0) return;

    if (bdoMode) {
      // Generate a fresh unique BDO name per image
      const nameMap = {};
      images.forEach((img) => {
        const { ext } = parseFilename(img.name);
        nameMap[img.id] = generateBdoName(ext);
      });
      batchRenameImages(nameMap);
      setToast({
        type: 'success',
        message: `Applied BDO naming to ${images.length} images.`
      });
    } else {
      const start = parseInt(startNum, 10) || 1;
      const pad = Math.max(1, parseInt(paddingDigits, 10) || 1);
      const nameMap = {};
      images.forEach((img, index) => {
        const { ext } = parseFilename(img.name);
        const numStr = String(start + index).padStart(pad, '0');
        const middle = baseName.trim() ? `${baseName.trim()}${separator}${numStr}` : numStr;
        const finalBase = `${seqPrefix.trim()}${middle}${seqSuffix.trim()}`;
        nameMap[img.id] = `${finalBase}${ext}`;
      });
      batchRenameImages(nameMap);
      setToast({
        type: 'success',
        message: `Applied sequential numbering to ${images.length} images.`
      });
    }
  };

  // Batch: Apply Prefix & Suffix
  const handleApplyPrefixSuffix = () => {
    if (images.length === 0) return;
    if (!customPrefix.trim() && !customSuffix.trim()) {
      setToast({ type: 'error', message: 'Please specify a prefix or suffix to apply.' });
      return;
    }

    const nameMap = {};
    images.forEach((img) => {
      const { base, ext } = parseFilename(img.name);
      nameMap[img.id] = `${customPrefix}${base}${customSuffix}${ext}`;
    });

    batchRenameImages(nameMap);
    setToast({
      type: 'success',
      message: `Applied prefix/suffix to ${images.length} images.`
    });
  };

  // Batch: Apply Find & Replace
  const handleApplyFindReplace = () => {
    if (images.length === 0) return;
    if (!findText) {
      setToast({ type: 'error', message: 'Please enter text to find.' });
      return;
    }

    let modifiedCount = 0;
    const nameMap = {};

    images.forEach((img) => {
      const { base, ext } = parseFilename(img.name);
      let newBase = base;
      if (matchCase) {
        if (newBase.includes(findText)) {
          newBase = newBase.replaceAll(findText, replaceText);
          modifiedCount++;
        }
      } else {
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (regex.test(newBase)) {
          newBase = newBase.replace(regex, replaceText);
          modifiedCount++;
        }
      }
      nameMap[img.id] = `${newBase}${ext}`;
    });

    batchRenameImages(nameMap);
    setToast({
      type: 'success',
      message: `Replaced in ${modifiedCount} image filename${modifiedCount !== 1 ? 's' : ''}.`
    });
  };

  // Batch: Apply Case / Space Transform
  const handleApplyCasing = () => {
    if (images.length === 0) return;

    const nameMap = {};
    images.forEach((img) => {
      let { base, ext } = parseFilename(img.name);

      // Casing
      if (textCase === 'lowercase') {
        base = base.toLowerCase();
        ext = ext.toLowerCase();
      } else if (textCase === 'uppercase') {
        base = base.toUpperCase();
        ext = ext.toUpperCase();
      } else if (textCase === 'titlecase') {
        base = base.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
      }

      // Space handling
      if (spaceHandling === 'underscore') {
        base = base.replace(/\s+/g, '_');
      } else if (spaceHandling === 'hyphen') {
        base = base.replace(/\s+/g, '-');
      } else if (spaceHandling === 'remove') {
        base = base.replace(/\s+/g, '');
      }

      nameMap[img.id] = `${base}${ext}`;
    });

    batchRenameImages(nameMap);
    setToast({
      type: 'success',
      message: `Applied formatting transform to ${images.length} images.`
    });
  };

  // Batch: Restore original uploaded names
  const handleRestoreOriginalNames = () => {
    resetAllNamesToOriginal();
    setToast({
      type: 'info',
      message: 'Restored all images to their original filenames.'
    });
  };

  // Sequential / BDO preview string
  const sequencePreview = useMemo(() => {
    const sampleExt = images.length > 0 ? parseFilename(images[0].name).ext || '.jpg' : '.jpg';
    if (bdoMode) {
      return `BDO-${randomDigits6()}-${randomCaps4()}${sampleExt}, BDO-${randomDigits6()}-${randomCaps4()}${sampleExt}...`;
    }
    const pad = Math.max(1, parseInt(paddingDigits, 10) || 1);
    const start = parseInt(startNum, 10) || 1;
    const num1 = String(start).padStart(pad, '0');
    const num2 = String(start + 1).padStart(pad, '0');
    const mid1 = baseName.trim() ? `${baseName.trim()}${separator}${num1}` : num1;
    const mid2 = baseName.trim() ? `${baseName.trim()}${separator}${num2}` : num2;
    return `${seqPrefix.trim()}${mid1}${seqSuffix.trim()}${sampleExt}, ${seqPrefix.trim()}${mid2}${seqSuffix.trim()}${sampleExt}...`;
  }, [bdoMode, baseName, startNum, paddingDigits, separator, seqPrefix, seqSuffix, images]);

  // Find & Replace match count
  const matchCount = useMemo(() => {
    if (!findText || images.length === 0) return 0;
    return images.filter((img) => {
      const { base } = parseFilename(img.name);
      return matchCase
        ? base.includes(findText)
        : base.toLowerCase().includes(findText.toLowerCase());
    }).length;
  }, [findText, matchCase, images]);

  // Connect Top Header Actions
  useEffect(() => {
    if (!setHeaderActions) return;

    setHeaderActions(
      <div className="header-actions-group">
        <Button
          variant="secondary"
          size="sm"
          className="header-btn-zip"
          iconLeft={<FiArchive size={13} />}
          disabled={images.length === 0 || isDownloading || isZipping}
          loading={isZipping}
          onClick={handleDownloadZip}
          title="Download all images as a single ZIP archive"
        >
          Download ZIP
        </Button>

        <Button
          variant="primary"
          size="sm"
          className="header-btn-download-all"
          iconLeft={<FiDownload size={13} />}
          disabled={images.length === 0 || isDownloading || isZipping}
          loading={isDownloading}
          onClick={handleDownloadAllDirect}
          title="Download all renamed images directly"
        >
          {isDownloading ? 'Downloading...' : `Download All (${images.length})`}
        </Button>

        <span className="header-action-divider" />

        <Button
          variant="ghost"
          size="sm"
          className="header-btn-reset"
          iconLeft={<FiRotateCcw size={13} />}
          disabled={images.length === 0}
          onClick={() => setShowClearConfirm(true)}
          title="Clear all images"
        >
          Reset
        </Button>
      </div>
    );

    return () => {
      setHeaderActions(null);
    };
  }, [
    setHeaderActions,
    images.length,
    isDownloading,
    isZipping,
    handleDownloadAllDirect,
    handleDownloadZip
  ]);

  return (
    <div className="renamer-page">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sequential Download Progress Modal */}
      <ProcessingModal
        isOpen={isDownloading}
        progress={progress}
        onCancel={handleCancelDownload}
      />

      {/* Confirmation Modal: Reset / Clear All */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Reset Workspace"
        maxWidth="400px"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearAllImages();
                setShowClearConfirm(false);
                setToast({ type: 'info', message: 'Workspace cleared.' });
              }}
            >
              Clear Workspace
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Are you sure you want to remove all {images.length} uploaded images from the workspace?
        </p>
      </Modal>

      {/* Confirmation Modal: Delete Single Item */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Remove Image"
        maxWidth="380px"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (itemToDelete) {
                  removeImage(itemToDelete.id);
                  setItemToDelete(null);
                }
              }}
            >
              Remove
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Remove <strong>{itemToDelete?.name}</strong> from the batch?
        </p>
      </Modal>

      {/* Hidden file input for adding more files */}
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.jfif,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Empty State: Upload dropzone */}
      {images.length === 0 ? (
        <div className="renamer-empty-container">
          <div className="renamer-empty-card">
            <ImageUploader
              onFilesSelected={handleFilesSelected}
              loading={isProcessingUpload}
              onLoadSample={handleLoadDemoSamples}
            />
          </div>
        </div>
      ) : (
        /* Workspace when images are loaded */
        <div className="renamer-content-container">
          {/* Top Quick Actions Bar */}
          <div className="renamer-topbar">
            <div className="renamer-topbar-left">
              <span className="renamer-badge-count">
                {images.length} {images.length === 1 ? 'Image' : 'Images'}
              </span>
              <span className="renamer-badge-size">
                Total:{' '}
                {formatBytes(
                  images.reduce((acc, img) => acc + (img.size || 0), 0)
                )}
              </span>
            </div>

            <div className="renamer-topbar-right">
              {/* Add more button */}
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<FiPlus size={14} />}
                onClick={() => addMoreInputRef.current?.click()}
                title="Add more images to this batch"
              >
                Add Images
              </Button>

              {/* View mode toggle */}
              <div className="renamer-view-toggle">
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleToggleViewMode('list')}
                  title="List view"
                >
                  <FiList size={14} />
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleToggleViewMode('grid')}
                  title="Grid view"
                >
                  <FiGrid size={14} />
                </button>
              </div>

              {/* Download ZIP button */}
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<FiArchive size={14} />}
                loading={isZipping}
                disabled={isDownloading}
                onClick={handleDownloadZip}
                title="Download all images packaged into a single ZIP file"
              >
                ZIP
              </Button>

              {/* Download All Button */}
              <Button
                variant="primary"
                size="sm"
                className="renamer-download-all-btn"
                iconLeft={<FiDownload size={14} />}
                loading={isDownloading}
                disabled={isZipping}
                onClick={handleDownloadAllDirect}
                title="Download all renamed images directly to your browser"
              >
                {isDownloading ? 'Downloading...' : `Download All (${images.length})`}
              </Button>
            </div>
          </div>

          {/* Batch Renaming Control Card */}
          <div className="renamer-tools-card">
            <div className="tools-card-header">
              <div className="tools-tabs">
                <button
                  type="button"
                  className={`tools-tab ${activeTab === 'sequence' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sequence')}
                >
                  <FiHash size={13} />
                  <span>Numbering Sequence</span>
                </button>
                <button
                  type="button"
                  className={`tools-tab ${activeTab === 'prefix-suffix' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prefix-suffix')}
                >
                  <FiPlus size={13} />
                  <span>Prefix & Suffix</span>
                </button>
                <button
                  type="button"
                  className={`tools-tab ${activeTab === 'replace' ? 'active' : ''}`}
                  onClick={() => setActiveTab('replace')}
                >
                  <FiSearch size={13} />
                  <span>Find & Replace</span>
                </button>
                <button
                  type="button"
                  className={`tools-tab ${activeTab === 'casing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('casing')}
                >
                  <FiType size={13} />
                  <span>Case & Format</span>
                </button>
              </div>

              <button
                type="button"
                className="tools-restore-btn"
                onClick={handleRestoreOriginalNames}
                title="Revert all images back to their original uploaded filenames"
              >
                <FiRefreshCw size={12} />
                <span>Revert to Original</span>
              </button>
            </div>

            <div className="tools-card-body">
              {/* Tab 1: BDO / Sequential Numbering */}
              {activeTab === 'sequence' && (
                <div className="tool-panel">

                  {/* BDO mode toggle row */}
                  <div className="bdo-mode-toggle-row">
                    <div className="bdo-mode-left">
                      <div className={`bdo-mode-badge ${bdoMode ? 'on' : 'off'}`}>
                        {bdoMode ? 'BDO' : 'SEQ'}
                      </div>
                      <div className="bdo-mode-info">
                        <span className="bdo-mode-title">
                          {bdoMode ? 'BDO Auto-Naming' : 'Sequential Numbering'}
                        </span>
                        <span className="bdo-mode-desc">
                          {bdoMode
                            ? 'Each image gets a unique BDO-{6digit}-{4CAPS} name · Auto-applied on upload'
                            : 'Images named in order: Prefix + BaseName + Number + Suffix'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`bdo-toggle-switch ${bdoMode ? 'active' : ''}`}
                      onClick={() => setBdoMode((v) => !v)}
                      title={bdoMode ? 'Switch to custom sequential numbering' : 'Switch to BDO auto-naming'}
                    >
                      <span className="bdo-toggle-thumb" />
                    </button>
                  </div>

                  {/* Manual fields — only show in sequential mode */}
                  {!bdoMode && (
                    <div className="tool-form-grid">
                      <div className="tool-field">
                        <label>Base Name</label>
                        <input
                          type="text"
                          className="tool-input"
                          placeholder="e.g. Photo or Villa"
                          value={baseName}
                          onChange={(e) => setBaseName(e.target.value)}
                        />
                      </div>

                      <div className="tool-field">
                        <label>Start From</label>
                        <input
                          type="number"
                          min="0"
                          className="tool-input"
                          value={startNum}
                          onChange={(e) => setStartNum(e.target.value)}
                        />
                      </div>

                      <div className="tool-field">
                        <label>Padding Digits</label>
                        <select
                          className="tool-select"
                          value={paddingDigits}
                          onChange={(e) => setPaddingDigits(Number(e.target.value))}
                        >
                          <option value="1">1 (1, 2, 3)</option>
                          <option value="2">2 (01, 02, 03)</option>
                          <option value="3">3 (001, 002, 003)</option>
                          <option value="4">4 (0001, 0002)</option>
                        </select>
                      </div>

                      <div className="tool-field">
                        <label>Separator</label>
                        <select
                          className="tool-select"
                          value={separator}
                          onChange={(e) => setSeparator(e.target.value)}
                        >
                          <option value="_">Underscore ( _ )</option>
                          <option value="-">Hyphen ( - )</option>
                          <option value=" ">Space ( )</option>
                          <option value="">None</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="tool-bottom-row">
                    <div className="tool-preview-pill">
                      <span className="preview-label">Pattern Preview:</span>
                      <span className="preview-val">{sequencePreview}</span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplySequence}
                      iconLeft={<FiCheck size={13} />}
                    >
                      {bdoMode ? 'Regenerate BDO Names' : 'Apply Numbering to All'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Prefix & Suffix */}
              {activeTab === 'prefix-suffix' && (
                <div className="tool-panel">
                  <div className="tool-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="tool-field">
                      <label>Add Prefix</label>
                      <input
                        type="text"
                        className="tool-input"
                        placeholder="e.g. New_ or Draft_"
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                      />
                    </div>

                    <div className="tool-field">
                      <label>Add Suffix</label>
                      <input
                        type="text"
                        className="tool-input"
                        placeholder="e.g. _v1 or _HD"
                        value={customSuffix}
                        onChange={(e) => setCustomSuffix(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="tool-bottom-row">
                    <div className="tool-preview-pill">
                      <span className="preview-label">Result:</span>
                      <span className="preview-val">
                        {customPrefix || ''}filename{customSuffix || ''}.jpg
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyPrefixSuffix}
                      iconLeft={<FiCheck size={13} />}
                    >
                      Apply to All
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 3: Find & Replace */}
              {activeTab === 'replace' && (
                <div className="tool-panel">
                  <div className="tool-form-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr auto' }}>
                    <div className="tool-field">
                      <label>Find Text</label>
                      <input
                        type="text"
                        className="tool-input"
                        placeholder="Text to replace..."
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                      />
                    </div>

                    <div className="tool-field">
                      <label>Replace With</label>
                      <input
                        type="text"
                        className="tool-input"
                        placeholder="Replacement text (leave empty to remove)"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                      />
                    </div>

                    <div className="tool-field" style={{ justifyContent: 'flex-end' }}>
                      <label className="tool-checkbox-label">
                        <input
                          type="checkbox"
                          checked={matchCase}
                          onChange={(e) => setMatchCase(e.target.checked)}
                        />
                        <span>Match Case</span>
                      </label>
                    </div>
                  </div>

                  <div className="tool-bottom-row">
                    <div className="tool-preview-pill">
                      <span className="preview-label">Matched:</span>
                      <span className="preview-val">
                        {findText ? `${matchCount} image${matchCount !== 1 ? 's' : ''}` : 'Enter text to find'}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyFindReplace}
                      disabled={!findText || matchCount === 0}
                      iconLeft={<FiCheck size={13} />}
                    >
                      Replace in All
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 4: Case & Format */}
              {activeTab === 'casing' && (
                <div className="tool-panel">
                  <div className="tool-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="tool-field">
                      <label>Letter Casing</label>
                      <select
                        className="tool-select"
                        value={textCase}
                        onChange={(e) => setTextCase(e.target.value)}
                      >
                        <option value="lowercase">lowercase (photo_01.jpg)</option>
                        <option value="uppercase">UPPERCASE (PHOTO_01.JPG)</option>
                        <option value="titlecase">Title Case (Photo_01.jpg)</option>
                      </select>
                    </div>

                    <div className="tool-field">
                      <label>Spaces Handling</label>
                      <select
                        className="tool-select"
                        value={spaceHandling}
                        onChange={(e) => setSpaceHandling(e.target.value)}
                      >
                        <option value="underscore">Replace spaces with underscores (_)</option>
                        <option value="hyphen">Replace spaces with hyphens (-)</option>
                        <option value="remove">Remove all spaces</option>
                        <option value="none">Keep spaces unchanged</option>
                      </select>
                    </div>
                  </div>

                  <div className="tool-bottom-row">
                    <div className="tool-preview-pill">
                      <span className="preview-label">Preset:</span>
                      <span className="preview-val">
                        Standardizes file naming across all systems
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyCasing}
                      iconLeft={<FiCheck size={13} />}
                    >
                      Apply Format
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image List / Grid View */}
          <div className="renamer-items-section">
            {viewMode === 'list' ? (
              /* Table / List View */
              <div className="renamer-list-container">
                <div className="renamer-list-header">
                  <span className="col-thumb">Preview</span>
                  <span className="col-name">Image Name (Editable)</span>
                  <span className="col-orig">Original Filename</span>
                  <span className="col-meta">Dimensions & Size</span>
                  <span className="col-actions">Actions</span>
                </div>

                <div className="renamer-list-rows">
                  {images.map((item, index) => {
                    const { base, ext } = parseFilename(item.name);
                    return (
                      <div key={item.id} className="renamer-list-row">
                        {/* Thumbnail */}
                        <div className="col-thumb">
                          <div className="thumb-box">
                            <img src={item.previewUrl} alt={item.name} />
                            <span className="thumb-index">{index + 1}</span>
                          </div>
                        </div>

                        {/* Editable Name */}
                        <div className="col-name">
                          <div className="name-input-group">
                            <input
                              type="text"
                              className="name-input"
                              value={base}
                              onChange={(e) => handleInlineBaseRename(item.id, e.target.value, ext)}
                              placeholder="Filename..."
                              title="Edit image filename"
                            />
                            <span className="ext-badge">{ext}</span>
                          </div>
                        </div>

                        {/* Original Name */}
                        <div className="col-orig">
                          <span className="orig-name-text" title={item.originalName || item.name}>
                            {item.originalName || item.name}
                          </span>
                        </div>

                        {/* Dimensions & Size */}
                        <div className="col-meta">
                          <span className="meta-dims">
                            {item.width && item.height ? `${item.width}×${item.height}` : '—'}
                          </span>
                          <span className="meta-size">{formatBytes(item.size)}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="col-actions">
                          <IconButton
                            icon={<FiDownload size={14} />}
                            size="sm"
                            className="item-action-btn download"
                            onClick={() => handleDownloadSingle(item)}
                            title={`Download ${item.name}`}
                            aria-label={`Download ${item.name}`}
                          />
                          <IconButton
                            icon={<FiTrash2 size={14} />}
                            size="sm"
                            className="item-action-btn delete"
                            onClick={() => setItemToDelete(item)}
                            title="Remove from batch"
                            aria-label="Remove image"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="renamer-grid-container">
                {images.map((item, index) => {
                  const { base, ext } = parseFilename(item.name);
                  return (
                    <div key={item.id} className="renamer-grid-card">
                      <div className="grid-card-thumb-wrap">
                        <img src={item.previewUrl} alt={item.name} className="grid-card-img" />
                        <span className="grid-card-badge-index">#{index + 1}</span>
                        <div className="grid-card-overlay-actions">
                          <IconButton
                            icon={<FiDownload size={14} />}
                            size="sm"
                            className="grid-overlay-btn"
                            onClick={() => handleDownloadSingle(item)}
                            title={`Download ${item.name}`}
                          />
                          <IconButton
                            icon={<FiTrash2 size={14} />}
                            size="sm"
                            className="grid-overlay-btn delete"
                            onClick={() => setItemToDelete(item)}
                            title="Remove"
                          />
                        </div>
                      </div>

                      <div className="grid-card-body">
                        <div className="name-input-group">
                          <input
                            type="text"
                            className="name-input"
                            value={base}
                            onChange={(e) => handleInlineBaseRename(item.id, e.target.value, ext)}
                            placeholder="Filename..."
                            title="Edit image filename"
                          />
                          <span className="ext-badge">{ext}</span>
                        </div>

                        <div className="grid-card-footer-meta">
                          <span className="grid-orig-name" title={item.originalName || item.name}>
                            Orig: {item.originalName || item.name}
                          </span>
                          <span className="grid-size-text">
                            {formatBytes(item.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Bottom Bar for instant access to Download All */}
          <div className="renamer-bottom-bar">
            <div className="bottom-bar-left">
              <span className="bottom-bar-text">
                {images.length} {images.length === 1 ? 'file' : 'files'} ready to download
              </span>
            </div>

            <div className="bottom-bar-right">
              <Button
                variant="secondary"
                size="md"
                iconLeft={<FiArchive size={15} />}
                loading={isZipping}
                disabled={isDownloading}
                onClick={handleDownloadZip}
              >
                Download as ZIP
              </Button>

              <Button
                variant="primary"
                size="md"
                iconLeft={<FiDownload size={15} />}
                loading={isDownloading}
                disabled={isZipping}
                onClick={handleDownloadAllDirect}
                className="bottom-download-btn"
              >
                {isDownloading ? 'Downloading...' : `Download All (${images.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageRenamer;
