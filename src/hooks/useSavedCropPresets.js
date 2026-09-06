import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, BUILT_IN_CROP_PRESETS } from '../constants/watermark';

export function useSavedCropPresets() {
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_CROP_PRESETS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load saved crop presets from localStorage:', e);
    }
    return [];
  });

  // Combine standard built-in presets and user-saved presets
  const allPresets = [
    ...BUILT_IN_CROP_PRESETS,
    ...customPresets
  ];

  // Persist custom presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_CROP_PRESETS, JSON.stringify(customPresets));
    } catch (e) {
      console.warn('Failed to persist crop presets to localStorage:', e);
    }
  }, [customPresets]);

  const addCropPreset = useCallback(({ name, width, height, focus = 'center' }) => {
    const w = parseInt(width, 10) || 1080;
    const h = parseInt(height, 10) || 1080;
    
    // Calculate simple aspect ratio string
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const rW = Math.round(w / divisor);
    const rH = Math.round(h / divisor);
    const ratioLabel = rW < 100 && rH < 100 ? `${rW}:${rH}` : 'Custom';

    const newPreset = {
      id: `custom_crop_${Date.now()}`,
      name: name?.trim() || `Custom (${w} × ${h})`,
      label: `${name?.trim() || 'Custom'} (${w} × ${h})`,
      width: w,
      height: h,
      aspect: w / h,
      ratioLabel,
      focus,
      isCustom: true,
      createdAt: Date.now()
    };

    setCustomPresets((prev) => [newPreset, ...prev]);
    return newPreset;
  }, []);

  const removeCropPreset = useCallback((id) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renameCropPreset = useCallback((id, newName) => {
    if (!newName?.trim()) return;
    setCustomPresets((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const trimmed = newName.trim();
          return {
            ...p,
            name: trimmed,
            label: `${trimmed} (${p.width} × ${p.height})`
          };
        }
        return p;
      })
    );
  }, []);

  return {
    presets: allPresets,
    customPresets,
    addCropPreset,
    removeCropPreset,
    renameCropPreset
  };
}
