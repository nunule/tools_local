import React, { useEffect, useRef, useState } from 'react';
import { Apple, ArrowDownToLine, Check, ChevronDown, LoaderCircle, Monitor, Terminal, X } from 'lucide-react';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { useI18n } from '@/i18n';
import { DESKTOP_TARGETS, desktopDownloadUrl, detectDesktopOS, loadDesktopManifest, type DesktopManifest, type DesktopTarget } from '@/platform/downloads';

interface DesktopDownloadModalProps { isOpen: boolean; onClose: () => void }

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [manifest, setManifest] = useState<DesktopManifest | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [downloaded, setDownloaded] = useState<DesktopTarget | null>(null);
  const os = detectDesktopOS(navigator.userAgent);
  const labels: Record<DesktopTarget, string> = {
    'macos-arm64': t.desktopDownload.macArm, 'macos-x64': t.desktopDownload.macIntel,
    'windows-x64': t.desktopDownload.windows, 'linux-x64': t.desktopDownload.linux,
  };
  const targets = [...DESKTOP_TARGETS].sort((a, b) => Number(b.startsWith(os ?? '?')) - Number(a.startsWith(os ?? '?')));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
    return () => { if (dialog?.open) dialog.close(); };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setManifest(null);
    setError(false);
    setDownloaded(null);
    loadDesktopManifest(controller.signal).then((value) => {
      if (!controller.signal.aborted) setManifest(value);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [isOpen, attempt]);

  return (
    <dialog ref={dialogRef} aria-labelledby="desktop-download-title" aria-describedby="desktop-download-description"
      onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[540px] overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
      <div className="relative px-7 pt-7 pb-5">
        <button autoFocus onClick={onClose} aria-label={t.desktopDownload.close} className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><X className="h-4 w-4" /></button>
        <BrandIcon className="mb-5 h-11 w-11 rounded-xl" />
        <div className="flex items-center gap-2.5"><h2 id="desktop-download-title" className="text-xl font-semibold tracking-tight">{t.desktopDownload.title}</h2>{manifest && <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">v{manifest.version}</span>}</div>
        <p id="desktop-download-description" className="mt-2 text-xs leading-6 text-muted-foreground">{t.desktopDownload.subtitle}</p>
      </div>
      <div className="space-y-2 px-7 pb-5">
        {!manifest && !error && <div role="status" className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{t.desktopDownload.loading}</div>}
        {error && <div role="alert" className="rounded-lg border border-border p-4 text-xs"><p>{t.desktopDownload.loadError}</p><button onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-md bg-muted px-3 py-1.5 font-medium">{t.desktopDownload.retry}</button></div>}
        {manifest && targets.map((target) => {
          const release = manifest.releases.find((item) => item.target === target);
          const mac = target.startsWith('macos');
          const windows = target.startsWith('windows');
          const Icon = mac ? Apple : windows ? Monitor : Terminal;
          return (
            <div key={target} className={`flex items-center gap-3 rounded-xl border p-3.5 ${release ? 'border-teal-600/25 bg-teal-500/[0.04]' : 'border-border/80'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${release ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300' : 'bg-muted/70 text-muted-foreground'}`}><Icon className="h-[18px] w-[18px]" /></div>
              <div className="min-w-0 flex-1"><h3 className="text-xs font-semibold">{labels[target]}</h3><p className="mt-1 text-[10px] text-muted-foreground">{mac ? t.desktopDownload.macRequirement : windows ? t.desktopDownload.windowsRequirement : t.desktopDownload.linuxRequirement}{release && ` · ${(release.size / 1024 / 1024).toFixed(1)} MB`}</p></div>
              {release ? <a href={desktopDownloadUrl(release)} download={release.filename} onClick={() => setDownloaded(target)} aria-label={`${t.desktopDownload.download} · ${labels[target]}`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-teal-700 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"><ArrowDownToLine className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t.common.download}</span><span className="sm:hidden">{release.filename.endsWith('.dmg') ? 'DMG' : release.filename.endsWith('.exe') ? 'EXE' : 'AppImage'}</span></a> : <span className="shrink-0 rounded-md bg-muted/60 px-2 py-1 text-[10px] text-muted-foreground">{t.desktopDownload.unavailable}</span>}
            </div>
          );
        })}
        {downloaded && <p role="status" className="flex items-start gap-2 pt-2 text-xs leading-5 text-teal-700 dark:text-teal-300"><Check className="mt-0.5 h-4 w-4 shrink-0" />{t.desktopDownload.downloadStarted}</p>}
      </div>
      <div className="border-t border-border bg-muted/25 px-7 py-4">
        <details className="group text-xs"><summary className="flex cursor-pointer list-none items-center justify-between font-medium">{t.desktopDownload.installHint}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" /></summary><ul className="mt-3 space-y-2 text-[11px] leading-5 text-muted-foreground">{manifest?.releases.some((release) => release.target.startsWith('macos')) && <li>{t.desktopDownload.macInstall}</li>}{manifest?.releases.some((release) => release.target.startsWith('windows')) && <li>{t.desktopDownload.windowsInstall}</li>}{manifest?.releases.some((release) => release.target.startsWith('linux')) && <li>{t.desktopDownload.linuxInstall}</li>}<li>{t.desktopDownload.signingNote}</li></ul></details>
        <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-muted-foreground"><span>tools local</span><span>{language === 'zh' ? '本地处理 · 独立应用' : 'Local processing · Desktop app'}</span></div>
      </div>
    </dialog>
  );
};
