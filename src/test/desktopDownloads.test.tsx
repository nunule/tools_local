import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DesktopDownloadModal } from '@/components/desktop/DesktopDownloadModal';
import { desktopDownloadUrl, detectDesktopOS, identifyGitHubInstaller, loadDesktopManifest, parseDesktopManifest, parseGitHubRelease } from '@/platform/downloads';
import { GITHUB_RELEASE_API_URL, GITHUB_RELEASES_URL, GITHUB_URL } from '@/constants/projectLinks';
import { useI18nStore } from '@/i18n';

const manifest = {
  schemaVersion: 1, version: '1.0.0',
  releases: [{ target: 'macos-arm64', filename: 'tools-local-1.0.0-macos-arm64-abc.dmg', version: '1.0.0', size: 2651222, sha256: 'a'.repeat(64) }],
};
const emptyManifest = { ...manifest, releases: [] };
const published = {
  tag_name: 'desktop-v1.1.0', draft: false, prerelease: false,
  assets: [
    { name: 'tools-local-1.1.0-macos-arm64-0123456789ab.dmg', size: 2651222, state: 'uploaded', digest: `sha256:${'b'.repeat(64)}` },
    { name: 'tools local_1.1.0_x64-setup.exe', size: 4000000, state: 'uploaded' },
  ],
};
const jsonResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const installMock = (local: unknown = manifest, github: unknown = null) => {
  const fetch = vi.fn().mockImplementation(async (url: string) => url === GITHUB_RELEASE_API_URL
    ? github ? jsonResponse(github) : { ok: false, status: 404 }
    : jsonResponse(local));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

beforeEach(() => { useI18nStore.getState().setLanguage('zh'); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('desktop download sources', () => {
  it('detects desktop OS without guessing architecture or matching mobile devices', () => {
    expect(detectDesktopOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('macos');
    expect(detectDesktopOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(detectDesktopOS('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile')).toBeNull();
    expect(detectDesktopOS('Mozilla/5.0 (Linux; Android 14)')).toBeNull();
  });
  it('rejects local manifest paths, remote URL injection, duplicate targets and mismatched types', () => {
    const release = manifest.releases[0];
    expect(parseDesktopManifest(manifest).releases).toHaveLength(1);
    for (const filename of ['../private.dmg', 'https://example.com/file.dmg', 'installer.exe']) {
      expect(() => parseDesktopManifest({ ...manifest, releases: [{ ...release, filename }] })).toThrow();
    }
    expect(() => parseDesktopManifest({ ...manifest, releases: [release, release] })).toThrow();
    expect(() => parseDesktopManifest({ ...manifest, releases: [{ ...release, version: '0.9.0' }] })).toThrow();
    expect(() => parseDesktopManifest({ ...manifest, releases: [{ ...release, url: 'https://example.com/file.dmg' }] })).toThrow();
  });
  it('recognizes staged and raw Tauri filenames, excluding temporary images and other versions', () => {
    expect(identifyGitHubInstaller(published.assets[0].name, '1.1.0')).toBe('macos-arm64');
    expect(identifyGitHubInstaller('tools-local-1.1.0-windows-x64.exe', '1.1.0')).toBe('windows-x64');
    expect(identifyGitHubInstaller(published.assets[1].name, '1.1.0')).toBe('windows-x64');
    expect(identifyGitHubInstaller('tools local_1.1.0_x64.dmg', '1.1.0')).toBe('macos-x64');
    expect(identifyGitHubInstaller('tools-local_1.1.0_amd64.AppImage', '1.1.0')).toBe('linux-x64');
    for (const filename of ['rw.123.tools local_1.1.0_aarch64.dmg', 'tools local_1.0.0_aarch64.dmg', '../tools local_1.1.0_aarch64.dmg', 'source-code.zip']) {
      expect(identifyGitHubInstaller(filename, '1.1.0')).toBeNull();
    }
  });
  it('uses real uploaded GitHub assets and canonical URLs while allowing older assets without digests', () => {
    const parsed = parseGitHubRelease(published);
    expect(parsed.version).toBe('1.1.0');
    expect(parsed.releases).toHaveLength(2);
    expect(parsed.releases[0].sha256).toBe('b'.repeat(64));
    expect(parsed.releases[1].sha256).toBeUndefined();
    expect(desktopDownloadUrl(parsed.releases[1])).toBe(`${GITHUB_URL}/releases/download/desktop-v1.1.0/tools%20local_1.1.0_x64-setup.exe`);
  });
  it('rejects drafts and prereleases, and ignores unfinished, zero-byte or unrelated assets', () => {
    expect(() => parseGitHubRelease({ ...published, draft: true })).toThrow();
    expect(() => parseGitHubRelease({ ...published, prerelease: true })).toThrow();
    const parsed = parseGitHubRelease({ ...published, assets: [
      { ...published.assets[0], state: 'new' }, { ...published.assets[1], size: 0 },
      { ...published.assets[0], name: 'rw.12.tools local_1.1.0_aarch64.dmg' },
    ] });
    expect(parsed.releases).toHaveLength(0);
  });
  it('prefers the published GitHub version over an older local build', async () => {
    installMock(manifest, published);
    const result = await loadDesktopManifest();
    expect(result.version).toBe('1.1.0');
    expect(result.githubStatus).toBe('published');
    expect(result.releases.every((release) => release.url?.startsWith(GITHUB_URL))).toBe(true);
  });
  it('falls back to local installers when no public GitHub release exists', async () => {
    installMock();
    const result = await loadDesktopManifest();
    expect(result.githubStatus).toBe('not-published');
    expect(desktopDownloadUrl(result.releases[0])).toBe(`/downloads/${manifest.releases[0].filename}`);
  });
  it('distinguishes a GitHub rate limit from an unpublished release', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url === GITHUB_RELEASE_API_URL
      ? { ok: false, status: 403 } : jsonResponse(emptyManifest)));
    expect((await loadDesktopManifest()).githubStatus).toBe('unavailable');
  });
  it('cancels both lookups when the dialog is closed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    })));
    const controller = new AbortController();
    const pending = loadDesktopManifest(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('uses local installers if GitHub stops responding', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url, { signal }) => url !== GITHUB_RELEASE_API_URL
      ? Promise.resolve(jsonResponse(manifest))
      : new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }))));
    const pending = loadDesktopManifest();
    await vi.advanceTimersByTimeAsync(6000);
    expect((await pending).releases).toHaveLength(1);
  });
});

it('offers a real local installer, preserves the Releases link, and closes on Escape', async () => {
  installMock();
  const onClose = vi.fn();
  render(<DesktopDownloadModal isOpen onClose={onClose} />);
  const link = await screen.findByRole('link', { name: '下载安装包 · macOS · Apple Silicon' });
  expect(link).toHaveAttribute('href', `/downloads/${manifest.releases[0].filename}`);
  expect(link).toHaveAttribute('download', manifest.releases[0].filename);
  expect(screen.getByRole('link', { name: /前往 GitHub 下载/ })).toHaveAttribute('href', GITHUB_RELEASES_URL);
  expect(screen.getAllByText('暂未发布')).toHaveLength(3);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }));
  expect(onClose).toHaveBeenCalledOnce();
});

it('shows direct published installers even when the website contains no local binaries', async () => {
  installMock(emptyManifest, published);
  render(<DesktopDownloadModal isOpen onClose={() => {}} />);
  const link = await screen.findByRole('link', { name: '下载安装包 · Windows' });
  expect(link).toHaveAttribute('href', `${GITHUB_URL}/releases/download/desktop-v1.1.0/tools%20local_1.1.0_x64-setup.exe`);
  expect(link).toHaveAttribute('target', '_blank');
  expect(screen.getByText('v1.1.0')).toBeInTheDocument();
});

it('explains the first release has not been published and links to its Releases page', async () => {
  installMock(emptyManifest);
  render(<DesktopDownloadModal isOpen onClose={() => {}} />);
  expect(await screen.findByText(/首个桌面安装包尚未公开发布/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /下载安装包/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /前往 GitHub 下载/ })).toHaveAttribute('href', GITHUB_RELEASES_URL);
});

it('keeps Releases accessible on lookup failure and supports retry', async () => {
  let offline = true;
  const fetch = vi.fn().mockImplementation(async (url: string) => {
    if (offline) throw new Error('offline');
    return url === GITHUB_RELEASE_API_URL ? { ok: false, status: 404 } : jsonResponse(manifest);
  });
  vi.stubGlobal('fetch', fetch);
  render(<DesktopDownloadModal isOpen onClose={() => {}} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('暂时无法获取下载信息');
  expect(screen.getByRole('link', { name: /前往 GitHub 下载/ })).toHaveAttribute('href', GITHUB_RELEASES_URL);
  offline = false;
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  expect(await screen.findByRole('link', { name: '下载安装包 · macOS · Apple Silicon' })).toBeInTheDocument();
});
