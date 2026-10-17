import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { ImageItem, WatermarkConfig } from '@/types/watermark';
import { renderWatermarkedImage, canvasToBlob } from '@/utils/watermarkRenderer';

/**
 * Trigger browser file download from Blob
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Resolve target export file name
 */
export function getExportFilename(
  originalName: string, 
  pattern: string, 
  format: 'image/png' | 'image/jpeg' | 'image/webp'
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
  
  let formatted = pattern
    .replace('{name}', baseName)
    .replace('{ext}', ext);

  if (!formatted.toLowerCase().endsWith(`.${ext}`)) {
    formatted = `${formatted}.${ext}`;
  }

  return formatted;
}

/**
 * Load HTMLImageElement from data URL
 */
function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Export single image
 */
export async function exportSingleImage(
  imageItem: ImageItem,
  config: WatermarkConfig
): Promise<void> {
  const imgElement = await loadImageElement(imageItem.dataUrl);
  const canvas = await renderWatermarkedImage(imgElement, config, {
    scale: config.scale,
    filename: imageItem.name
  });

  const blob = await canvasToBlob(canvas, config.exportFormat, config.exportQuality);
  const filename = getExportFilename(imageItem.name, config.filenamePattern, config.exportFormat);
  
  triggerDownload(blob, filename);

  // Joyful confetti celebration
  confetti({
    particleCount: 40,
    spread: 50,
    origin: { y: 0.8 }
  });
}

/**
 * Batch export all images and package as a ZIP archive
 */
export async function exportAllImagesAsZip(
  images: ImageItem[],
  config: WatermarkConfig,
  onProgress?: (isExporting: boolean, progress: number) => void
): Promise<void> {
  if (images.length === 0) return;

  onProgress?.(true, 0);

  const zip = new JSZip();
  const folder = zip.folder('watermarked_images') || zip;

  try {
    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const imgElement = await loadImageElement(item.dataUrl);

      const canvas = await renderWatermarkedImage(imgElement, config, {
        scale: config.scale,
        filename: item.name
      });

      const blob = await canvasToBlob(canvas, config.exportFormat, config.exportQuality);
      const filename = getExportFilename(item.name, config.filenamePattern, config.exportFormat);

      folder.file(filename, blob);

      const currentProgress = Math.round(((i + 1) / images.length) * 85);
      onProgress?.(true, currentProgress);
    }

    onProgress?.(true, 90);
    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      const zipProgress = Math.round(90 + (metadata.percent / 100) * 10);
      onProgress?.(true, zipProgress);
    });

    const zipFilename = `tools_local_watermarked_${Date.now()}.zip`;
    triggerDownload(zipBlob, zipFilename);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (error) {
    console.error('Batch export failed:', error);
    alert('批量导出出错，请检查图片或内存大小');
  } finally {
    onProgress?.(false, 0);
  }
}
