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
  EXPORT_SETTINGS: 'post_studio_export_settings',
  LAST_WATERMARK_ID: 'post_studio_last_watermark_id',
  SIDEBAR_COLLAPSED: 'post_studio_sidebar_collapsed'
};
