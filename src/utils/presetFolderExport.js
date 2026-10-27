import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { renderWatermarkedImage } from './canvasUtils';
import { triggerDownload } from './downloadUtils';
import { generatePresetFilename, resolvePresetExtension } from './presetUtils';

/**
 * Sanitizes folder names for filesystems (removes illegal characters)
 * @param {string} name 
 * @returns {string}
 */
export function sanitizeFolderName(name) {
  if (!name || typeof name !== 'string') return 'Preset-Export';
  const cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Preset-Export';
}

/**
 * Converts a Blob to a Base64 data URL string
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Resolves the base API URL for the local Vite dev server
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }
  return 'http://localhost:5173';
}

/**
 * Checks if the local filesystem API is reachable
 * @returns {Promise<string|null>} Base URL if reachable, else null
 */
export async function checkLocalApiReachable() {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${baseUrl}/api/system-info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return baseUrl;
      }
    }
  } catch (err) {
    // API not reachable
  }
  return null;
}

/**
 * Renders a single image using preset configuration with fallback
 */
async function renderPresetBlob({ item, preset, effectiveWatermark }) {
  const ext = resolvePresetExtension(item.name, preset.exportSettings);
  const filename = generatePresetFilename(preset.prefix || 'BOL', ext);

  let blob;
  try {
    blob = await renderWatermarkedImage({
      sourceImage: item.file || item.previewUrl,
      watermarkImage: effectiveWatermark,
      settings: preset.settings,
      cropSettings: preset.cropSettings,
      exportOptions: preset.exportSettings
    });
  } catch (renderErr) {
    console.warn(`Render with watermark failed for ${filename}, attempting fallback:`, renderErr);
    blob = await renderWatermarkedImage({
      sourceImage: item.file || item.previewUrl,
      watermarkImage: null,
      settings: { ...preset.settings, type: 'text' },
      cropSettings: preset.cropSettings,
      exportOptions: preset.exportSettings
    });
  }

  return { blob, filename };
}

/**
 * 1. DIRECT TO DOWNLOADS FOLDER:
 * Downloads all images directly to browser Downloads folder without subfolders
 */
export async function exportDirectlyToDownloads({
  images,
  presets,
  resolveWatermarkForPreset,
  onProgress,
  isCancelledRef
}) {
  if (!images?.length || !presets?.length) throw new Error('No images or presets selected.');

  const totalOps = images.length * presets.length;

  for (let pIdx = 0; pIdx < presets.length; pIdx++) {
    if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
    const preset = presets[pIdx];
    const watermarkSource = resolveWatermarkForPreset ? resolveWatermarkForPreset(preset) : null;
    const effectiveWatermark = watermarkSource || preset.watermarkPreviewUrl || preset.watermarkDataUrl || null;

    for (let i = 0; i < images.length; i++) {
      if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
      const item = images[i];
      const currentOp = pIdx * images.length + i + 1;

      const { blob, filename } = await renderPresetBlob({
        item,
        preset,
        effectiveWatermark
      });

      if (isCancelledRef?.current) throw new Error('Export cancelled by user.');

      if (onProgress) {
        onProgress({
          current: currentOp,
          total: totalOps,
          percentage: Math.round((currentOp / totalOps) * 100),
          currentFilename: `[${preset.prefix} • ${pIdx + 1}/${presets.length}] ${filename}`
        });
      }

      triggerDownload(blob, filename);

      // Stagger downloads slightly so browser queue does not choke
      await new Promise((res) => setTimeout(res, 380));
    }

    if (pIdx < presets.length - 1 && !isCancelledRef?.current) {
      await new Promise((res) => setTimeout(res, 450));
    }
  }

  return { totalOps, mode: 'direct' };
}

/**
 * 2. CREATE FOLDERS IN DOWNLOADS:
 * In the Downloads folder, creates folders with each selected preset's name
 * and stores their relative images inside them.
 * 
 * Supports:
 * - Local filesystem API (when Vite server is running, saves directly to ~/Downloads/<PresetName>/<filename>)
 * - Web File System Access API (showDirectoryPicker - lets user choose Downloads folder once, then creates folders & saves)
 * - Automatic ZIP with folders fallback if browser does not support directory picking
 */
export async function exportToFoldersInDownloads({
  images,
  presets,
  resolveWatermarkForPreset,
  onProgress,
  isCancelledRef,
  targetFolder = '~/Downloads'
}) {
  if (!images?.length || !presets?.length) throw new Error('No images or presets selected.');

  const totalOps = images.length * presets.length;

  // Step A: Check if local API is accessible
  const localApiUrl = await checkLocalApiReachable();

  if (localApiUrl !== null) {
    // PATH 1: Direct Local Filesystem API saving to ~/Downloads/<PresetName>/
    for (let pIdx = 0; pIdx < presets.length; pIdx++) {
      if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
      const preset = presets[pIdx];
      const folderName = sanitizeFolderName(preset.name);
      const watermarkSource = resolveWatermarkForPreset ? resolveWatermarkForPreset(preset) : null;
      const effectiveWatermark = watermarkSource || preset.watermarkPreviewUrl || preset.watermarkDataUrl || null;

      for (let i = 0; i < images.length; i++) {
        if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
        const item = images[i];
        const currentOp = pIdx * images.length + i + 1;

        const { blob, filename } = await renderPresetBlob({
          item,
          preset,
          effectiveWatermark
        });

        if (isCancelledRef?.current) throw new Error('Export cancelled by user.');

        if (onProgress) {
          onProgress({
            current: currentOp,
            total: totalOps,
            percentage: Math.round((currentOp / totalOps) * 100),
            currentFilename: `Saving to ${folderName}/${filename}...`
          });
        }

        const base64Data = await blobToBase64(blob);

        const res = await fetch(`${localApiUrl}/api/save-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderPath: targetFolder || '~/Downloads',
            subfolder: folderName,
            filename,
            base64Data
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to save ${filename} via local filesystem: HTTP ${res.status}`);
        }
      }
    }

    return { totalOps, mode: 'local-fs', folderCount: presets.length };
  }

  // Step B: If local API not reachable (e.g. running on Netlify), check File System Access API
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    let rootDirHandle;
    try {
      rootDirHandle = await window.showDirectoryPicker({
        id: 'pofix_downloads_export',
        startIn: 'downloads',
        mode: 'readwrite'
      });
    } catch (pickerErr) {
      if (pickerErr.name === 'AbortError') {
        throw new Error('Folder selection cancelled.');
      }
      console.warn('Directory picker failed, falling back to ZIP:', pickerErr);
      rootDirHandle = null;
    }

    if (rootDirHandle) {
      // PATH 2: Native Directory Handles in user-selected folder
      for (let pIdx = 0; pIdx < presets.length; pIdx++) {
        if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
        const preset = presets[pIdx];
        const folderName = sanitizeFolderName(preset.name);
        const watermarkSource = resolveWatermarkForPreset ? resolveWatermarkForPreset(preset) : null;
        const effectiveWatermark = watermarkSource || preset.watermarkPreviewUrl || preset.watermarkDataUrl || null;

        // Create or get subfolder for this preset
        const subFolderHandle = await rootDirHandle.getDirectoryHandle(folderName, { create: true });

        for (let i = 0; i < images.length; i++) {
          if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
          const item = images[i];
          const currentOp = pIdx * images.length + i + 1;

          const { blob, filename } = await renderPresetBlob({
            item,
            preset,
            effectiveWatermark
          });

          if (isCancelledRef?.current) throw new Error('Export cancelled by user.');

          if (onProgress) {
            onProgress({
              current: currentOp,
              total: totalOps,
              percentage: Math.round((currentOp / totalOps) * 100),
              currentFilename: `Writing to ${folderName}/${filename}...`
            });
          }

          const fileHandle = await subFolderHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
      }

      return { totalOps, mode: 'fs-access', folderCount: presets.length };
    }
  }

  // Step C: Fallback to ZIP package with folders if neither local fs nor directory picker available
  return exportToZipWithFolders({
    images,
    presets,
    resolveWatermarkForPreset,
    onProgress,
    isCancelledRef
  });
}

/**
 * 3. DOWNLOAD ZIP WITH FOLDERS:
 * Creates a structured .zip archive where each selected preset has its own folder,
 * storing its relative images inside.
 */
export async function exportToZipWithFolders({
  images,
  presets,
  resolveWatermarkForPreset,
  onProgress,
  isCancelledRef,
  zipFilename
}) {
  if (!images?.length || !presets?.length) throw new Error('No images or presets selected.');

  const totalOps = images.length * presets.length;
  const zip = new JSZip();

  for (let pIdx = 0; pIdx < presets.length; pIdx++) {
    if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
    const preset = presets[pIdx];
    const folderName = sanitizeFolderName(preset.name);
    const presetFolder = zip.folder(folderName);
    const watermarkSource = resolveWatermarkForPreset ? resolveWatermarkForPreset(preset) : null;
    const effectiveWatermark = watermarkSource || preset.watermarkPreviewUrl || preset.watermarkDataUrl || null;

    for (let i = 0; i < images.length; i++) {
      if (isCancelledRef?.current) throw new Error('Export cancelled by user.');
      const item = images[i];
      const currentOp = pIdx * images.length + i + 1;

      const { blob, filename } = await renderPresetBlob({
        item,
        preset,
        effectiveWatermark
      });

      if (isCancelledRef?.current) throw new Error('Export cancelled by user.');

      if (onProgress) {
        onProgress({
          current: currentOp,
          total: totalOps,
          percentage: Math.round((currentOp / totalOps) * 85),
          currentFilename: `Archiving [${folderName}] ${filename}...`
        });
      }

      presetFolder.file(filename, blob);
    }
  }

  if (onProgress) {
    onProgress({
      current: totalOps,
      total: totalOps,
      percentage: 92,
      currentFilename: 'Packaging folders into ZIP archive...'
    });
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      if (onProgress) {
        const pct = Math.min(99, 85 + Math.round(metadata.percent * 0.14));
        onProgress({
          current: totalOps,
          total: totalOps,
          percentage: pct,
          currentFilename: `Compressing ZIP: ${Math.round(metadata.percent)}%`
        });
      }
    }
  );

  const finalName = zipFilename || `presets-by-style-${Date.now().toString(36)}.zip`;
  saveAs(zipBlob, finalName);

  return { totalOps, mode: 'zip', folderCount: presets.length, zipName: finalName };
}
