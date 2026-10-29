import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { CanvasViewport } from '@/components/watermark/CanvasViewport';
import { BatchFilmstrip } from '@/components/watermark/BatchFilmstrip';
import { WatermarkControls } from '@/components/watermark/WatermarkControls';
import { CodeMirrorConfigView } from '@/components/watermark/CodeMirrorConfigView';
import { AboutPrivacyView } from '@/components/watermark/AboutPrivacyView';
import { ShortcutsModal } from '@/components/watermark/ShortcutsModal';
import { RedactStudioView } from '@/components/redact/RedactStudioView';
import { ExifCleanerView } from '@/components/exif/ExifCleanerView';
import { ScreenshotStudioView } from '@/components/screenshot/ScreenshotStudioView';
import { IDCopyStudioView } from '@/components/idcopy/IDCopyStudioView';
import { JsonFormatterView } from '@/components/json/JsonFormatterView';
import { DesktopDownloadModal } from '@/components/desktop/DesktopDownloadModal';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { exportSingleImage } from '@/utils/batchExporter';
import { isDesktopApp } from '@/platform/files';

export const App: React.FC = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const {
    activeTab,
    desktopFrame,
    theme,
    images,
    activeImageId,
    config,
    desktopModalOpen,
    setDesktopModalOpen
  } = useWatermarkStore();
  const showDesktopFrame = desktopFrame && !isDesktopApp();

  // Sync dark class on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Global keyboard shortcuts (Cmd+S to save, Cmd+/ for shortcuts)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const activeImg = images.find((i) => i.id === activeImageId);
        if (activeImg && activeTab === 'watermark') {
          exportSingleImage(activeImg, config);
        }
      }

      if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [images, activeImageId, config, activeTab]);

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden bg-background text-foreground ${showDesktopFrame ? 'p-2 sm:p-4 bg-slate-900/90' : ''}`}>
      {/* PC Desktop Window Shell (if enabled) */}
      <div className={`w-full h-full flex flex-col overflow-hidden bg-background ${
        showDesktopFrame
          ? 'rounded-xl border border-slate-700/80 shadow-2xl ring-1 ring-white/10'
          : ''
      }`}>
        {/* Desktop Titlebar (Traffic lights macOS style) */}
        {showDesktopFrame && (
          <div className="h-8 bg-card border-b border-border/80 px-3 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/90 border border-red-600 shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-600 shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600 shadow-xs" />
            </div>
            <div className="text-xs font-medium text-muted-foreground font-mono">
              tools local
            </div>
            <div className="w-12" />
          </div>
        )}

        {/* Main Body Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header onOpenShortcuts={() => setShortcutsOpen(true)} />
            {/* Center Main Stage according to active tab */}
            <main className="flex-1 min-h-0 flex overflow-hidden">
              {activeTab === 'watermark' && (
                <div className="flex-1 flex overflow-hidden">
                  {/* Center Canvas + Bottom Filmstrip */}
                  <div className="flex-1 flex flex-col overflow-hidden relative">
                    <CanvasViewport />
                    <BatchFilmstrip />
                  </div>

                  {/* Right Parameter Controls */}
                  <WatermarkControls />
                </div>
              )}

              {activeTab === 'redact' && <RedactStudioView />}
              {activeTab === 'exif' && <ExifCleanerView />}
              {activeTab === 'screenshot' && <ScreenshotStudioView />}
              {activeTab === 'id-copy' && <IDCopyStudioView />}
              {activeTab === 'json-format' && <JsonFormatterView />}
              {activeTab === 'json-config' && <CodeMirrorConfigView />}
              {activeTab === 'about' && <AboutPrivacyView />}
            </main>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Desktop App Download & Install Dialog */}
      {!isDesktopApp() && <DesktopDownloadModal isOpen={desktopModalOpen} onClose={() => setDesktopModalOpen(false)} />}
    </div>
  );
};

export default App;
