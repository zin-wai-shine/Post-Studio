import { useState, useCallback, useEffect } from 'react';

const STORAGE_PATH_KEY = 'pofix_source_folder_path';
const STORAGE_ENABLED_KEY = 'pofix_auto_delete_enabled';

// Resolve base API URL (handles localhost as well as deployed frontends communicating with local dev server)
function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  // If already on localhost:5173 or relative
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }
  // If hosted on Netlify, attempt connecting to the local helper on 5173
  return 'http://localhost:5173';
}

/**
 * Hook to manage the user's configured source folder path for auto-deleting
 * uploaded original files after cutting, presets export, or renaming.
 */
export function useSourceFolder() {
  const [folderPath, setFolderPathState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_PATH_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isEnabled, setIsEnabledState] = useState(() => {
    try {
      const val = localStorage.getItem(STORAGE_ENABLED_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  const [systemInfo, setSystemInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckError, setLastCheckError] = useState(null);

  const setFolderPath = useCallback((newPath) => {
    const trimmed = (newPath || '').trim();
    setFolderPathState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_PATH_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_PATH_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const setIsEnabled = useCallback((enabled) => {
    setIsEnabledState(Boolean(enabled));
    try {
      localStorage.setItem(STORAGE_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, []);

  // Fetch local system information (Downloads directory, Desktop directory, username)
  const fetchSystemInfo = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/system-info`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSystemInfo(data);
          // If no folder path configured yet, automatically default to the Downloads directory
          setFolderPathState((prev) => {
            if (!prev && data.downloadsDir) {
              try {
                localStorage.setItem(STORAGE_PATH_KEY, data.downloadsDir);
              } catch {
                // ignore
              }
              return data.downloadsDir;
            }
            return prev;
          });
          return data;
        }
      }
    } catch (err) {
      // Dev server might not be running on that port
    }
    return null;
  }, []);

  // Check if current path exists and is accessible
  const verifyPath = useCallback(async (pathToVerify) => {
    const targetPath = pathToVerify !== undefined ? pathToVerify : folderPath;
    if (!targetPath) {
      setIsConnected(false);
      setLastCheckError(null);
      return { success: false, exists: false };
    }

    setIsChecking(true);
    setLastCheckError(null);
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/api/check-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: targetPath })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.exists) {
        setIsConnected(true);
        setLastCheckError(null);
        return { success: true, exists: true, resolvedPath: data.resolvedPath, fileCount: data.fileCount };
      } else {
        setIsConnected(false);
        const errMsg = data.error || 'Folder not found on computer';
        setLastCheckError(errMsg);
        return { success: false, exists: false, error: errMsg };
      }
    } catch (err) {
      setIsConnected(false);
      setLastCheckError(err.message);
      return { success: false, exists: false, error: err.message };
    } finally {
      setIsChecking(false);
    }
  }, [folderPath]);

  // Initial load: get system info and verify path
  useEffect(() => {
    let mounted = true;
    (async () => {
      const sys = await fetchSystemInfo();
      if (!mounted) return;
      const initialPath = folderPath || sys?.downloadsDir || '';
      if (initialPath) {
        verifyPath(initialPath);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchSystemInfo, folderPath, verifyPath]);

  /**
   * Delete files from the configured folder path.
   * Accepts an array of original filenames.
   */
  const deleteFiles = useCallback(async (filenames = []) => {
    if (!isEnabled || !folderPath || !filenames.length) {
      return { success: false, deleted: [], failed: filenames, reason: 'disabled or no path' };
    }

    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/delete-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath,
          filenames
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        success: data.success,
        deleted: data.deleted || [],
        failed: data.failed || [],
        folderPath: data.folderPath || folderPath
      };
    } catch (err) {
      console.warn('[useSourceFolder] Failed to delete files via local API:', err);
      return {
        success: false,
        deleted: [],
        failed: filenames,
        error: err.message
      };
    }
  }, [folderPath, isEnabled]);

  return {
    folderPath,
    setFolderPath,
    isEnabled,
    setIsEnabled,
    isConnected,
    isChecking,
    lastCheckError,
    systemInfo,
    verifyPath,
    deleteFiles
  };
}
