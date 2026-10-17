import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveBlob } from '@/platform/files';

const native = vi.hoisted(() => ({
  isTauri: vi.fn(),
  save: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({ isTauri: native.isTauri }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ save: native.save }));
vi.mock('@tauri-apps/plugin-fs', () => ({ writeFile: native.writeFile }));

const makeBlob = (type = 'image/png') =>
  new NodeBlob([new Uint8Array([0, 127, 255])], { type }) as unknown as Blob;

describe('desktop and browser exports', () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    native.isTauri.mockReturnValue(false);
    native.save.mockResolvedValue(null);
    native.writeFile.mockResolvedValue(undefined);
    createObjectURL.mockReturnValue('blob:export');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps browser downloads and releases the temporary URL after the click', async () => {
    let clickedLink: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedLink = this;
    });

    expect(await saveBlob(makeBlob(), 'photo.png')).toBe(true);
    expect(clickedLink?.download).toBe('photo.png');
    expect(clickedLink?.isConnected).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
    expect(native.save).not.toHaveBeenCalled();
  });

  it('writes the original bytes to the path selected in the native dialog', async () => {
    native.isTauri.mockReturnValue(true);
    native.save.mockResolvedValue('/chosen/photo.png');

    expect(await saveBlob(makeBlob(), 'photo.png')).toBe(true);
    expect(native.save).toHaveBeenCalledWith({
      defaultPath: 'photo.png',
      filters: [{ name: 'PNG', extensions: ['png'] }],
    });
    expect(native.writeFile).toHaveBeenCalledWith('/chosen/photo.png', new Uint8Array([0, 127, 255]));
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('treats cancellation as no save and never writes a file', async () => {
    native.isTauri.mockReturnValue(true);

    expect(await saveBlob(makeBlob(), 'photo.png')).toBe(false);
    expect(native.writeFile).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it.each(['application/json', 'application/zip'])('uses the matching native filter for %s', async (type) => {
    native.isTauri.mockReturnValue(true);
    await saveBlob(makeBlob(type), 'export');
    expect(native.save.mock.calls[0][0].filters[0].extensions).toEqual([type.split('/')[1]]);
  });

  it('uses only a file name as the dialog suggestion', async () => {
    native.isTauri.mockReturnValue(true);
    await saveBlob(makeBlob(), '..\\folder\\photo.png');
    expect(native.save.mock.calls[0][0].defaultPath).toBe('photo.png');
  });

  it('reports native write failures without falling back to an unexpected browser download', async () => {
    native.isTauri.mockReturnValue(true);
    native.save.mockResolvedValue('/chosen/photo.png');
    native.writeFile.mockRejectedValue(new Error('Disk full'));

    await expect(saveBlob(makeBlob(), 'photo.png')).rejects.toThrow('Disk full');
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
