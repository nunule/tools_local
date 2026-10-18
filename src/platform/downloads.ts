export const DESKTOP_TARGETS = ['macos-arm64', 'macos-x64', 'windows-x64', 'linux-x64'] as const;
export type DesktopTarget = typeof DESKTOP_TARGETS[number];
export interface DesktopRelease {
  target: DesktopTarget;
  filename: string;
  version: string;
  size: number;
  sha256: string;
}
export interface DesktopManifest { schemaVersion: 1; version: string; releases: DesktopRelease[] }

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
      !Number.isSafeInteger(release.size) || release.size <= 0 || !/^[a-f0-9]{64}$/.test(release.sha256)) {
      throw new Error('Invalid desktop release');
    }
    seen.add(release.target);
  }
  return manifest;
}

export async function loadDesktopManifest(signal?: AbortSignal): Promise<DesktopManifest> {
  const response = await fetch(`${DOWNLOAD_ROOT}manifest.json`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Desktop downloads unavailable (${response.status})`);
  return parseDesktopManifest(await response.json());
}

export function desktopDownloadUrl(release: DesktopRelease): string {
  return `${DOWNLOAD_ROOT}${encodeURIComponent(release.filename)}`;
}

export function detectDesktopOS(userAgent: string): 'macos' | 'windows' | 'linux' | null {
  // Mobile user agents sometimes include "Mac OS X" or "Linux".
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return null;
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macos';
  if (/Windows/i.test(userAgent)) return 'windows';
  if (/Linux/i.test(userAgent)) return 'linux';
  return null;
}
