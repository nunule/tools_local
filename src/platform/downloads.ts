import { GITHUB_URL, GITHUB_RELEASE_API_URL } from '@/constants/projectLinks';

export const DESKTOP_TARGETS = ['macos-arm64', 'macos-x64', 'windows-x64', 'linux-x64'] as const;
export type DesktopTarget = typeof DESKTOP_TARGETS[number];
export interface DesktopRelease {
  target: DesktopTarget;
  filename: string;
  version: string;
  size: number;
  sha256?: string;
  url?: string;
}
export interface DesktopManifest {
  schemaVersion: 1;
  version: string;
  releases: DesktopRelease[];
  githubStatus?: 'published' | 'not-published' | 'unavailable';
}

const DOWNLOAD_ROOT = `${import.meta.env.BASE_URL}downloads/`;
const extensions: Record<DesktopTarget, string> = {
  'macos-arm64': '.dmg', 'macos-x64': '.dmg', 'windows-x64': '.exe', 'linux-x64': '.AppImage',
};

export function parseDesktopManifest(value: unknown): DesktopManifest {
  if (!value || typeof value !== 'object') throw new Error('Invalid desktop manifest');
  const manifest = value as DesktopManifest;
  if (manifest.schemaVersion !== 1 || typeof manifest.version !== 'string' || !Array.isArray(manifest.releases)) {
    throw new Error('Invalid desktop manifest');
  }
  const seen = new Set<DesktopTarget>();
  for (const release of manifest.releases) {
    if (!release || !DESKTOP_TARGETS.includes(release.target) || seen.has(release.target) ||
      release.version !== manifest.version || typeof release.filename !== 'string' ||
      !/^[\w.-]+$/.test(release.filename) || !release.filename.endsWith(extensions[release.target]) ||
      !Number.isSafeInteger(release.size) || release.size <= 0 || typeof release.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(release.sha256) || release.url !== undefined) {
      throw new Error('Invalid desktop release');
    }
    seen.add(release.target);
  }
  return manifest;
}

export function identifyGitHubInstaller(filename: string, version: string): DesktopTarget | null {
  if (!/^[\w .-]+$/.test(filename)) return null;
  const escapedVersion = version.replace(/\./g, '\\.');
  for (const target of DESKTOP_TARGETS) {
    const extension = extensions[target].replace('.', '\\.');
    if (new RegExp(`^tools-local-${escapedVersion}-${target}(?:-[a-f0-9]{12})?${extension}$`, 'i').test(filename)) return target;
  }
  const product = '^(?:tools local|tools[-_]local)';
  const legacyNames: [DesktopTarget, string][] = [
    ['macos-arm64', '_aarch64\\.dmg'],
    ['macos-x64', '_(?:x64|x86_64)\\.dmg'],
    ['windows-x64', '_x64-setup\\.exe'],
    ['linux-x64', '_(?:amd64|x86_64)\\.AppImage'],
  ];
  return legacyNames.find(([, suffix]) => new RegExp(`${product}_${escapedVersion}${suffix}$`, 'i').test(filename))?.[0] ?? null;
}

export function parseGitHubRelease(value: unknown): DesktopManifest {
  if (!value || typeof value !== 'object') throw new Error('Invalid GitHub release');
  const release = value as { tag_name: string; draft: boolean; prerelease: boolean; assets: unknown[] };
  const version = typeof release.tag_name === 'string' && /^(?:desktop-v|v)?(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1];
  if (!version || release.draft !== false || release.prerelease !== false || !Array.isArray(release.assets)) {
    throw new Error('No published desktop release');
  }
  const selected = new Map<DesktopTarget, DesktopRelease>();
  for (const item of release.assets) {
    if (!item || typeof item !== 'object') continue;
    const asset = item as { name: string; size: number; state: string; digest?: string };
    if (typeof asset.name !== 'string' || asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0) continue;
    const target = identifyGitHubInstaller(asset.name, version);
    if (!target) continue;
    // Prefer our staged asset over a second raw Tauri filename for the same target.
    if (selected.has(target) && !asset.name.startsWith(`tools-local-${version}-`)) continue;
    selected.set(target, {
      target, filename: asset.name, version, size: asset.size,
      sha256: typeof asset.digest === 'string' && /^sha256:[a-f0-9]{64}$/.test(asset.digest) ? asset.digest.slice(7) : undefined,
      url: `${GITHUB_URL}/releases/download/${encodeURIComponent(release.tag_name)}/${encodeURIComponent(asset.name)}`,
    });
  }
  return { schemaVersion: 1, version, releases: [...selected.values()], githubStatus: 'published' };
}

async function fetchDownloadInfo(url: string, signal?: AbortSignal): Promise<{ status: number; ok: boolean; body: unknown }> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 6000);
  try {
    const response = await fetch(url, { cache: 'no-cache', credentials: 'same-origin', referrerPolicy: 'no-referrer', signal: controller.signal });
    return { status: response.status, ok: response.ok, body: response.ok ? await response.json() : null };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function loadDesktopManifest(signal?: AbortSignal): Promise<DesktopManifest> {
  const [github, local] = await Promise.allSettled([
    (async () => {
      const response = await fetchDownloadInfo(GITHUB_RELEASE_API_URL, signal);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`GitHub downloads unavailable (${response.status})`);
      return parseGitHubRelease(response.body);
    })(),
    (async () => {
      const response = await fetchDownloadInfo(`${DOWNLOAD_ROOT}manifest.json`, signal);
      if (!response.ok) throw new Error(`Local downloads unavailable (${response.status})`);
      return parseDesktopManifest(response.body);
    })(),
  ]);
  if (signal?.aborted) throw new DOMException('Download lookup cancelled', 'AbortError');
  if (github.status === 'fulfilled' && github.value) return github.value;
  if (local.status === 'fulfilled') {
    return { ...local.value, githubStatus: github.status === 'fulfilled' ? 'not-published' : 'unavailable' };
  }
  throw new Error('Desktop downloads unavailable');
}

export function desktopDownloadUrl(release: DesktopRelease): string {
  return release.url ?? `${DOWNLOAD_ROOT}${encodeURIComponent(release.filename)}`;
}

export function detectDesktopOS(userAgent: string): 'macos' | 'windows' | 'linux' | null {
  // Mobile user agents sometimes include "Mac OS X" or "Linux".
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return null;
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macos';
  if (/Windows/i.test(userAgent)) return 'windows';
  if (/Linux/i.test(userAgent)) return 'linux';
  return null;
}
