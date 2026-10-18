import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
// A desktop app must never embed its own downloadable installers.
await cp(publicDir, path.join(root, 'dist-desktop'), {
  recursive: true,
  filter: (source) => path.relative(publicDir, source).split(path.sep)[0] !== 'downloads',
});
