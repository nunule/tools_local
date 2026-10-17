export type ActiveToolTab = 
  | 'watermark' 
  | 'redact' 
  | 'exif' 
  | 'screenshot' 
  | 'id-copy' 
  | 'json-config' 
  | 'about';

// ==================== 1. 隐私遮挡 (Privacy Redact) ====================
export type RedactStyle = 'mosaic' | 'blur' | 'solid';
export type RedactShape = 'rect' | 'brush';

export interface Point {
  x: number;
  y: number;
}

export interface RedactItem {
  id: string;
  shape: RedactShape;
  style: RedactStyle;
  // Rect properties
  x: number;
  y: number;
  width: number;
  height: number;
  // Brush properties
  points?: Point[];
  brushRadius?: number;
  // Style properties
  solidColor?: string;
  mosaicSize?: number; // e.g. 12px
  blurRadius?: number; // e.g. 10px
}

// ==================== 2. 照片信息清理 (EXIF) ====================
export interface ExifReport {
  fileName: string;
  fileSize: number;
  fileType: string;
  hasGps: boolean;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  camera?: {
    make?: string;
    model?: string;
    lensModel?: string;
    software?: string;
  };
  timing?: {
    dateTimeOriginal?: string;
    dateTimeDigitized?: string;
    offsetTime?: string;
  };
  exposure?: {
    iso?: number;
    fNumber?: number;
    exposureTime?: string | number;
    focalLength?: string | number;
    flash?: string;
  };
  rawDetails: Record<string, any>;
  riskLevel: 'high' | 'medium' | 'low';
  riskReasons: string[];
}

// ==================== 3. 截图隐私处理 (Screenshot) ====================
export interface ScreenshotTrimPreset {
  id: string;
  name: string;
  description: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// ==================== 4. 证件分享副本 (ID Copy) ====================
export type IDDocType = 'id-card' | 'driver-license' | 'passport' | 'bank-card' | 'generic';

export interface IDCopyConfig {
  docType: IDDocType;
  purpose: string;
  issuerOrg: string;
  validDays: number;
  customWatermark: string;
  maskIdSuffix: boolean; // 遮挡身份证号后4位
  maskAddressDetail: boolean; // 遮挡地址门牌号
  maskBirthDate: boolean; // 遮挡出生年月日
  watermarkOpacity: number;
  watermarkAngle: number;
  layout: 'single' | 'a4-sheet' | 'side-by-side';
  frontImage?: string;
  backImage?: string;
}
