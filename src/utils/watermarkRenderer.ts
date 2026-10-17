import { WatermarkConfig, SinglePosition } from '@/types/watermark';

/**
 * Replace dynamic macro tags like {{date}}, {{time}}, {{filename}}
 */
export function resolveWatermarkText(
  template: string, 
  context?: { filename?: string }
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hours}:${minutes}`;
  const rawFilename = context?.filename ? context.filename.replace(/\.[^/.]+$/, '') : 'photo';

  return template
    .replace(/\{\{date\}\}/gi, dateStr)
    .replace(/\{\{time\}\}/gi, timeStr)
    .replace(/\{\{year\}\}/gi, String(year))
    .replace(/\{\{filename\}\}/gi, rawFilename);
}

/**
 * Measure multi-line text dimensions
 */
export function measureTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  lineHeightPx: number
): { width: number; height: number; lineWidths: number[] } {
  let maxWidth = 0;
  const lineWidths: number[] = [];

  for (const line of lines) {
    const metrics = ctx.measureText(line);
    const w = metrics.width;
    lineWidths.push(w);
    if (w > maxWidth) maxWidth = w;
  }

  const height = lines.length > 0 ? (lines.length - 1) * lineHeightPx + lineHeightPx : 0;
  return { width: maxWidth, height, lineWidths };
}

/**
 * Render single multi-line text block at origin (0, 0) relative to its center
 */
function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  config: WatermarkConfig,
  lineHeightPx: number,
  totalHeight: number
) {
  const startY = -totalHeight / 2 + lineHeightPx / 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeightPx;

    // Stroke outline (drawn first so fill remains sharp on top)
    if (config.stroke.enabled && config.stroke.width > 0) {
      ctx.save();
      // Temporarily clear shadow while stroking to prevent muddy stroke shadows
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = config.stroke.width;
      ctx.strokeStyle = config.stroke.color;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(line, 0, y);
      ctx.restore();
    }

    // Shadow & Fill
    if (config.shadow.enabled && config.shadow.blur > 0) {
      ctx.shadowColor = config.shadow.color;
      ctx.shadowBlur = config.shadow.blur;
      ctx.shadowOffsetX = config.shadow.offsetX;
      ctx.shadowOffsetY = config.shadow.offsetY;
    } else {
      ctx.shadowColor = 'transparent';
    }

    ctx.fillStyle = config.color;
    ctx.fillText(line, 0, y);
  });
}

/**
 * Calculate single position anchor point
 */
function getAnchorPosition(
  pos: SinglePosition,
  canvasWidth: number,
  canvasHeight: number,
  blockWidth: number,
  blockHeight: number,
  marginX: number,
  marginY: number
): { x: number; y: number } {
  const halfW = blockWidth / 2;
  const halfH = blockHeight / 2;

  switch (pos) {
    case 'top-left':
      return { x: marginX + halfW, y: marginY + halfH };
    case 'top-center':
      return { x: canvasWidth / 2, y: marginY + halfH };
    case 'top-right':
      return { x: canvasWidth - marginX - halfW, y: marginY + halfH };
    case 'middle-left':
      return { x: marginX + halfW, y: canvasHeight / 2 };
    case 'center':
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    case 'middle-right':
      return { x: canvasWidth - marginX - halfW, y: canvasHeight / 2 };
    case 'bottom-left':
      return { x: marginX + halfW, y: canvasHeight - marginY - halfH };
    case 'bottom-center':
      return { x: canvasWidth / 2, y: canvasHeight - marginY - halfH };
    case 'bottom-right':
    default:
      return { x: canvasWidth - marginX - halfW, y: canvasHeight - marginY - halfH };
  }
}

/**
 * Master Watermark Rendering Function
 */
export async function renderWatermarkedImage(
  imageSource: HTMLImageElement | ImageBitmap,
  config: WatermarkConfig,
  options?: {
    scale?: number;
    filename?: string;
  }
): Promise<HTMLCanvasElement> {
  const scale = options?.scale ?? 1;
  const sourceWidth = imageSource.width;
  const sourceHeight = imageSource.height;

  const targetWidth = Math.round(sourceWidth * scale);
  const targetHeight = Math.round(sourceHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Unable to create 2D canvas context');
  }

  // Draw background original image with high image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

  // If text is empty or opacity is 0, return plain image
  const resolvedText = resolveWatermarkText(config.text, { filename: options?.filename });
  if (!resolvedText.trim() || config.opacity <= 0) {
    return canvas;
  }

  const lines = resolvedText.split('\n');

  // Font setup scaled to export resolution
  const scaledFontSize = Math.round(config.fontSize * scale);
  const scaledLineHeight = Math.round(scaledFontSize * config.lineHeight);

  // Setup text properties for measurement
  ctx.font = `${config.fontWeight} ${scaledFontSize}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const { width: blockWidth, height: blockHeight } = measureTextLines(ctx, lines, scaledLineHeight);

  // Set blending and alpha
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, config.opacity / 100));
  ctx.globalCompositeOperation = config.blendMode || 'source-over';

  const rad = (config.rotate * Math.PI) / 180;

  if (config.mode === 'tile') {
    // Tiled Repeated Watermark
    // Cover the full diagonal of the image to ensure seamless coverage when rotated
    const diagonal = Math.ceil(Math.sqrt(targetWidth * targetWidth + targetHeight * targetHeight));
    const stepX = Math.max(20, blockWidth + config.gapX * scale);
    const stepY = Math.max(20, blockHeight + config.gapY * scale);

    const cols = Math.ceil(diagonal / stepX) + 2;
    const rows = Math.ceil(diagonal / stepY) + 2;

    const startX = -diagonal / 2;
    const startY = -diagonal / 2;

    ctx.save();
    // Rotate relative to center of canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate(rad);

    for (let r = 0; r < rows; r++) {
      const rowY = startY + r * stepY;
      const staggerOffset = config.stagger && r % 2 === 1 ? stepX / 2 : 0;

      for (let c = 0; c < cols; c++) {
        const colX = startX + c * stepX + staggerOffset;

        ctx.save();
        ctx.translate(colX, rowY);
        drawTextBlock(ctx, lines, {
          ...config,
          stroke: {
            ...config.stroke,
            width: config.stroke.width * scale
          },
          shadow: {
            ...config.shadow,
            blur: config.shadow.blur * scale,
            offsetX: config.shadow.offsetX * scale,
            offsetY: config.shadow.offsetY * scale
          }
        }, scaledLineHeight, blockHeight);
        ctx.restore();
      }
    }

    ctx.restore();
  } else {
    // Single Position Mode
    const marginX = config.offsetX * scale;
    const marginY = config.offsetY * scale;

    const anchor = getAnchorPosition(
      config.position,
      targetWidth,
      targetHeight,
      blockWidth,
      blockHeight,
      marginX,
      marginY
    );

    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(rad);

    drawTextBlock(ctx, lines, {
      ...config,
      stroke: {
        ...config.stroke,
        width: config.stroke.width * scale
      },
      shadow: {
        ...config.shadow,
        blur: config.shadow.blur * scale,
        offsetX: config.shadow.offsetX * scale,
        offsetY: config.shadow.offsetY * scale
      }
    }, scaledLineHeight, blockHeight);

    ctx.restore();
  }

  ctx.restore();
  return canvas;
}

/**
 * Convert HTMLCanvasElement to Blob with specified format and quality
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' | 'image/webp',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob from canvas'));
        }
      },
      format,
      format === 'image/png' ? undefined : quality / 100
    );
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
