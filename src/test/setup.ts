import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Canvas 2D context for JSDOM
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
  if (contextId === '2d') {
    return {
      canvas: { width: 800, height: 600 },
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(400 * 400 * 4),
        width: 400,
        height: 400,
      }),
      putImageData: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      clip: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      strokeRect: vi.fn(),
      strokeText: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 60 }),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    };
  }
  return null;
}) as any;
