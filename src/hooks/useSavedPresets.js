import { useState, useEffect, useCallback } from 'react';
import {
  getPresets,
  savePreset,
  deletePreset,
  updatePreset as updatePresetDb
} from '../services/indexedDb';
import {
  DEFAULT_WATERMARK_SETTINGS,
  DEFAULT_CROP_SETTINGS,
  DEFAULT_EXPORT_SETTINGS
} from '../constants/watermark';

const DEFAULT_SEED_PRESETS = [
  {
    id: 'seed_bol_portrait',
    name: 'BOL Portrait Listing',
    prefix: 'BOL',
    settings: {
      ...DEFAULT_WATERMARK_SETTINGS,
      type: 'text',
      text: 'POFIX • BOL',
      fontSize: 28,
      position: { preset: 'bottom-right', x: 0.95, y: 0.95 },
      size: 0.22,
      opacity: 0.85,
      border: {
        style: 'solid',
        size: 10,
        color: '#D97706',
        shadowEnabled: true
      }
    },
    cropSettings: {
      ...DEFAULT_CROP_SETTINGS,
      enabled: true,
      preset: '4:5',
      width: 1080,
      height: 1350,
      aspect: 4 / 5,
      focus: 'center'
    },
    exportSettings: {
      ...DEFAULT_EXPORT_SETTINGS,
      format: 'jpeg',
      quality: 0.92
    },
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'seed_dot_square',
    name: 'DOT Square Social',
    prefix: 'DOT',
    settings: {
      ...DEFAULT_WATERMARK_SETTINGS,
      type: 'text',
      text: 'POFIX • DOT',
      fontSize: 26,
      position: { preset: 'bottom-right', x: 0.95, y: 0.95 },
      size: 0.20,
      opacity: 0.80,
      border: {
        style: 'none',
        size: 8,
        color: '#C0392B',
        shadowEnabled: true
      }
    },
    cropSettings: {
      ...DEFAULT_CROP_SETTINGS,
      enabled: true,
      preset: '1:1',
      width: 1080,
      height: 1080,
      aspect: 1,
      focus: 'center'
    },
    exportSettings: {
      ...DEFAULT_EXPORT_SETTINGS,
      format: 'jpeg',
      quality: 0.92
    },
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export function useSavedPresets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPresets = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getPresets();
      if (!list || list.length === 0) {
        // Seed default presets so the user immediately has ready-to-use styles
        try {
          const seeded = [];
          for (const item of DEFAULT_SEED_PRESETS) {
            const saved = await savePreset(item);
            seeded.push(saved);
          }
          setPresets(seeded);
        } catch (seedErr) {
          console.warn('Could not seed presets to DB:', seedErr);
          setPresets(DEFAULT_SEED_PRESETS);
        }
      } else {
        setPresets(list);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load presets:', err);
      setError('Could not load saved presets.');
      setPresets(DEFAULT_SEED_PRESETS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const addPreset = useCallback(async (presetData) => {
    try {
      const cleanPrefix = (presetData.prefix || 'BOL')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5) || 'BOL';

      const recordToSave = {
        ...presetData,
        prefix: cleanPrefix,
        name: presetData.name?.trim() || `${cleanPrefix} Style Preset`,
        createdAt: new Date().toISOString()
      };

      const saved = await savePreset(recordToSave);
      setPresets((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      return saved;
    } catch (err) {
      console.error('Failed to add preset:', err);
      throw err;
    }
  }, []);

  const updatePreset = useCallback(async (id, updates) => {
    try {
      const cleanUpdates = { ...updates };
      if (cleanUpdates.prefix) {
        cleanUpdates.prefix = cleanUpdates.prefix
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 5);
      }
      const updated = await updatePresetDb(id, cleanUpdates);
      setPresets((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      console.error('Failed to update preset:', err);
      throw err;
    }
  }, []);

  const removePreset = useCallback(async (id) => {
    try {
      await deletePreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete preset:', err);
      throw err;
    }
  }, []);

  const duplicatePreset = useCallback(async (id) => {
    const existing = presets.find((p) => p.id === id);
    if (!existing) return null;

    const copy = {
      ...existing,
      id: undefined,
      name: `${existing.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    return await addPreset(copy);
  }, [presets, addPreset]);

  return {
    presets,
    loading,
    error,
    addPreset,
    updatePreset,
    removePreset,
    duplicatePreset,
    reloadPresets: loadPresets
  };
}
