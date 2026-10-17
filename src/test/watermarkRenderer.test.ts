import { describe, it, expect } from 'vitest';
import { 
  resolveWatermarkText, 
  formatFileSize 
} from '@/utils/watermarkRenderer';
import { getExportFilename } from '@/utils/batchExporter';

describe('Watermark Renderer & Export Utilities', () => {
  it('should correctly replace macro placeholders in watermark text', () => {
    const template = 'CONFIDENTIAL {{date}} {{filename}}';
    const resolved = resolveWatermarkText(template, { filename: 'my_id_card.png' });

    expect(resolved).toContain('CONFIDENTIAL');
    expect(resolved).toContain('my_id_card');
    expect(resolved).not.toContain('{{filename}}');
    expect(resolved).not.toContain('{{date}}');
  });

  it('should format bytes to human readable string', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('should generate target export filename based on pattern and format', () => {
    const pngName = getExportFilename('id_card.jpg', '{name}_watermarked', 'image/png');
    expect(pngName).toBe('id_card_watermarked.png');

    const webpName = getExportFilename('photo.png', 'secure_{name}', 'image/webp');
    expect(webpName).toBe('secure_photo.webp');
  });
});
