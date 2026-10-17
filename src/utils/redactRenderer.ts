import { RedactItem } from '@/types/privacyTools';

/**
 * Apply mosaic pixelation effect to a rectangular region
 */
export function applyMosaicToRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  blockSize: number = 14
) {
  if (width <= 0 || height <= 0) return;

  const rx = Math.max(0, Math.floor(x));
  const ry = Math.max(0, Math.floor(y));
  const rw = Math.min(ctx.canvas.width - rx, Math.ceil(width));
  const rh = Math.min(ctx.canvas.height - ry, Math.ceil(height));

  if (rw <= 0 || rh <= 0) return;

  const imgData = ctx.getImageData(rx, ry, rw, rh);
  const data = imgData.data;

  for (let by = 0; by < rh; by += blockSize) {
    for (let bx = 0; bx < rw; bx += blockSize) {
      const curW = Math.min(blockSize, rw - bx);
      const curH = Math.min(blockSize, rh - by);

      // Sample center or first pixel
      const sampleX = bx + Math.floor(curW / 2);
      const sampleY = by + Math.floor(curH / 2);
      const sampleIdx = (sampleY * rw + sampleX) * 4;

      const r = data[sampleIdx];
      const g = data[sampleIdx + 1];
      const b = data[sampleIdx + 2];
      const a = data[sampleIdx + 3];

      for (let dy = 0; dy < curH; dy++) {
        for (let dx = 0; dx < curW; dx++) {
          const idx = ((by + dy) * rw + (bx + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  ctx.putImageData(imgData, rx, ry);
}

/**
 * Render all redact items onto canvas on top of base image
 */
export function renderRedactions(
  ctx: CanvasRenderingContext2D,
  baseImage: HTMLImageElement | HTMLCanvasElement,
  redacts: RedactItem[]
) {
  const { width, height } = ctx.canvas;

  // Clear and draw original
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(baseImage, 0, 0, width, height);

  for (const item of redacts) {
    ctx.save();

    if (item.shape === 'rect') {
      const x = Math.min(item.x, item.x + item.width);
      const y = Math.min(item.y, item.y + item.height);
      const w = Math.abs(item.width);
      const h = Math.abs(item.height);

      if (w <= 0 || h <= 0) {
        ctx.restore();
        continue;
      }

      if (item.style === 'solid') {
        ctx.fillStyle = item.solidColor || '#000000';
        ctx.fillRect(x, y, w, h);
      } else if (item.style === 'mosaic') {
        applyMosaicToRect(ctx, x, y, w, h, item.mosaicSize || 16);
      } else if (item.style === 'blur') {
        // High quality clipped hardware blur
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.filter = `blur(${item.blurRadius || 14}px)`;
        ctx.drawImage(baseImage, 0, 0, width, height);
      }
    } else if (item.shape === 'brush' && item.points && item.points.length > 0) {
      const radius = item.brushRadius || 24;

      if (item.style === 'solid') {
        ctx.strokeStyle = item.solidColor || '#000000';
        ctx.fillStyle = item.solidColor || '#000000';
        ctx.lineWidth = radius;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        item.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else {
        // Clip along the brush path, then apply blur or mosaic
        ctx.beginPath();
        item.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.lineWidth = radius;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Approximate stroke into path by clipping stroke
        // Note: Canvas stroke clip can be done with fill stroke
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.filter = item.style === 'blur' ? `blur(${item.blurRadius || 14}px)` : 'none';

        // For blur brush, we clip and draw base image blurred
        // Calculate bounding box of brush points
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        item.points.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
        minX -= radius;
        minY -= radius;
        maxX += radius;
        maxY += radius;

        if (item.style === 'blur') {
          // Offscreen mask approach
          const offCanvas = document.createElement('canvas');
          offCanvas.width = width;
          offCanvas.height = height;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.lineWidth = radius;
            offCtx.lineCap = 'round';
            offCtx.lineJoin = 'round';
            offCtx.strokeStyle = '#fff';
            offCtx.beginPath();
            item.points.forEach((p, idx) => {
              if (idx === 0) offCtx.moveTo(p.x, p.y);
              else offCtx.lineTo(p.x, p.y);
            });
            offCtx.stroke();

            // Destination-in with blurred base
            const blurCanvas = document.createElement('canvas');
            blurCanvas.width = width;
            blurCanvas.height = height;
            const blurCtx = blurCanvas.getContext('2d');
            if (blurCtx) {
              blurCtx.filter = `blur(${item.blurRadius || 14}px)`;
              blurCtx.drawImage(baseImage, 0, 0, width, height);
              blurCtx.globalCompositeOperation = 'destination-in';
              blurCtx.drawImage(offCanvas, 0, 0);

              ctx.drawImage(blurCanvas, 0, 0);
            }
          }
        } else if (item.style === 'mosaic') {
          applyMosaicToRect(ctx, minX, minY, maxX - minX, maxY - minY, item.mosaicSize || 16);
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }
}
