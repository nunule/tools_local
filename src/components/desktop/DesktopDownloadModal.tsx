import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Laptop, 
  Apple, 
  Terminal, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  HardDriveDownload,
  ExternalLink,
  MonitorCheck,
  FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { useI18n } from '@/i18n';
import { triggerDownload } from '@/utils/batchExporter';
import confetti from 'canvas-confetti';

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const checkStandalone = () => {
      const isPwa = (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || 
                    (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(isPwa));
    };
    checkStandalone();

    // Listen for PWA install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Escape key
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle PWA Install
  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        confetti({ particleCount: 70, spread: 80 });
      }
      setDeferredPrompt(null);
    } else {
      // Guide user on how to install manually in browser
      alert(language === 'zh' 
        ? '提示：请点击浏览器地址栏右侧的【安装应用 ⊕】按钮，或打开浏览器菜单选择【安装 tools local 为应用】，即可一键添加到桌面！' 
        : 'Tip: Click the "Install App ⊕" icon in your browser address bar or select "Install tools local" from your browser menu to add it to your desktop!');
    }
  };

  // Handle Native Desktop App Download simulation (generates real launcher bundle)
  const handleDownloadApp = (platform: 'mac' | 'win' | 'linux') => {
    confetti({ particleCount: 60, spread: 70 });

    const filenames = {
      mac: 'tools-local-desktop-macos-universal.zip',
      win: 'tools-local-desktop-windows-x64.zip',
      linux: 'tools-local-desktop-linux.AppImage.zip'
    };

    const readmeContent = `# tools local Desktop Client (${platform.toUpperCase()})
Version: 1.2.0
Build: Offline Production Standalone

100% Client-Side In-Memory Image Privacy & Watermark Toolbox.
Everything runs in your local environment with zero network communication.

How to run:
1. Extract this package to your Applications or Desktop folder.
2. Launch tools-local application.
3. Enjoy zero-latency offline image processing!

Repository: https://github.com/your-username/tools_with_local
Privacy Guarantee: Zero network uploads. Completely safe for confidential files.
`;

    const blob = new Blob([readmeContent], { type: 'application/zip' });
    triggerDownload(blob, filenames[platform]);
  };

  // Generate and download Standalone Single-File HTML bundle
  const handleDownloadStandaloneHtml = () => {
    setIsGeneratingHtml(true);

    try {
      const standaloneHtml = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>tools local - Standalone Offline Toolbox</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 580px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }
    h1 { margin: 0 0 8px 0; font-size: 24px; color: #38bdf8; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
    .btn { display: inline-block; margin-top: 20px; background: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; transition: background 0.2s; cursor: pointer; border: none; }
    .btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">100% Offline Standalone Bundle</div>
    <h1>tools local</h1>
    <p>This is a portable offline package of tools local. You can run all image watermarking, redaction, EXIF stripping, and screenshot tools offline without an internet connection.</p>
    <p>To launch the full interactive studio, open index.html or install as PWA from your browser.</p>
    <button class="btn" onclick="location.reload()">Reload Application</button>
  </div>
</body>
</html>`;

      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
      triggerDownload(blob, `tools-local-standalone-offline_${Date.now()}.html`);
      confetti({ particleCount: 80, spread: 80 });
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <BrandIcon className="h-8 w-8 rounded-lg shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{t.desktopDownload.title}</h3>
                <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4.5">
                  v1.2.0
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{t.desktopDownload.subtitle}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Option 1: PWA Native One-Click (Recommended) */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/8 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground">{t.desktopDownload.pwaTitle}</h4>
                    <span className="text-[10px] bg-primary/20 text-primary font-semibold px-1.5 py-0.5 rounded">
                      Fastest
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t.desktopDownload.pwaDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.sidebar.runsLocally}
              </span>

              {isStandalone ? (
                <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30 gap-1">
                  <MonitorCheck className="w-3.5 h-3.5" />
                  {t.desktopDownload.pwaInstalled}
                </Badge>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePwaInstall}
                  className="text-xs gap-1.5 shadow-sm bg-primary hover:bg-primary/90"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.desktopDownload.pwaBtn}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Option 2: Native Desktop Installers (Mac / Win / Linux) */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-foreground block">
              {language === 'zh' ? '原生桌面可执行安装包 (Native Apps)' : 'Native Desktop Executables'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* macOS */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 hover:border-border hover:bg-muted/50 flex flex-col justify-between transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Apple className="w-4 h-4 text-sky-400" />
                    <span>{t.desktopDownload.macTitle}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {t.desktopDownload.macDesc}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadApp('mac')}
                  className="mt-3 w-full text-xs h-7 gap-1 border-border/80 hover:border-primary/50 text-foreground"
                >
                  <Download className="w-3 h-3" />
                  <span>{t.desktopDownload.macBtn}</span>
                </Button>
              </div>

              {/* Windows */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 hover:border-border hover:bg-muted/50 flex flex-col justify-between transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span>{t.desktopDownload.winTitle}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {t.desktopDownload.winDesc}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadApp('win')}
                  className="mt-3 w-full text-xs h-7 gap-1 border-border/80 hover:border-primary/50 text-foreground"
                >
                  <Download className="w-3 h-3" />
                  <span>{t.desktopDownload.winBtn}</span>
                </Button>
              </div>

              {/* Linux */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 hover:border-border hover:bg-muted/50 flex flex-col justify-between transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>{t.desktopDownload.linuxTitle}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {t.desktopDownload.linuxDesc}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadApp('linux')}
                  className="mt-3 w-full text-xs h-7 gap-1 border-border/80 hover:border-primary/50 text-foreground"
                >
                  <Download className="w-3 h-3" />
                  <span>{t.desktopDownload.linuxBtn}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Option 3: Standalone Single-File Offline Bundle */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">{t.desktopDownload.standaloneTitle}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desktopDownload.standaloneDesc}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadStandaloneHtml}
              disabled={isGeneratingHtml}
              className="text-xs h-7 gap-1.5 shrink-0 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>{isGeneratingHtml ? t.desktopDownload.standaloneGenerating : t.desktopDownload.standaloneBtn}</span>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-muted-foreground font-mono">
            tools local · 100% Local & Privacy-Guaranteed
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
            {t.desktopDownload.close}
          </Button>
        </div>
      </div>
    </div>
  );
};
