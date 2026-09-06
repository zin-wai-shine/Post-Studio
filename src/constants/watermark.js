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

export const BUILT_IN_CROP_PRESETS = [
  { id: '4:3', name: '4:3 Property Listing', label: '4:3 Property Listing (1440 × 1080)', width: 1440, height: 1080, aspect: 4 / 3, ratioLabel: '4:3', isCustom: false },
  { id: '4:5', name: '4:5 Portrait / IG Post', label: '4:5 Portrait / IG (1080 × 1350)', width: 1080, height: 1350, aspect: 4 / 5, ratioLabel: '4:5', isCustom: false },
  { id: '1:1', name: '1:1 Square Post', label: '1:1 Square (1080 × 1080)', width: 1080, height: 1080, aspect: 1, ratioLabel: '1:1', isCustom: false },
  { id: '16:9', name: '16:9 Landscape Web', label: '16:9 Landscape (1920 × 1080)', width: 1920, height: 1080, aspect: 16 / 9, ratioLabel: '16:9', isCustom: false },
  { id: '9:16', name: '9:16 Story / Reel', label: '9:16 Story / Reel (1080 × 1920)', width: 1080, height: 1920, aspect: 9 / 16, ratioLabel: '9:16', isCustom: false },
  { id: '3:2', name: '3:2 Classic Photo', label: '3:2 Classic Photo (1620 × 1080)', width: 1620, height: 1080, aspect: 3 / 2, ratioLabel: '3:2', isCustom: false }
];

export const STORAGE_KEYS = {
  SETTINGS: 'post_studio_watermark_settings',
  CROP_SETTINGS: 'post_studio_crop_settings',
  GRID_CROP_SETTINGS: 'post_studio_grid_crop_settings',
  EXPORT_SETTINGS: 'post_studio_export_settings',
  LAST_WATERMARK_ID: 'post_studio_last_watermark_id',
  SIDEBAR_COLLAPSED: 'post_studio_sidebar_collapsed',
  SAVED_CROP_PRESETS: 'post_studio_saved_crop_presets'
};

export const SOCIAL_GRID_LAYOUTS = [
  {
    id: 'one-square',
    name: 'One Square',
    subtitle: '1080 × 1080 px (1:1)',
    fbBadge: '1080 × 1080 px',
    fbSummary: '1× 1080 × 1080 px',
    tileCount: 1,
    aspect: 1,
    tiles: [
      { id: 1, key: 'square', label: '1080 × 1080 px', targetWidth: 1080, targetHeight: 1080, x: 0, y: 0, w: 1, h: 1 }
    ]
  },
  {
    id: 'two-squares',
    name: 'Two Squares',
    subtitle: '2× 1080 × 2160 px (Vertical Split)',
    fbBadge: '2× 1080 × 2160 px',
    fbSummary: '2× 1080 × 2160 px',
    tileCount: 2,
    aspect: 1,
    tiles: [
      { id: 1, key: 'left', label: 'Left (1080 × 2160)', targetWidth: 1080, targetHeight: 2160, x: 0, y: 0, w: 0.5, h: 1 },
      { id: 2, key: 'right', label: 'Right (1080 × 2160)', targetWidth: 1080, targetHeight: 2160, x: 0.5, y: 0, w: 0.5, h: 1 }
    ]
  },
  {
    id: 'three-squares',
    name: 'Three Squares',
    subtitle: 'Top 1200 × 600 • Bottom 1080 × 1080',
    fbBadge: 'Top 1200×600 • Bottom 1080×1080',
    fbSummary: 'Top 1200 × 600 px • Bottom 2× 1080 × 1080 px',
    tileCount: 3,
    aspect: 1,
    tiles: [
      { id: 1, key: 'top', label: 'Top Banner (1200 × 600)', targetWidth: 1200, targetHeight: 600, x: 0, y: 0, w: 1, h: 0.5 },
      { id: 2, key: 'bottom-left', label: 'Bottom Left (1080 × 1080)', targetWidth: 1080, targetHeight: 1080, x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { id: 3, key: 'bottom-right', label: 'Bottom Right (1080 × 1080)', targetWidth: 1080, targetHeight: 1080, x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
    ]
  },
  {
    id: 'four-squares',
    name: 'Four Squares',
    subtitle: '4× 1080 × 1080 px (2×2 Grid)',
    fbBadge: '4× 1080 × 1080 px',
    fbSummary: '4× 1080 × 1080 px',
    tileCount: 4,
    aspect: 1,
    tiles: [
      { id: 1, key: 'top-left', label: 'Top Left (1080 × 1080)', targetWidth: 1080, targetHeight: 1080, x: 0, y: 0, w: 0.5, h: 0.5 },
      { id: 2, key: 'top-right', label: 'Top Right (1080 × 1080)', targetWidth: 1080, targetHeight: 1080, x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { id: 3, key: 'bottom-left', label: 'Bottom Left (1080 × 1080)', targetWidth: 1080, targetHeight: 1080, x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { id: 4, key: 'bottom-right', label: 'Bottom Right (1080 × 1080)', targetWidth: 1080, targetHeight: 1080, x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
    ]
  },
  {
    id: 'five-squares',
    name: 'Five Squares',
    subtitle: '2× 1080 × 1188 • 3× 720 × 972',
    fbBadge: 'Top 1080×1188 • Bottom 720×972',
    fbSummary: 'Top 2× 1080 × 1188 px • Bottom 3× 720 × 972 px',
    tileCount: 5,
    aspect: 1,
    tiles: [
      { id: 1, key: 'top-left', label: 'Top Left (1080 × 1188)', targetWidth: 1080, targetHeight: 1188, x: 0, y: 0, w: 0.5, h: 0.55 },
      { id: 2, key: 'top-right', label: 'Top Right (1080 × 1188)', targetWidth: 1080, targetHeight: 1188, x: 0.5, y: 0, w: 0.5, h: 0.55 },
      { id: 3, key: 'bottom-left', label: 'Bottom Left (720 × 972)', targetWidth: 720, targetHeight: 972, x: 0, y: 0.55, w: 1 / 3, h: 0.45 },
      { id: 4, key: 'bottom-mid', label: 'Bottom Mid (720 × 972)', targetWidth: 720, targetHeight: 972, x: 1 / 3, y: 0.55, w: 1 / 3, h: 0.45 },
      { id: 5, key: 'bottom-right', label: 'Bottom Right (720 × 972)', targetWidth: 720, targetHeight: 972, x: 2 / 3, y: 0.55, w: 1 / 3, h: 0.45 }
    ]
  },
  {
    id: 'six-squares',
    name: 'Six Squares',
    subtitle: '2× 1080 × 1188 • 4× 540 × 972 (+1 FB Grid)',
    fbBadge: 'Top 1080×1188 • Bottom 540×972',
    fbSummary: 'Top 2× 1080 × 1188 px • Bottom 4× 540 × 972 px',
    tileCount: 6,
    aspect: 1,
    hasPlusOneBadge: true,
    tiles: [
      { id: 1, key: 'top-left', label: 'Top Left (1080 × 1188)', targetWidth: 1080, targetHeight: 1188, x: 0, y: 0, w: 0.5, h: 0.55 },
      { id: 2, key: 'top-right', label: 'Top Right (1080 × 1188)', targetWidth: 1080, targetHeight: 1188, x: 0.5, y: 0, w: 0.5, h: 0.55 },
      { id: 3, key: 'bottom-1', label: 'Bottom 1 (540 × 972)', targetWidth: 540, targetHeight: 972, x: 0, y: 0.55, w: 0.25, h: 0.45 },
      { id: 4, key: 'bottom-2', label: 'Bottom 2 (540 × 972)', targetWidth: 540, targetHeight: 972, x: 0.25, y: 0.55, w: 0.25, h: 0.45 },
      { id: 5, key: 'bottom-3', label: 'Bottom 3 (540 × 972)', targetWidth: 540, targetHeight: 972, x: 0.50, y: 0.55, w: 0.25, h: 0.45 },
      { id: 6, key: 'bottom-4', label: 'Bottom 4 (540 × 972)', targetWidth: 540, targetHeight: 972, x: 0.75, y: 0.55, w: 0.25, h: 0.45 }
    ]
  }
];

export const DEFAULT_GRID_CROP_SETTINGS = {
  mode: 'standard', // 'standard' | 'grid'
  activeLayout: 'four-squares',
  gridFocus: 'center'
};


