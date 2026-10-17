import { IDCopyConfig } from '@/types/privacyTools';

/**
 * Generate certified safe ID document copy with custom purpose watermarks,
 * sensitive field redactions, and optional A4 / double-sided layout.
 */
export async function renderIDCertifiedCopy(
  frontImage: HTMLImageElement,
  backImage: HTMLImageElement | null,
  config: IDCopyConfig
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');

  if (config.layout === 'a4-sheet' && backImage) {
    // Standard A4 paper proportions (1240 x 1754 px at ~150 DPI)
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d')!;

    // Clean white paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header notice on A4 copy
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('【证件安全核验副本 · 仅供指定机构审核使用】', canvas.width / 2, 80);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 14px -apple-system, sans-serif';
    ctx.fillText(`业务用途：${config.purpose || '业务审核'} | 机构：${config.issuerOrg || '指定办理单位'}`, canvas.width / 2, 115);

    // Standard card size on A4 (width: ~680px, height: ~430px, aspect ratio 85.6:54)
    const cardW = 680;
    const cardH = 430;

    // Draw Front
    const frontY = 200;
    const frontX = (canvas.width - cardW) / 2;
    drawCardWithDecorations(ctx, frontImage, frontX, frontY, cardW, cardH, config, 'front');

    // Draw Back
    const backY = 700;
    const backX = (canvas.width - cardW) / 2;
    drawCardWithDecorations(ctx, backImage, backX, backY, cardW, cardH, config, 'back');

    // Footer notice
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px -apple-system, sans-serif';
    ctx.fillText('注：本副本由持证人通过端侧安全脱敏生成，任何私自涂改、倒卖或用于其他非法用途均属违法。', canvas.width / 2, 1200);

    return canvas;
  } else if (config.layout === 'side-by-side' && backImage) {
    // Side by side cards
    const cardW = 850;
    const cardH = 540;
    canvas.width = cardW * 2 + 100;
    canvas.height = cardH + 120;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCardWithDecorations(ctx, frontImage, 40, 60, cardW, cardH, config, 'front');
    drawCardWithDecorations(ctx, backImage, cardW + 60, 60, cardW, cardH, config, 'back');

    return canvas;
  } else {
    // Single card mode
    canvas.width = frontImage.width;
    canvas.height = frontImage.height;
    const ctx = canvas.getContext('2d')!;

    drawCardWithDecorations(ctx, frontImage, 0, 0, canvas.width, canvas.height, config, 'front');
    return canvas;
  }
}

/**
 * Draw single card with sensitive field redactions and security purpose watermarks
 */
function drawCardWithDecorations(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  config: IDCopyConfig,
  side: 'front' | 'back'
) {
  ctx.save();

  // Shadow and border for card representation
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();

  // Card outline
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // 1. Sensitive Field Redaction Bars
  if (side === 'front') {
    // Mask ID Number Suffix (Usually bottom area of Chinese ID card)
    if (config.maskIdSuffix) {
      ctx.fillStyle = '#0f172a';
      // Approximate ID number bottom right zone (last 4 to 6 chars)
      const idMaskW = w * 0.22;
      const idMaskH = h * 0.08;
      const idMaskX = x + w * 0.65;
      const idMaskY = y + h * 0.82;
      ctx.fillRect(idMaskX, idMaskY, idMaskW, idMaskH);

      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(10, Math.round(idMaskH * 0.45))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('隐私脱敏', idMaskX + idMaskW / 2, idMaskY + idMaskH / 2);
    }

    // Mask detailed address (Usually middle left zone of Chinese ID card)
    if (config.maskAddressDetail) {
      ctx.fillStyle = '#0f172a';
      const addrMaskW = w * 0.32;
      const addrMaskH = h * 0.07;
      const addrMaskX = x + w * 0.28;
      const addrMaskY = y + h * 0.64;
      ctx.fillRect(addrMaskX, addrMaskY, addrMaskW, addrMaskH);

      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(10, Math.round(addrMaskH * 0.45))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('门牌号已隐去', addrMaskX + addrMaskW / 2, addrMaskY + addrMaskH / 2);
    }

    // Mask birth date
    if (config.maskBirthDate) {
      ctx.fillStyle = '#0f172a';
      const birthMaskW = w * 0.26;
      const birthMaskH = h * 0.07;
      const birthMaskX = x + w * 0.28;
      const birthMaskY = y + h * 0.44;
      ctx.fillRect(birthMaskX, birthMaskY, birthMaskW, birthMaskH);

      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(10, Math.round(birthMaskH * 0.45))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('出生日期已脱敏', birthMaskX + birthMaskW / 2, birthMaskY + birthMaskH / 2);
    }
  }

  // 2. High Security Purpose Anti-Fraud Watermark
  const purpose = config.purpose || '业务核验办理';
  const org = config.issuerOrg ? `(${config.issuerOrg})` : '';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const expireDate = new Date(now.getTime() + config.validDays * 24 * 3600 * 1000).toISOString().split('T')[0];

  const watermarkLines = [
    `仅供 ${purpose} ${org} 使用`,
    `有效期：${dateStr} 至 ${expireDate}`,
    '他用无效 · 再次复印无效'
  ];

  ctx.save();
  ctx.globalAlpha = Math.max(0.15, Math.min(0.9, config.watermarkOpacity / 100));

  // Center watermark on card rotated by angle
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate((config.watermarkAngle * Math.PI) / 180);

  const fontSize = Math.max(14, Math.round(w * 0.04));
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineSpacing = fontSize * 1.5;
  const totalH = (watermarkLines.length - 1) * lineSpacing;
  const startY = -totalH / 2;

  watermarkLines.forEach((line, idx) => {
    const curY = startY + idx * lineSpacing;

    // Stroke outline for contrast against both dark text & light background
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeText(line, 0, curY);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, 0, curY);
  });

  ctx.restore();

  ctx.restore();
}
