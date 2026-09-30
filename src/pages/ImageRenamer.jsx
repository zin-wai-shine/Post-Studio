import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useImageFiles } from '../hooks/useImageFiles';
import { useSourceFolder } from '../hooks/useSourceFolder';
import { ImageUploader } from '../components/watermark/ImageUploader';
import { ProcessingModal } from '../components/watermark/ProcessingModal';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { IconButton } from '../components/common/IconButton';
import { Toast } from '../components/common/Toast';
import { SourcePathControls } from '../components/common/SourcePathControls';
import { triggerDownload } from '../utils/downloadUtils';
import { parseFilename, formatBytes, getProcessedImageBlob } from '../utils/imageUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FiDownload,
  FiArchive,
  FiRotateCcw,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSearch,
  FiHash,
  FiType,
  FiChevronDown,
  FiSliders,
  FiCheckCircle
} from 'react-icons/fi';
import './ImageRenamer.css';

// ─── BDO Naming Helpers ───────────────────────────────────────────────────────

function randomDigits6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function randomCaps4() {
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  }
  return result;
}

function generateBdoName(ext) {
  const cleanExt = ext && ext.startsWith('.') ? ext : `.${ext || 'jpg'}`;
  return `BDO-${randomDigits6()}-${randomCaps4()}${cleanExt}`;
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
    isProcessingUpload,
    uploadStatus
  } = useImageFiles();

  // Source folder: auto-delete originals after rename & download
  const sourceFolder = useSourceFolder();

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

  // Collapsible rename rules panel (closed by default for a clean, distraction-free view)
  const [showTools, setShowTools] = useState(false);

  // Batch rename tool tab: 'bdo' | 'sequence' | 'prefix-suffix' | 'replace' | 'casing'
  const [activeTab, setActiveTab] = useState('bdo');

  // Sequence state
  const [baseName, setBaseName] = useState('');
  const [startNum, setStartNum] = useState(1);
  const [paddingDigits, setPaddingDigits] = useState(4);
  const [separator, setSeparator] = useState('_');
  const [seqPrefix, setSeqPrefix] = useState('');
  const [seqSuffix, setSeqSuffix] = useState('');

  // BDO mode: auto-generate a unique random name per image
  const [bdoMode, setBdoMode] = useState(true);

  // Track image count to auto-apply BDO naming on newly added images
  const prevImageCountRef = useRef(0);

  // Prefix & Suffix state
  const [customPrefix, setCustomPrefix] = useState('');
  const [customSuffix, setCustomSuffix] = useState('');

  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [includeExt, setIncludeExt] = useState(false);

  // Text Casing & formatting state
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

  // Auto-apply BDO naming when images are added
  useEffect(() => {
    if (images.length > prevImageCountRef.current && bdoMode) {
      const nameMap = {};
      images.forEach((img) => {
        const { ext } = parseFilename(img.name);
        nameMap[img.id] = generateBdoName(ext);
      });
      batchRenameImages(nameMap);
    }
    prevImageCountRef.current = images.length;
  }, [images.length, bdoMode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Direct Sequential Download All with genuine format conversion
  const handleDownloadAllDirect = useCallback(async () => {
    if (images.length === 0 || isDownloading || isZipping) return;

    setIsDownloading(true);
    isCancelledRef.current = false;
    const total = images.length;
    setProgress({ current: 0, total, percentage: 0, currentFilename: 'Preparing download...' });

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
          currentFilename: `Processing & Converting: ${filename}`
        });

        // Convert file data to real target format (PNG, JPG, WEBP, or original HEIC)
        const processedBlob = await getProcessedImageBlob(item, filename);

        // Trigger direct browser download
        triggerDownload(processedBlob, filename);

        // Stagger browser downloads to prevent throttling
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setToast({
        type: 'success',
        message: `Processed and downloaded all ${total} images! Workspace cleared.`
      });
      // Auto-delete originals from source folder
      const originals = images.map((img) => img.originalName || img.name);
      const deleteResult = await sourceFolder.deleteFiles(originals);
      if (deleteResult.deleted && deleteResult.deleted.length > 0) {
        setToast({
          type: 'success',
          message: `Downloaded all ${total} images! ${deleteResult.deleted.length} original(s) deleted from "${deleteResult.folderPath || sourceFolder.folderPath}". Workspace cleared.`
        });
      }
      clearAllImages();
    } catch (err) {
      if (!isCancelledRef.current) {
        setToast({ type: 'error', message: err.message || 'Failed to download images.' });
      }
    } finally {
      setIsDownloading(false);
    }
  }, [images, isDownloading, isZipping, clearAllImages, sourceFolder]);

  // ZIP Archive Download All with genuine format conversion
  const handleDownloadZip = useCallback(async () => {
    if (images.length === 0 || isDownloading || isZipping) return;

    setIsZipping(true);
    isCancelledRef.current = false;
    const total = images.length;
    setProgress({ current: 0, total, percentage: 0, currentFilename: 'Converting files for ZIP...' });

    try {
      const zip = new JSZip();

      for (let i = 0; i < total; i++) {
        if (isCancelledRef.current) {
          throw new Error('Export cancelled by user.');
        }

        const img = images[i];
        setProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 85),
          currentFilename: `Converting & Archiving: ${img.name}`
        });

        // Convert to genuine target format Blob
        const processedBlob = await getProcessedImageBlob(img, img.name);
        zip.file(img.name, processedBlob);
      }

      setProgress({
        current: total,
        total,
        percentage: 95,
        currentFilename: 'Generating ZIP package...'
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `renamed-images-${Date.now().toString(36)}.zip`);

      setToast({
        type: 'success',
        message: `Exported ${images.length} images to ZIP! Workspace cleared.`
      });
      clearAllImages();
    } catch (err) {
      if (!isCancelledRef.current) {
        console.error('Failed to generate ZIP:', err);
        setToast({ type: 'error', message: err.message || 'Failed to generate ZIP archive.' });
      }
    } finally {
      setIsZipping(false);
    }
  }, [images, isDownloading, isZipping, clearAllImages]);

  const handleCancelDownload = () => {
    isCancelledRef.current = true;
    setIsDownloading(false);
    setIsZipping(false);
    setToast({ type: 'info', message: 'Download / Export cancelled.' });
  };

  // Download single image with format processing
  const handleDownloadSingle = async (item) => {
    try {
      setToast({ type: 'info', message: `Processing ${item.name}...` });
      const processedBlob = await getProcessedImageBlob(item, item.name);
      triggerDownload(processedBlob, item.name);
      const { ext } = parseFilename(item.name);
      setToast({
        type: 'success',
        message: `Downloaded: ${item.name}${ext ? ` (${ext.toUpperCase()} converted)` : ''}`
      });
    } catch (err) {
      console.error('Failed to download single image:', err);
      setToast({ type: 'error', message: `Download failed: ${err.message}` });
    }
  };

  // Inline rename single image base
  const handleInlineBaseRename = (id, newBase, currentExt) => {
    const cleanBase = newBase.replace(/[/\\?%*:|"<>]/g, '');
    const parsed = parseFilename(cleanBase);
    const knownExts = ['.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif'];
    let finalBase = cleanBase;
    let finalExt = currentExt;

    if (parsed.ext && knownExts.includes(parsed.ext.toLowerCase())) {
      finalBase = parsed.base;
      finalExt = parsed.ext.toLowerCase();
    }

    const newFullName = finalBase ? `${finalBase}${finalExt}` : `image${finalExt}`;
    renameImage(id, newFullName);
  };

  // Inline change single image extension
  const handleInlineExtChange = (id, currentBase, newExt) => {
    const cleanBase = (currentBase || 'image').replace(/[/\\?%*:|"<>]/g, '');
    const targetExt = newExt.toLowerCase();
    renameImage(id, `${cleanBase}${targetExt}`);
  };

  // Batch: Change all file extensions with 1 click
  const handleBatchChangeExtension = (newExt) => {
    if (images.length === 0) return;
    const cleanExt = newExt.toLowerCase().startsWith('.') ? newExt.toLowerCase() : `.${newExt.toLowerCase()}`;
    const nameMap = {};
    images.forEach((img) => {
      const { base } = parseFilename(img.name);
      nameMap[img.id] = `${base}${cleanExt}`;
    });
    batchRenameImages(nameMap);
    setToast({
      type: 'success',
      message: `All images set to ${cleanExt.toUpperCase()} (will convert on download).`
    });
  };

  // Batch: Revert all extensions back to original uploaded format
  const handleRevertExtensionsToOriginal = () => {
    if (images.length === 0) return;
    const nameMap = {};
    images.forEach((img) => {
      const { base } = parseFilename(img.name);
      const origExt = parseFilename(img.originalName || img.file?.name || '').ext || '.jpg';
      nameMap[img.id] = `${base}${origExt}`;
    });
    batchRenameImages(nameMap);
    setToast({
      type: 'info',
      message: 'Reverted all extensions to original uploaded format.'
    });
  };

  // Batch: Revert all filenames back to original uploaded names
  const handleRestoreOriginalNames = () => {
    if (images.length === 0) return;
    const nameMap = {};
    images.forEach((img) => {
      nameMap[img.id] = img.originalName || img.file?.name || img.name;
    });
    batchRenameImages(nameMap);
    setBdoMode(false);
    setToast({
      type: 'info',
      message: 'Reverted all filenames back to original uploaded names.'
    });
  };

  // Regenerate BDO names for all images
  const handleRegenerateBDO = () => {
    if (images.length === 0) return;
    setBdoMode(true);
    const nameMap = {};
    images.forEach((img) => {
      const { ext } = parseFilename(img.name);
      nameMap[img.id] = generateBdoName(ext);
    });
    batchRenameImages(nameMap);
    setToast({
      type: 'success',
      message: `Generated fresh BDO names for ${images.length} images.`
    });
  };

  // Batch: Apply Sequential Numbering
  const handleApplySequence = () => {
    if (images.length === 0) return;
    setBdoMode(false);
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
      if (includeExt) {
        let fullName = img.name;
        if (matchCase) {
          if (fullName.includes(findText)) {
            fullName = fullName.replaceAll(findText, replaceText);
            modifiedCount++;
          }
        } else {
          const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          if (regex.test(fullName)) {
            fullName = fullName.replace(regex, replaceText);
            modifiedCount++;
          }
        }
        nameMap[img.id] = fullName;
      } else {
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
      }
    });

    batchRenameImages(nameMap);
    setToast({
      type: 'success',
      message: `Replaced in ${modifiedCount} image filename${modifiedCount !== 1 ? 's' : ''}.`
    });
  };

  // Batch: Apply Case & Space Transform
  const handleApplyCasing = () => {
    if (images.length === 0) return;

    const nameMap = {};
    images.forEach((img) => {
      let { base, ext } = parseFilename(img.name);

      if (textCase === 'lowercase') {
        base = base.toLowerCase();
        ext = ext.toLowerCase();
      } else if (textCase === 'uppercase') {
        base = base.toUpperCase();
        ext = ext.toUpperCase();
      } else if (textCase === 'titlecase') {
        base = base.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
      }

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

  // Check overall extension status across all items
  const allArePng = images.length > 0 && images.every((img) => parseFilename(img.name).ext.toLowerCase() === '.png');
  const allAreJpg = images.length > 0 && images.every((img) => {
    const ext = parseFilename(img.name).ext.toLowerCase();
    return ext === '.jpg' || ext === '.jpeg';
  });
  const allAreWebp = images.length > 0 && images.every((img) => parseFilename(img.name).ext.toLowerCase() === '.webp');

  const isExtConverted = (currentExt, originalExt) => {
    if (!currentExt || !originalExt) return false;
    return currentExt.toLowerCase() !== originalExt.toLowerCase();
  };

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
          title="Download all images as a ZIP archive"
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

      {/* Sequential & ZIP Download Progress Modal */}
      <ProcessingModal
        isOpen={isDownloading || isZipping}
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

          {/* Clean, Unified Control Bar */}
          <div className="renamer-unified-bar">
            {/* Left: Summary & Format Pills */}
            <div className="unified-bar-left">
              <div className="unified-stats">
                <span className="stats-count">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
                <span className="stats-dot">·</span>
                <span className="stats-size">
                  {formatBytes(images.reduce((acc, img) => acc + (img.size || 0), 0))}
                </span>
                {uploadStatus && (
                  <span className="unified-upload-status">{uploadStatus}</span>
                )}
              </div>

              <div className="unified-divider" />

              {/* Instant 1-Click Format Converter Segment */}
              <div className="unified-format-group" title="Convert all file formats on download">
                <span className="unified-format-label">Format:</span>
                <div className="unified-format-pills">
                  <button
                    type="button"
                    className={`format-pill ${allArePng ? 'active' : ''}`}
                    onClick={() => handleBatchChangeExtension('.png')}
                    title="Change all to .png"
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    className={`format-pill ${allAreJpg ? 'active' : ''}`}
                    onClick={() => handleBatchChangeExtension('.jpg')}
                    title="Change all to .jpg"
                  >
                    JPG
                  </button>
                  <button
                    type="button"
                    className={`format-pill ${allAreWebp ? 'active' : ''}`}
                    onClick={() => handleBatchChangeExtension('.webp')}
                    title="Change all to .webp"
                  >
                    WEBP
                  </button>
                  <button
                    type="button"
                    className={`format-pill revert ${!allArePng && !allAreJpg && !allAreWebp ? 'active' : ''}`}
                    onClick={handleRevertExtensionsToOriginal}
                    title="Keep original uploaded extensions"
                  >
                    Original
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Tools & Actions */}
            <div className="unified-bar-right">
              {/* BDO Quick Status indicator */}
              <button
                type="button"
                className={`bdo-status-pill ${bdoMode ? 'on' : 'off'}`}
                onClick={handleRegenerateBDO}
                title="BDO Auto-naming active · Click to regenerate new BDO names"
              >
                <span className="bdo-dot" />
                <span>BDO Auto</span>
              </button>

              {/* Toggle Advanced Rename Rules */}
              <button
                type="button"
                className={`rename-rules-toggle ${showTools ? 'active' : ''}`}
                onClick={() => setShowTools((v) => !v)}
                title="Open naming patterns, sequential numbering, prefix/suffix, find & replace"
              >
                <FiSliders size={13} />
                <span>Rename Rules</span>
                <FiChevronDown size={12} className={`chevron-arrow ${showTools ? 'open' : ''}`} />
              </button>

              <div className="unified-divider" />

              {/* View Toggle */}
              <div className="renamer-view-toggle">
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleToggleViewMode('list')}
                  title="List view"
                >
                  <FiList size={13} />
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleToggleViewMode('grid')}
                  title="Grid view"
                >
                  <FiGrid size={13} />
                </button>
              </div>

              {/* Add Images */}
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<FiPlus size={13} />}
                onClick={() => addMoreInputRef.current?.click()}
              >
                Add
              </Button>

              {/* Download ZIP */}
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<FiArchive size={13} />}
                loading={isZipping}
                disabled={isDownloading}
                onClick={handleDownloadZip}
              >
                ZIP
              </Button>

              {/* Download All */}
              <Button
                variant="primary"
                size="sm"
                className="unified-download-btn"
                iconLeft={<FiDownload size={13} />}
                loading={isDownloading}
                disabled={isZipping}
                onClick={handleDownloadAllDirect}
              >
                {isDownloading ? 'Downloading...' : `Download All (${images.length})`}
              </Button>
            </div>
          </div>

          {/* Clean, Collapsible Rename Rules Panel */}
          {showTools && (
            <div className="renamer-compact-rules-card">
              <div className="rules-tabs-bar">
                <div className="rules-tabs">
                  <button
                    type="button"
                    className={`rules-tab ${activeTab === 'bdo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bdo')}
                  >
                    <span>⚡ BDO Auto</span>
                  </button>
                  <button
                    type="button"
                    className={`rules-tab ${activeTab === 'sequence' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sequence')}
                  >
                    <FiHash size={12} />
                    <span>Numbering</span>
                  </button>
                  <button
                    type="button"
                    className={`rules-tab ${activeTab === 'prefix-suffix' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prefix-suffix')}
                  >
                    <FiPlus size={12} />
                    <span>Prefix / Suffix</span>
                  </button>
                  <button
                    type="button"
                    className={`rules-tab ${activeTab === 'replace' ? 'active' : ''}`}
                    onClick={() => setActiveTab('replace')}
                  >
                    <FiSearch size={12} />
                    <span>Find & Replace</span>
                  </button>
                  <button
                    type="button"
                    className={`rules-tab ${activeTab === 'casing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('casing')}
                  >
                    <FiType size={12} />
                    <span>Case & Space</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="rules-revert-btn"
                  onClick={handleRestoreOriginalNames}
                  title="Revert to original uploaded filenames"
                >
                  <FiRefreshCw size={11} />
                  <span>Revert to Original</span>
                </button>
              </div>

              <div className="rules-content-body">
                {/* Tab 1: BDO Auto-Naming */}
                {activeTab === 'bdo' && (
                  <div className="rules-inline-row">
                    <span className="rules-hint-text">
                      Random unique code: <strong>BDO-{'{6 digits}'}-{'{4 CAPS}'}</strong>
                    </span>
                    <div className="rules-actions-right">
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<FiCheck size={13} />}
                        onClick={handleRegenerateBDO}
                      >
                        Regenerate BDO Names
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Sequential Numbering */}
                {activeTab === 'sequence' && (
                  <div className="rules-form-row">
                    <div className="rules-input-item">
                      <label>Base Name</label>
                      <input
                        type="text"
                        className="rules-input"
                        placeholder="Photo"
                        value={baseName}
                        onChange={(e) => setBaseName(e.target.value)}
                      />
                    </div>
                    <div className="rules-input-item" style={{ maxWidth: '100px' }}>
                      <label>Start From</label>
                      <input
                        type="number"
                        min="0"
                        className="rules-input"
                        value={startNum}
                        onChange={(e) => setStartNum(e.target.value)}
                      />
                    </div>
                    <div className="rules-input-item" style={{ maxWidth: '110px' }}>
                      <label>Padding</label>
                      <select
                        className="rules-select"
                        value={paddingDigits}
                        onChange={(e) => setPaddingDigits(Number(e.target.value))}
                      >
                        <option value="1">1 (1, 2)</option>
                        <option value="2">2 (01, 02)</option>
                        <option value="3">3 (001)</option>
                        <option value="4">4 (0001)</option>
                        <option value="6">6 (000001)</option>
                      </select>
                    </div>
                    <div className="rules-input-item" style={{ maxWidth: '110px' }}>
                      <label>Separator</label>
                      <select
                        className="rules-select"
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value)}
                      >
                        <option value="_">Underscore (_)</option>
                        <option value="-">Hyphen (-)</option>
                        <option value=" ">Space ( )</option>
                        <option value="">None</option>
                      </select>
                    </div>
                    <div className="rules-actions-right">
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<FiCheck size={13} />}
                        onClick={handleApplySequence}
                      >
                        Apply Sequence
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 3: Prefix & Suffix */}
                {activeTab === 'prefix-suffix' && (
                  <div className="rules-form-row">
                    <div className="rules-input-item">
                      <label>Prefix</label>
                      <input
                        type="text"
                        className="rules-input"
                        placeholder="e.g. Villa_"
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                      />
                    </div>
                    <div className="rules-input-item">
                      <label>Suffix</label>
                      <input
                        type="text"
                        className="rules-input"
                        placeholder="e.g. _HD"
                        value={customSuffix}
                        onChange={(e) => setCustomSuffix(e.target.value)}
                      />
                    </div>
                    <div className="rules-actions-right">
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<FiCheck size={13} />}
                        onClick={handleApplyPrefixSuffix}
                      >
                        Apply to All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 4: Find & Replace */}
                {activeTab === 'replace' && (
                  <div className="rules-form-row">
                    <div className="rules-input-item">
                      <label>Find Text</label>
                      <input
                        type="text"
                        className="rules-input"
                        placeholder="Text to find..."
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                      />
                    </div>
                    <div className="rules-input-item">
                      <label>Replace With</label>
                      <input
                        type="text"
                        className="rules-input"
                        placeholder="Replacement text..."
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                      />
                    </div>
                    <label className="rules-check-label">
                      <input
                        type="checkbox"
                        checked={matchCase}
                        onChange={(e) => setMatchCase(e.target.checked)}
                      />
                      <span>Match Case</span>
                    </label>
                    <label className="rules-check-label">
                      <input
                        type="checkbox"
                        checked={includeExt}
                        onChange={(e) => setIncludeExt(e.target.checked)}
                      />
                      <span>In Extension</span>
                    </label>
                    <div className="rules-actions-right">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!findText}
                        iconLeft={<FiCheck size={13} />}
                        onClick={handleApplyFindReplace}
                      >
                        Replace All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 5: Case & Space */}
                {activeTab === 'casing' && (
                  <div className="rules-form-row">
                    <div className="rules-input-item">
                      <label>Letter Casing</label>
                      <select
                        className="rules-select"
                        value={textCase}
                        onChange={(e) => setTextCase(e.target.value)}
                      >
                        <option value="lowercase">lowercase (photo_01)</option>
                        <option value="uppercase">UPPERCASE (PHOTO_01)</option>
                        <option value="titlecase">Title Case (Photo_01)</option>
                      </select>
                    </div>
                    <div className="rules-input-item">
                      <label>Spaces</label>
                      <select
                        className="rules-select"
                        value={spaceHandling}
                        onChange={(e) => setSpaceHandling(e.target.value)}
                      >
                        <option value="underscore">Replace spaces with _</option>
                        <option value="hyphen">Replace spaces with -</option>
                        <option value="remove">Remove all spaces</option>
                        <option value="none">Keep spaces</option>
                      </select>
                    </div>
                    <div className="rules-actions-right">
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<FiCheck size={13} />}
                        onClick={handleApplyCasing}
                      >
                        Apply Format
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clean, Focused Image Table / Grid */}
          <div className="renamer-items-section">
            {viewMode === 'list' ? (
              /* Table View */
              <div className="renamer-list-container">
                <div className="renamer-list-header">
                  <span className="col-thumb">Preview</span>
                  <span className="col-name">Image Name & Format</span>
                  <span className="col-orig">Original Filename</span>
                  <span className="col-meta">Dimensions & Size</span>
                  <span className="col-actions">Actions</span>
                </div>

                <div className="renamer-list-rows">
                  {images.map((item, index) => {
                    const { base, ext } = parseFilename(item.name);
                    const converted = isExtConverted(ext, item.originalExt);

                    return (
                      <div key={item.id} className="renamer-list-row">
                        {/* Thumbnail */}
                        <div className="col-thumb">
                          <div className="thumb-box">
                            <img src={item.previewUrl} alt={item.name} />
                            <span className="thumb-index">{index + 1}</span>
                          </div>
                        </div>

                        {/* Editable Name & Extension */}
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
                            <div
                              className={`ext-selector-wrap ${converted ? 'converted' : ''}`}
                              title={converted ? `Format changed to ${ext.toUpperCase()}` : 'Change format / extension'}
                            >
                              <select
                                className="ext-selector-select"
                                value={ext.toLowerCase()}
                                onChange={(e) => handleInlineExtChange(item.id, base, e.target.value)}
                              >
                                <option value=".png">.PNG</option>
                                <option value=".jpg">.JPG</option>
                                <option value=".jpeg">.JPEG</option>
                                <option value=".webp">.WEBP</option>
                                {item.originalExt && !['.png', '.jpg', '.jpeg', '.webp'].includes(item.originalExt.toLowerCase()) && (
                                  <option value={item.originalExt.toLowerCase()}>{item.originalExt.toUpperCase()}</option>
                                )}
                              </select>
                              <FiChevronDown className="ext-selector-arrow" />
                            </div>
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
                          />
                          <IconButton
                            icon={<FiTrash2 size={14} />}
                            size="sm"
                            className="item-action-btn delete"
                            onClick={() => setItemToDelete(item)}
                            title="Remove"
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
                  const converted = isExtConverted(ext, item.originalExt);

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
                          />
                          <div className={`ext-selector-wrap ${converted ? 'converted' : ''}`}>
                            <select
                              className="ext-selector-select"
                              value={ext.toLowerCase()}
                              onChange={(e) => handleInlineExtChange(item.id, base, e.target.value)}
                            >
                              <option value=".png">.PNG</option>
                              <option value=".jpg">.JPG</option>
                              <option value=".jpeg">.JPEG</option>
                              <option value=".webp">.WEBP</option>
                              {item.originalExt && !['.png', '.jpg', '.jpeg', '.webp'].includes(item.originalExt.toLowerCase()) && (
                                <option value={item.originalExt.toLowerCase()}>{item.originalExt.toUpperCase()}</option>
                              )}
                            </select>
                            <FiChevronDown className="ext-selector-arrow" />
                          </div>
                        </div>

                        <div className="grid-card-footer-meta">
                          <span className="grid-orig-name" title={item.originalName || item.name}>
                            {item.originalName || item.name}
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

          {/* Compact Source Folder Drawer */}
          <div className="renamer-source-path-wrap">
            <SourcePathControls
              folderPath={sourceFolder.folderPath}
              onSetFolderPath={sourceFolder.setFolderPath}
              isEnabled={sourceFolder.isEnabled}
              onToggleEnabled={sourceFolder.setIsEnabled}
              isConnected={sourceFolder.isConnected}
              isChecking={sourceFolder.isChecking}
              lastCheckError={sourceFolder.lastCheckError}
              systemInfo={sourceFolder.systemInfo}
              onVerifyPath={sourceFolder.verifyPath}
              compact={true}
            />
          </div>

          {/* Sticky Bottom Bar */}
          <div className="renamer-bottom-bar">
            <div className="bottom-bar-left">
              <span className="bottom-bar-text">
                {images.length} {images.length === 1 ? 'file' : 'files'} ready to download
                {allArePng ? ' (converting to .PNG)' : allAreJpg ? ' (converting to .JPG)' : allAreWebp ? ' (converting to .WEBP)' : ''}
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
