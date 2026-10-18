import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DesktopDownloadModal } from '@/components/desktop/DesktopDownloadModal';
import { detectDesktopOS, parseDesktopManifest } from '@/platform/downloads';
import { useI18nStore } from '@/i18n';

const manifest = {
  schemaVersion: 1, version: '1.0.0',
  releases: [{ target: 'macos-arm64', filename: 'tools-local-1.0.0-macos-arm64-abc.dmg', version: '1.0.0', size: 2651222, sha256: 'a'.repeat(64) }],
};

beforeEach(() => {
  useI18nStore.getState().setLanguage('zh');
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('desktop download manifest', () => {
  it('keeps desktop OS detection separate from architecture, excluding mobile devices', () => {
    expect(detectDesktopOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('macos');
    expect(detectDesktopOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(detectDesktopOS('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile')).toBeNull();
    expect(detectDesktopOS('Mozilla/5.0 (Linux; Android 14)')).toBeNull();
  });
  it('rejects unsafe filenames, duplicate targets and mismatched installer types', () => {
    const release = manifest.releases[0];
    expect(parseDesktopManifest(manifest).releases).toHaveLength(1);
    for (const filename of ['../private.dmg', 'https://example.com/file.dmg', 'installer.exe']) {
      expect(() => parseDesktopManifest({ ...manifest, releases: [{ ...release, filename }] })).toThrow();
    }
    expect(() => parseDesktopManifest({ ...manifest, releases: [release, release] })).toThrow();
    expect(() => parseDesktopManifest({ ...manifest, releases: [{ ...release, version: '0.9.0' }] })).toThrow();
  });
});

it('offers only a real installer link, shows missing platforms, and closes on Escape', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manifest }));
  const onClose = vi.fn();
  render(<DesktopDownloadModal isOpen onClose={onClose} />);
  const link = await screen.findByRole('link', { name: '下载安装包 · macOS · Apple Silicon' });
  expect(link).toHaveAttribute('href', `/downloads/${manifest.releases[0].filename}`);
  expect(link).toHaveAttribute('download', manifest.releases[0].filename);
  expect(screen.getAllByText('暂未发布')).toHaveLength(3);
  expect(screen.getAllByRole('link')).toHaveLength(1);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }));
  expect(onClose).toHaveBeenCalledOnce();
});

it('lets the user retry a failed manifest request', async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, json: async () => manifest });
  vi.stubGlobal('fetch', fetch);
  render(<DesktopDownloadModal isOpen onClose={() => {}} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('暂时无法获取下载信息');
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(1));
  expect(fetch).toHaveBeenCalledTimes(2);
});
