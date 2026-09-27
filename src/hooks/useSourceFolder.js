import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pofix_source_folder_name';

/**
 * Manages a user-selected "source folder" via the File System Access API.
 * - Asks the user to pick a folder once (showDirectoryPicker).
 * - Remembers the folder display name in localStorage.
 * - After processing, can delete original files by filename from that folder.
 *
 * NOTE: The File System Access API is supported in Chrome/Edge (desktop).
 * Firefox and Safari do not support showDirectoryPicker.
 */
export function useSourceFolder() {
  const dirHandleRef = useRef(null);

  const [folderName, setFolderName] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isSupported] = useState(() =>
    typeof window !== 'undefined' && 'showDirectoryPicker' in window
  );

  const [status, setStatus] = useState('idle'); // 'idle' | 'picking' | 'ready' | 'error'

  // Persist folder name to localStorage whenever it changes
  useEffect(() => {
    try {
      if (folderName) {
        localStorage.setItem(STORAGE_KEY, folderName);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [folderName]);

  /**
   * Opens the directory picker dialog. User grants read+write permission.
   * The handle is stored in memory for the session.
   */
  const pickFolder = useCallback(async () => {
    if (!isSupported) {
      return { success: false, error: 'File System Access API not supported in this browser. Use Chrome or Edge.' };
    }

    setStatus('picking');
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      dirHandleRef.current = handle;
      setFolderName(handle.name);
      setStatus('ready');
      return { success: true, name: handle.name };
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(dirHandleRef.current ? 'ready' : 'idle');
        return { success: false, error: 'Cancelled' };
      }
      setStatus('error');
      return { success: false, error: err.message };
    }
  }, [isSupported]);

  /**
   * Deletes files by their original filenames from the selected source folder.
   * Returns { deleted: string[], failed: string[] }
   */
  const deleteFiles = useCallback(async (filenames = []) => {
    if (!dirHandleRef.current) {
      return { deleted: [], failed: filenames, error: 'No source folder selected.' };
    }
    if (!filenames.length) {
      return { deleted: [], failed: [] };
    }

    const deleted = [];
    const failed = [];

    for (const name of filenames) {
      try {
        // Try to get the file handle in the root of the folder
        const fileHandle = await dirHandleRef.current.getFileHandle(name, { create: false });
        await fileHandle.remove();
        deleted.push(name);
      } catch (err) {
        // File might be in a subfolder or not found — skip silently
        failed.push(name);
      }
    }

    return { deleted, failed };
  }, []);

  /**
   * Clears the stored folder (name from localStorage + handle from memory).
   */
  const clearFolder = useCallback(() => {
    dirHandleRef.current = null;
    setFolderName(null);
    setStatus('idle');
  }, []);

  /**
   * Returns true if the handle is currently available in memory.
   * (Handles don't persist across page reloads — user must re-pick after refresh.)
   */
  const hasHandle = Boolean(dirHandleRef.current);

  return {
    isSupported,
    folderName,
    hasHandle,
    status,
    pickFolder,
    deleteFiles,
    clearFolder
  };
}
