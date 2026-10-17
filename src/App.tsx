import React, { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { CanvasViewport } from '@/components/watermark/CanvasViewport';
import { BatchFilmstrip } from '@/components/watermark/BatchFilmstrip';
import { WatermarkControls } from '@/components/watermark/WatermarkControls';
import { CodeMirrorConfigView } from '@/components/watermark/CodeMirrorConfigView';
import { AboutPrivacyView } from '@/components/watermark/AboutPrivacyView';
import { ShortcutsModal } from '@/components/watermark/ShortcutsModal';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { exportSingleImage } from '@/utils/batchExporter';

export const App: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { 
    activeTab, 
    setActiveTab, 
    desktopFrame, 
    theme, 
    images, 
    activeImageId, 
    config 
  } = useWatermarkStore();

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
        if (activeImg) {
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
  }, [images, activeImageId, config]);

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden bg-background text-foreground ${desktopFrame ? 'p-2 sm:p-4 bg-slate-900/90' : ''}`}>
      {/* PC Desktop Window Shell (if enabled) */}
      <div className={`w-full h-full flex flex-col overflow-hidden bg-background ${
        desktopFrame 
          ? 'rounded-xl border border-slate-700/80 shadow-2xl ring-1 ring-white/10' 
          : ''
      }`}>
        {/* Desktop Titlebar (Traffic lights macOS style) */}
        {desktopFrame && (
          <div className="h-8 bg-card border-b border-border/80 px-3 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/90 border border-red-600 shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-600 shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600 shadow-xs" />
            </div>
            <div className="text-xs font-medium text-muted-foreground font-mono">
              tools local — Desktop Offline
            </div>
            <div className="w-12" />
          </div>
        )}

        {/* Global App Header */}
        <Header onOpenShortcuts={() => setShortcutsOpen(true)} />

        {/* Main Body Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <Sidebar />

          {/* Center Main Stage according to active tab */}
          <main className="flex-1 flex overflow-hidden">
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

            {activeTab === 'json-config' && <CodeMirrorConfigView />}
            {activeTab === 'about' && <AboutPrivacyView />}
          </main>
        </div>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

export default App;
