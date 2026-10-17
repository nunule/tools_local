import { describe, it, expect } from 'vitest';
import { parsePhotoExif } from '@/utils/exifParser';

describe('EXIF Parser & Security Evaluator', () => {
  it('correctly assesses risk level when no EXIF metadata exists', async () => {
    // 1x1 png blob
    const blob = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
    const report = await parsePhotoExif(blob, 'clean_image.png');

    expect(report.fileName).toBe('clean_image.png');
    expect(report.hasGps).toBe(false);
    expect(report.riskLevel).toBe('low');
    expect(report.riskReasons[0]).toContain('未检测到敏感 EXIF');
  });
});
