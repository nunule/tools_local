import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { identifyInstaller, prepareDesktopDownloads } from './prepare-desktop-downloads.mjs';

test('recognizes native platform/architecture and rejects an outdated release', () => {
  assert.equal(identifyInstaller('tools local_1.0.0_aarch64.dmg', '1.0.0').target, 'macos-arm64');
  assert.equal(identifyInstaller('tools local_1.0.0_x64-setup.exe', '1.0.0').target, 'windows-x64');
  assert.equal(identifyInstaller('tools local_0.9.0_aarch64.dmg', '1.0.0'), null);
  assert.equal(identifyInstaller('rw.99432.tools local_1.0.0_aarch64.dmg', '1.0.0'), null);
  assert.equal(identifyInstaller('another-app_1.0.0_aarch64.dmg', '1.0.0'), null);
  assert.equal(identifyInstaller('tools local_1.0.0_arm64-setup.exe', '1.0.0'), null);
});

test('publishes the actual bytes, metadata and hash, without retaining stale installers', async () => {
  const source = await mkdtemp(path.join(os.tmpdir(), 'tools-local-release-test-'));
  const destination = path.join(source, 'published');
  try {
    const bytes = Buffer.from([0, 255, 83, 72, 0, 12]);
    await writeFile(path.join(source, 'tools local_1.0.0_aarch64.dmg'), bytes);
    await writeFile(path.join(source, 'tools local_0.9.0_x64-setup.exe'), bytes);
    await writeFile(path.join(source, 'rw.99432.tools local_1.0.0_aarch64.dmg'), Buffer.from('unfinished image'));
    const manifest = await prepareDesktopDownloads({ sourceDirs: [source], destination, version: '1.0.0' });
    assert.equal(manifest.releases.length, 1);
    const release = manifest.releases[0];
    assert.equal(release.size, bytes.length);
    assert.equal(release.sha256, createHash('sha256').update(bytes).digest('hex'));
    assert.deepEqual(await readFile(path.join(destination, release.filename)), bytes);
    assert.deepEqual(JSON.parse(await readFile(path.join(destination, 'manifest.json'), 'utf8')), manifest);
    await writeFile(path.join(destination, 'tools-local-obsolete.dmg'), bytes);
    await prepareDesktopDownloads({ sourceDirs: [], destination, version: '1.0.0' });
    assert.deepEqual(await readdir(destination), ['manifest.json']);
  } finally {
    await rm(source, { recursive: true, force: true });
  }
});

test('release drafts use stable asset names and replace rebuilt bytes even when the size is unchanged', async () => {
  const source = await mkdtemp(path.join(os.tmpdir(), 'tools-local-github-release-test-'));
  const destination = path.join(source, 'published');
  try {
    const input = path.join(source, 'tools local_1.0.0_aarch64.dmg');
    await writeFile(input, Buffer.from([1, 2, 3]));
    const options = { sourceDirs: [source], destination, version: '1.0.0', contentAddressed: false };
    const first = await prepareDesktopDownloads(options);
    expectStableName(first);
    const rebuilt = Buffer.from([3, 2, 1]);
    await writeFile(input, rebuilt);
    const second = await prepareDesktopDownloads(options);
    expectStableName(second);
    assert.deepEqual(await readFile(path.join(destination, second.releases[0].filename)), rebuilt);
    assert.equal(second.releases[0].sha256, createHash('sha256').update(rebuilt).digest('hex'));
  } finally {
    await rm(source, { recursive: true, force: true });
  }
});

function expectStableName(manifest) {
  assert.equal(manifest.releases[0].filename, 'tools-local-1.0.0-macos-arm64.dmg');
}
