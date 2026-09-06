import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_WATERMARK_SETTINGS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_CROP_SETTINGS,
  POSITION_PRESETS,
  CROP_PRESETS,
  FOCUS_POSITIONS,
  STORAGE_KEYS
} from '../constants/watermark';

export function useWatermarkSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_WATERMARK_SETTINGS,
          ...parsed,
          position: { ...DEFAULT_WATERMARK_SETTINGS.position, ...(parsed.position || {}) },
          pattern: { ...DEFAULT_WATERMARK_SETTINGS.pattern, ...(parsed.pattern || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to parse watermark settings from localStorage:', e);
    }
    return DEFAULT_WATERMARK_SETTINGS;
  });

  const [cropSettings, setCropSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CROP_SETTINGS);
      if (stored) {
        return { ...DEFAULT_CROP_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse crop settings from localStorage:', e);
    }
    return DEFAULT_CROP_SETTINGS;
  });

  const [exportSettings, setExportSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPORT_SETTINGS);
      if (stored) {
        return { ...DEFAULT_EXPORT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse export settings from localStorage:', e);
    }
    return DEFAULT_EXPORT_SETTINGS;
  });

  // Persist to localStorage on update
  useEffect(() => {
    try {
      const { watermarkId, ...persistable } = settings;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(persistable));
    } catch (e) {
      console.warn('Failed to save watermark settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CROP_SETTINGS, JSON.stringify(cropSettings));
    } catch (e) {
      console.warn('Failed to save crop settings:', e);
    }
  }, [cropSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPORT_SETTINGS, JSON.stringify(exportSettings));
    } catch (e) {
      console.warn('Failed to save export settings:', e);
    }
  }, [exportSettings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updatePatternSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      pattern: {
        ...prev.pattern,
        [key]: value
      }
    }));
  }, []);

  const updateCropSetting = useCallback((key, value) => {
    setCropSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setCropPreset = useCallback((presetId) => {
    const preset = CROP_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (presetId === 'original') {
      setCropSettings((prev) => ({
        ...prev,
        enabled: false,
        preset: 'original',
        aspect: null
      }));
    } else if (presetId === 'custom') {
      setCropSettings((prev) => ({
        ...prev,
        enabled: true,
        preset: 'custom',
        aspect: prev.width / (prev.height || 1)
      }));
    } else {
      setCropSettings((prev) => ({
        ...prev,
        enabled: true,
        preset: presetId,
        width: preset.width,
        height: preset.height,
        aspect: preset.aspect
      }));
    }
  }, []);

  const setCropFocus = useCallback((focusKey) => {
    const focus = FOCUS_POSITIONS[focusKey];
    if (!focus) return;

    setCropSettings((prev) => ({
      ...prev,
      focus: focusKey,
      focusX: focus.x,
      focusY: focus.y
    }));
  }, []);

  const setPositionPreset = useCallback((presetKey) => {
    const preset = POSITION_PRESETS[presetKey];
    if (!preset) return;

    setSettings((prev) => ({
      ...prev,
      position: {
        preset: presetKey,
        x: preset.x,
        y: preset.y
      }
    }));
  }, []);

  const setCustomPosition = useCallback((xPercent, yPercent) => {
    const clampedX = Math.max(0, Math.min(1, xPercent));
    const clampedY = Math.max(0, Math.min(1, yPercent));

    setSettings((prev) => ({
      ...prev,
      position: {
        preset: 'custom',
        x: clampedX,
        y: clampedY
      }
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_WATERMARK_SETTINGS);
    setCropSettings(DEFAULT_CROP_SETTINGS);
    setExportSettings(DEFAULT_EXPORT_SETTINGS);
  }, []);

  return {
    settings,
    cropSettings,
    exportSettings,
    updateSetting,
    updatePatternSetting,
    updateCropSetting,
    setCropPreset,
    setCropFocus,
    setPositionPreset,
    setCustomPosition,
    setExportSettings,
    resetSettings
  };
}
