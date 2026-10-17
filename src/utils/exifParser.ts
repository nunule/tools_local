import exifr from 'exifr';
import { ExifReport } from '@/types/privacyTools';

/**
 * Parse EXIF and security metadata from File or Data URL
 */
export async function parsePhotoExif(
  fileOrBlob: File | Blob, 
  fileName: string = 'photo.jpg'
): Promise<ExifReport> {
  const fileSize = fileOrBlob.size;
  const fileType = fileOrBlob.type || 'image/jpeg';

  let rawDetails: Record<string, any> = {};
  let gpsInfo: { latitude: number; longitude: number; altitude?: number } | undefined = undefined;

  try {
    // Parse complete EXIF + TIFF + GPS + IPTC tags with exifr
    const parsed = await exifr.parse(fileOrBlob, {
      tiff: true,
      exif: true,
      gps: true,
      jfif: true,
      iptc: true,
      xmp: true,
      reviveValues: true,
    });

    if (parsed) {
      rawDetails = parsed;

      if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
        gpsInfo = {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          altitude: parsed.altitude,
        };
      }
    }
  } catch (err) {
    console.warn('Exif parsing failed or not present:', err);
  }

  // Assess privacy risks
  const riskReasons: string[] = [];
  let riskLevel: 'high' | 'medium' | 'low' = 'low';

  if (gpsInfo) {
    riskLevel = 'high';
    riskReasons.push(
      `包含高精度 GPS 定位信息 (${gpsInfo.latitude.toFixed(5)}°, ${gpsInfo.longitude.toFixed(5)}°)，极易泄露家庭或工作住址`
    );
  }

  if (rawDetails.DateTimeOriginal || rawDetails.CreateDate) {
    if (riskLevel !== 'high') riskLevel = 'medium';
    riskReasons.push(`包含精确拍摄时间戳 (${rawDetails.DateTimeOriginal || rawDetails.CreateDate})`);
  }

  if (rawDetails.Make || rawDetails.Model) {
    if (riskLevel !== 'high') riskLevel = 'medium';
    riskReasons.push(`包含设备硬件型号 (${rawDetails.Make || ''} ${rawDetails.Model || ''})`);
  }

  if (rawDetails.SerialNumber || rawDetails.InternalSerialNumber) {
    riskLevel = 'high';
    riskReasons.push('包含设备独立出厂硬件序列号');
  }

  if (riskReasons.length === 0) {
    riskReasons.push('未检测到敏感 EXIF 定位与设备信息，当前较为安全');
  }

  return {
    fileName,
    fileSize,
    fileType,
    hasGps: !!gpsInfo,
    gps: gpsInfo,
    camera: {
      make: rawDetails.Make,
      model: rawDetails.Model,
      lensModel: rawDetails.LensModel,
      software: rawDetails.Software,
    },
    timing: {
      dateTimeOriginal: rawDetails.DateTimeOriginal?.toString(),
      dateTimeDigitized: rawDetails.DateTimeDigitized?.toString(),
      offsetTime: rawDetails.OffsetTime?.toString(),
    },
    exposure: {
      iso: rawDetails.ISO,
      fNumber: rawDetails.FNumber,
      exposureTime: rawDetails.ExposureTime ? `1/${Math.round(1 / rawDetails.ExposureTime)}s` : undefined,
      focalLength: rawDetails.FocalLength ? `${rawDetails.FocalLength}mm` : undefined,
      flash: rawDetails.Flash,
    },
    rawDetails,
    riskLevel,
    riskReasons,
  };
}

/**
 * Strip all EXIF metadata by re-encoding image through Canvas
 */
export async function stripExifMetadata(
  imageSource: string | HTMLImageElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality: number = 0.95
): Promise<{ cleanBlob: Blob; cleanDataUrl: string }> {
  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0);

  const cleanBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      format,
      format === 'image/png' ? undefined : quality
    );
  });

  const cleanDataUrl = canvas.toDataURL(format, format === 'image/png' ? undefined : quality);
  return { cleanBlob, cleanDataUrl };
}
