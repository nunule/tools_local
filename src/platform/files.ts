import { isTauri } from '@tauri-apps/api/core';

const FILE_FILTERS: Record<string, { name: string; extensions: string[] }> = {
  'image/png': { name: 'PNG', extensions: ['png'] },
  'image/jpeg': { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
  'image/webp': { name: 'WebP', extensions: ['webp'] },
  'application/json': { name: 'JSON', extensions: ['json'] },
  'application/zip': { name: 'ZIP', extensions: ['zip'] },
};

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && isTauri();
}

/** Returns false when the user cancels the native save dialog. */
export async function saveBlob(blob: Blob, filename: string): Promise<boolean> {
  const name = filename.split(/[\\/]/).pop() || 'export';

  if (isDesktopApp()) {
    const [{ save }, { writeFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ]);
    const filter = FILE_FILTERS[blob.type];
    const path = await save({
      defaultPath: name,
      ...(filter ? { filters: [filter] } : {}),
    });

    if (!path) return false;

    // The dialog grants access to this selected file. No global file scope is needed.
    await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    return true;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  return true;
}
