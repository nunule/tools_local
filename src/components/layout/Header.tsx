import React from 'react';
import { ChevronRight, Keyboard, Languages, PanelLeftOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface HeaderProps { onOpenShortcuts: () => void }

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts }) => {
  const { activeTab, sidebarOpen, setSidebarOpen, images, loadSampleImage } = useWatermarkStore();
  const { language, toggleLanguage, t } = useI18n();
  const labels = {
    watermark: t.nav.watermark, redact: t.nav.redact, exif: t.nav.exif,
    screenshot: t.nav.screenshot, 'id-copy': t.nav.idCopy,
    'json-format': t.nav.jsonFormat,
    'json-config': t.configEditor.title, about: t.nav.about,
  };
  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/75 px-4 select-none">
      <div className="flex min-w-0 items-center gap-2.5 text-xs">
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label={t.sidebar.expand} title={t.sidebar.expand} className="h-7 w-7 text-muted-foreground"><PanelLeftOpen className="h-4 w-4" /></Button>}
        <span className="hidden text-muted-foreground sm:inline">{t.sidebar.workspace}</span>
        <ChevronRight className="hidden h-3 w-3 text-muted-foreground/50 sm:block" />
        <span className="truncate font-medium">{labels[activeTab]}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {activeTab === 'watermark' && images.length === 0 && <Button variant="ghost" size="sm" onClick={loadSampleImage} className="hidden h-7 gap-1.5 text-xs text-muted-foreground lg:inline-flex"><Sparkles className="h-3.5 w-3.5" />{t.common.loadSample}</Button>}
        <span className="mr-2 hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground sm:inline-flex"><ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />{t.sidebar.runsLocally}</span>
        <Button variant="ghost" size="sm" onClick={toggleLanguage} title={t.common.langToggle} aria-label={t.common.langToggle} className="h-7 gap-1.5 px-2 font-mono text-[11px] text-muted-foreground"><Languages className="h-3.5 w-3.5" />{language === 'zh' ? 'EN' : '中'}</Button>
        <Button variant="ghost" size="icon" onClick={onOpenShortcuts} title={t.common.shortcuts} aria-label={t.common.shortcuts} className="h-7 w-7 text-muted-foreground"><Keyboard className="h-4 w-4" /></Button>
      </div>
    </header>
  );
};
