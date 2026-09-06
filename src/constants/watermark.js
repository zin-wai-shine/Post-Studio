export const POSITION_PRESETS = {
  'top-left': { label: 'Top Left', x: 0.05, y: 0.05 },
  'top-center': { label: 'Top Center', x: 0.5, y: 0.05 },
  'top-right': { label: 'Top Right', x: 0.95, y: 0.05 },
  'center-left': { label: 'Center Left', x: 0.05, y: 0.5 },
  'center': { label: 'Center', x: 0.5, y: 0.5 },
  'center-right': { label: 'Center Right', x: 0.95, y: 0.5 },
  'bottom-left': { label: 'Bottom Left', x: 0.05, y: 0.95 },
  'bottom-center': { label: 'Bottom Center', x: 0.5, y: 0.95 },
  'bottom-right': { label: 'Bottom Right', x: 0.95, y: 0.95 }
};

export const WATERMARK_STYLES = [
  { id: 'single', label: 'Single', description: 'One watermark at selected position' },
  { id: 'repeated', label: 'Repeated', description: 'Evenly repeated across entire image' },
  { id: 'diagonal', label: 'Diagonal Pattern', description: 'Angled pattern covering image' },
  { id: 'dot-grid', label: 'Dot Grid', description: 'Structured compact watermark grid' },
  { id: 'sparse', label: 'Sparse Pattern', description: 'Subtle repeat with wide spacing' },
  { id: 'dense', label: 'Dense Pattern', description: 'Frequent repeating watermark security' }
];

export const EXPORT_FORMATS = [
  { id: 'original', label: 'Keep Original', mime: null },
  { id: 'jpeg', label: 'JPEG (.jpg)', mime: 'image/jpeg' },
  { id: 'png', label: 'PNG (.png)', mime: 'image/png' },
  { id: 'webp', label: 'WEBP (.webp)', mime: 'image/webp' }
];

export const CROP_PRESETS = [
  { id: 'original', label: 'Original Size (No Crop)', width: null, height: null, aspect: null },
  { id: '1:1', label: '1:1 Square (1080 × 1080)', width: 1080, height: 1080, aspect: 1 },
  { id: '4:5', label: '4:5 Portrait (1080 × 1350)', width: 1080, height: 1350, aspect: 4 / 5 },
  { id: '9:16', label: '9:16 Story / Reel (1080 × 1920)', width: 1080, height: 1920, aspect: 9 / 16 },
  { id: '16:9', label: '16:9 Landscape (1920 × 1080)', width: 1920, height: 1080, aspect: 16 / 9 },
  { id: '4:3', label: '4:3 Property Listing (1440 × 1080)', width: 1440, height: 1080, aspect: 4 / 3 },
  { id: '3:2', label: '3:2 Classic Photo (1620 × 1080)', width: 1620, height: 1080, aspect: 3 / 2 },
  { id: 'custom', label: 'Custom Dimensions (px)', width: 1080, height: 1080, aspect: null }
];

export const FOCUS_POSITIONS = {
  'top-left': { label: 'Top Left', x: 0, y: 0 },
  'top-center': { label: 'Top Center', x: 0.5, y: 0 },
  'top-right': { label: 'Top Right', x: 1, y: 0 },
  'center-left': { label: 'Center Left', x: 0, y: 0.5 },
  'center': { label: 'Center', x: 0.5, y: 0.5 },
  'center-right': { label: 'Center Right', x: 1, y: 0.5 },
  'bottom-left': { label: 'Bottom Left', x: 0, y: 1 },
  'bottom-center': { label: 'Bottom Center', x: 0.5, y: 1 },
  'bottom-right': { label: 'Bottom Right', x: 1, y: 1 }
};

export const DEFAULT_CROP_SETTINGS = {
  enabled: false,
  preset: 'original',
  width: 1080,
  height: 1080,
  aspect: null,
  focus: 'center',
  focusX: 0.5,
  focusY: 0.5,
  fitMode: 'cover' // 'cover' (crop) | 'contain' (pad)
};

export const DEFAULT_WATERMARK_SETTINGS = {
  type: 'image', // 'image' | 'text'
  watermarkId: null,
  text: 'Post Studio',
  fontFamily: 'Inter, -apple-system, sans-serif',
  fontSize: 24,
  fontWeight: '600',
  textColor: '#FFFFFF',
  textShadow: true,
  position: {
    preset: 'bottom-right',
    x: 0.95,
    y: 0.95
  },
  size: 0.20, // 20% of image width
  opacity: 0.80, // 80%
  rotation: 0, // degrees
  style: 'single',
  pattern: {
    horizontalGap: 0.15,
    verticalGap: 0.15,
    rotation: -30,
    scale: 0.12
  },
  edgePadding: 0.03
};

export const DEFAULT_EXPORT_SETTINGS = {
  format: 'original',
  quality: 0.92,
  suffix: '-watermarked'
};

export const STORAGE_KEYS = {
  SETTINGS: 'post_studio_watermark_settings',
  CROP_SETTINGS: 'post_studio_crop_settings',
  EXPORT_SETTINGS: 'post_studio_export_settings',
  LAST_WATERMARK_ID: 'post_studio_last_watermark_id',
  SIDEBAR_COLLAPSED: 'post_studio_sidebar_collapsed'
};
