import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function filesIn(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(file) : entry.isFile() ? [file] : [];
    }));
    return files.flat();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export function identifyInstaller(filename, version) {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Tauri may leave rw.PID.*.dmg intermediates after an interrupted build.
  // Match the complete product filename, never just its version/architecture suffix.
  const product = '^(?:tools local|tools[-_]local)';
  const patterns = [
    ['macos-arm64', new RegExp(`${product}_${escapedVersion}_aarch64\\.dmg$`, 'i'), 'dmg'],
    ['macos-x64', new RegExp(`${product}_${escapedVersion}_(?:x64|x86_64)\\.dmg$`, 'i'), 'dmg'],
    ['windows-x64', new RegExp(`${product}_${escapedVersion}_x64-setup\\.exe$`, 'i'), 'exe'],
    ['linux-x64', new RegExp(`${product}_${escapedVersion}_(?:amd64|x86_64)\\.AppImage$`, 'i'), 'AppImage'],
  ];
  const match = patterns.find(([, pattern]) => pattern.test(filename));
  return match ? { target: match[0], extension: match[2] } : null;
}

// Only publish files from an actual native build of the current application version.
export async function prepareDesktopDownloads({ sourceDirs, destination, version, contentAddressed = true }) {
  const sources = (await Promise.all(sourceDirs.map(async (directory) => (await filesIn(directory)).sort()))).flat();
  const selected = new Map();
  for (const file of sources) {
    const installer = identifyInstaller(path.basename(file), version);
    if (installer) selected.set(installer.target, { ...installer, file });
  }
  await mkdir(destination, { recursive: true });
  const releases = [];
  for (const { target, extension, file } of selected.values()) {
    const bytes = await readFile(file);
    if (bytes.length === 0) throw new Error(`Installer is empty: ${file}`);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    // Hash website files for caching; keep draft Release asset names stable for re-runs.
    const filename = `tools-local-${version}-${target}${contentAddressed ? `-${sha256.slice(0, 12)}` : ''}.${extension}`;
    const output = path.join(destination, filename);
    const existing = await stat(output).catch(() => null);
    if (!contentAddressed || !existing || existing.size !== bytes.length) await cp(file, output);
    releases.push({ target, filename, version, size: bytes.length, sha256 });
  }
  releases.sort((a, b) => a.target.localeCompare(b.target));
  const manifest = { schemaVersion: 1, version, releases };
  const content = JSON.stringify(manifest, null, 2) + '\n';
  const manifestPath = path.join(destination, 'manifest.json');
  const previous = await readFile(manifestPath, 'utf8').catch(() => null);
  if (previous !== content) await writeFile(manifestPath, content);
  const keep = new Set(['manifest.json', ...releases.map((release) => release.filename)]);
  for (const entry of await readdir(destination, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.startsWith('tools-local-') && !keep.has(entry.name)) {
      await rm(path.join(destination, entry.name));
    }
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(await readFile(path.join(root, 'src-tauri/tauri.conf.json'), 'utf8'));
  const manifest = await prepareDesktopDownloads({
    sourceDirs: [path.join(root, 'src-tauri/target/release/bundle'), path.join(root, 'desktop-releases')],
    destination: path.join(root, 'public/downloads'),
    version: config.version,
    contentAddressed: !process.argv.includes('--github-release'),
  });
  console.log(`Desktop downloads: ${manifest.releases.length} installer(s) available for v${manifest.version}`);
}
