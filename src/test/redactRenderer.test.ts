import { describe, it, expect } from 'vitest';
import { applyMosaicToRect, renderRedactions } from '@/utils/redactRenderer';
import { RedactItem } from '@/types/privacyTools';

describe('Redaction & Mosaic Engine', () => {
  it('applies pixelation mosaic without errors', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 100, 100);

    expect(() => applyMosaicToRect(ctx, 10, 10, 40, 40, 8)).not.toThrow();
  });

  it('renders solid and blur redaction items onto canvas', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    const baseImg = document.createElement('canvas');
    baseImg.width = 200;
    baseImg.height = 200;

    const redacts: RedactItem[] = [
      {
        id: 'r1',
        shape: 'rect',
        style: 'solid',
        solidColor: '#000000',
        x: 10,
        y: 10,
        width: 50,
        height: 20,
      },
      {
        id: 'r2',
        shape: 'rect',
        style: 'mosaic',
        mosaicSize: 12,
        x: 80,
        y: 80,
        width: 60,
        height: 30,
      }
    ];

    expect(() => renderRedactions(ctx, baseImg, redacts)).not.toThrow();
  });
});
