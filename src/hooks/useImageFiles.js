import { useState, useCallback, useEffect, useRef } from 'react';
import { isValidImageFile, getImageDimensions } from '../utils/imageUtils';

export function useImageFiles() {
  const [images, setImages] = useState([]);
  const [activeImageId, setActiveImageId] = useState(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const urlsRef = useRef(new Map());

  // Cleanup helper to revoke object URLs
  const cleanupUrl = useCallback((id) => {
    const url = urlsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(id);
    }
  }, []);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    };
  }, []);

  const addImages = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return [];
    setIsProcessingUpload(true);

    const validFiles = Array.from(fileList).filter(isValidImageFile);
    if (validFiles.length === 0) {
      setIsProcessingUpload(false);
      throw new Error('No supported image files found (supported: JPG, PNG, WEBP).');
    }

    const newItems = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`;
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.set(id, previewUrl);

      try {
        const dims = await getImageDimensions(previewUrl);
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.aspectRatio,
          previewUrl
        });
      } catch (err) {
        console.warn(`Failed to read dimensions for ${file.name}:`, err);
        // Still add with fallback dimensions
        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          width: 1200,
          height: 800,
          aspectRatio: 1.5,
          previewUrl
        });
      }
    }

    setImages((prev) => {
      const updated = [...prev, ...newItems];
      return updated;
    });

    // Set first image as active if none was selected
    setActiveImageId((prevActive) => {
      if (!prevActive && newItems.length > 0) {
        return newItems[0].id;
      }
      return prevActive;
    });

    setIsProcessingUpload(false);
    return newItems;
  }, []);

  const removeImage = useCallback((id) => {
    cleanupUrl(id);
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      return filtered;
    });

    setActiveImageId((prevActive) => {
      if (prevActive === id) {
        return null;
      }
      return prevActive;
    });
  }, [cleanupUrl]);

  const clearAllImages = useCallback(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
    setImages([]);
    setActiveImageId(null);
  }, []);

  const renameImage = useCallback((id, newName) => {
    if (!id || !newName || !newName.trim()) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, name: newName.trim() } : img
      )
    );
  }, []);

  // Set per-image crop focus (when cropSettings.syncFocus === false)
  const setImageCropFocus = useCallback((id, focusKey, focusX, focusY) => {
    if (!id) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        const currentCustomCrop = img.customCropSettings || {};
        return {
          ...img,
          cropFocus: focusKey,
          cropFocusX: focusX,
          cropFocusY: focusY,
          customCropSettings: {
            ...currentCustomCrop,
            focus: focusKey,
            focusX,
            focusY
          }
        };
      })
    );
  }, []);

  // Enable individual custom overrides for a single image
  const enableImageCustomOverrides = useCallback((id, baseSettings, baseCropSettings) => {
    if (!id) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        return {
          ...img,
          hasCustomOverrides: true,
          customSettings: img.customSettings || JSON.parse(JSON.stringify(baseSettings || {})),
          customCropSettings: img.customCropSettings || JSON.parse(JSON.stringify(baseCropSettings || {}))
        };
      })
    );
  }, []);

  // Update a watermark setting for an individual customized image
  const updateImageCustomSetting = useCallback((id, key, value) => {
    if (!id) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        const currentSettings = img.customSettings || {};
        return {
          ...img,
          hasCustomOverrides: true,
          customSettings: {
            ...currentSettings,
            [key]: value
          }
        };
      })
    );
  }, []);

  // Update a pattern setting for an individual customized image
  const updateImagePatternSetting = useCallback((id, key, value) => {
    if (!id) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        const currentSettings = img.customSettings || {};
        return {
          ...img,
          hasCustomOverrides: true,
          customSettings: {
            ...currentSettings,
            pattern: {
              ...(currentSettings.pattern || {}),
              [key]: value
            }
          }
        };
      })
    );
  }, []);

  // Update a crop setting for an individual customized image
  const updateImageCropSetting = useCallback((id, key, value) => {
    if (!id) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        const currentCrop = img.customCropSettings || {};
        return {
          ...img,
          hasCustomOverrides: true,
          customCropSettings: {
            ...currentCrop,
            [key]: value
          }
        };
      })
    );
  }, []);

  // Clear overrides: revert this image back to the batch defaults
  const clearImageCustomOverrides = useCallback((id) => {
    if (!id) return;
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        return {
          ...img,
          hasCustomOverrides: false,
          customSettings: null,
          customCropSettings: null,
          cropFocus: null,
          cropFocusX: null,
          cropFocusY: null
        };
      })
    );
  }, []);

  // Ensure activeImageId falls back to first available if active was cleared
  useEffect(() => {
    if (!activeImageId && images.length > 0) {
      setActiveImageId(images[0].id);
    }
  }, [images, activeImageId]);

  const activeImage = images.find((img) => img.id === activeImageId) || null;

  return {
    images,
    activeImageId,
    activeImage,
    setActiveImageId,
    addImages,
    removeImage,
    clearAllImages,
    renameImage,
    setImageCropFocus,
    enableImageCustomOverrides,
    updateImageCustomSetting,
    updateImagePatternSetting,
    updateImageCropSetting,
    clearImageCustomOverrides,
    isProcessingUpload
  };
}

