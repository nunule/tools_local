export type WatermarkMode = 'tile' | 'single';

export type SinglePosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'middle-left' 
  | 'center' 
  | 'middle-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface StrokeConfig {
  enabled: boolean;
  color: string;
  width: number;
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export type BlendMode = 
  | 'source-over'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'multiply';

export interface WatermarkConfig {
  // Text Content
  text: string;
  mode: WatermarkMode;
  
  // Typography
  fontSize: number;
  fontFamily: string;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '900';
  lineHeight: number;
  letterSpacing: number;

  // Appearance
  color: string;
  opacity: number; // 0 - 100
  rotate: number; // -180 to 180 degrees
  blendMode: BlendMode;

  // Tile Mode Settings
  gapX: number;
  gapY: number;
  stagger: boolean; // Staggered rows (brick layout)

  // Single Mode Settings
  position: SinglePosition;
  offsetX: number;
  offsetY: number;

  // Readability & Enhancement Effects
  stroke: StrokeConfig;
  shadow: ShadowConfig;

  // Output / Export
  exportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  exportQuality: number; // 10 to 100
  scale: number; // 0.25 to 2
  filenamePattern: string; // e.g. "{name}_watermarked"
}

export interface ImageItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  dataUrl: string;
  aspectRatio: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  processedDataUrl?: string;
  processedSize?: number;
  error?: string;
}

export type ActiveToolTab = 
  | 'watermark' 
  | 'redact' 
  | 'exif' 
  | 'screenshot' 
  | 'id-copy' 
  | 'json-config' 
  | 'about';
