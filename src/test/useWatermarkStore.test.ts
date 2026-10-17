import { describe, it, expect, beforeEach } from 'vitest';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { WATERMARK_PRESETS } from '@/constants/presets';

describe('Zustand 5 Watermark Store', () => {
  beforeEach(() => {
    useWatermarkStore.getState().resetConfig();
    useWatermarkStore.getState().clearAllImages();
  });

  it('should initialize with default watermark config', () => {
    const state = useWatermarkStore.getState();
    expect(state.config.mode).toBe('tile');
    expect(state.config.color).toBe('#ffffff');
    expect(state.config.opacity).toBeGreaterThan(0);
    expect(state.images).toHaveLength(0);
  });

  it('should update config properly', () => {
    useWatermarkStore.getState().updateConfig({
      fontSize: 48,
      rotate: 45,
      mode: 'single'
    });

    const state = useWatermarkStore.getState();
    expect(state.config.fontSize).toBe(48);
    expect(state.config.rotate).toBe(45);
    expect(state.config.mode).toBe('single');
  });

  it('should apply watermark preset templates', () => {
    const preset = WATERMARK_PRESETS[0];
    useWatermarkStore.getState().applyPreset(preset);

    const state = useWatermarkStore.getState();
    expect(state.config.text).toBe(preset.config.text);
    expect(state.config.mode).toBe(preset.config.mode);
  });

  it('should add and remove images in queue', () => {
    useWatermarkStore.getState().addImages([
      {
        name: 'test_doc.png',
        size: 2048,
        type: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        width: 100,
        height: 100
      }
    ]);

    let state = useWatermarkStore.getState();
    expect(state.images).toHaveLength(1);
    expect(state.activeImageId).toBeTruthy();

    const imgId = state.images[0].id;
    useWatermarkStore.getState().removeImage(imgId);

    state = useWatermarkStore.getState();
    expect(state.images).toHaveLength(0);
    expect(state.activeImageId).toBeNull();
  });
});
