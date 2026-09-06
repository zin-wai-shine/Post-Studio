import { useState, useEffect, useCallback, useRef } from 'react';
import { getWatermarks, saveWatermark, deleteWatermark } from '../services/indexedDb';

export function useSavedWatermarks() {
  const [savedWatermarks, setSavedWatermarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track generated object URLs for clean revocation
  const urlsRef = useRef(new Map());

  const revokeUrls = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
  }, []);

  const loadWatermarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getWatermarks();

      // Revoke prior URLs
      revokeUrls();

      // Attach fresh preview URLs
      const enriched = items.map((item) => {
        let previewUrl = '';
        if (item.blob) {
          previewUrl = URL.createObjectURL(item.blob);
          urlsRef.current.set(item.id, previewUrl);
        }
        return {
          ...item,
          previewUrl
        };
      });

      setSavedWatermarks(enriched);
    } catch (err) {
      console.error('Failed to load saved watermarks:', err);
      setError(err.message || 'Failed to load watermarks from storage.');
    } finally {
      setLoading(false);
    }
  }, [revokeUrls]);

  useEffect(() => {
    loadWatermarks();
    return () => {
      revokeUrls();
    };
  }, [loadWatermarks, revokeUrls]);

  const addWatermark = useCallback(async ({ name, blob, mimeType }) => {
    try {
      const saved = await saveWatermark({ name, blob, mimeType });
      await loadWatermarks();
      return saved;
    } catch (err) {
      console.error('Failed to save watermark:', err);
      throw err;
    }
  }, [loadWatermarks]);

  const removeWatermark = useCallback(async (id) => {
    try {
      await deleteWatermark(id);
      await loadWatermarks();
    } catch (err) {
      console.error('Failed to delete watermark:', err);
      throw err;
    }
  }, [loadWatermarks]);

  return {
    savedWatermarks,
    loading,
    error,
    addWatermark,
    removeWatermark,
    refresh: loadWatermarks
  };
}
