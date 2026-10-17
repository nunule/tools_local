import React from 'react';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Keyboard, 
  AppWindow, 
  Code, 
  Info,
  Menu,
  Image as ImageIcon,
  Paintbrush,
  Camera,
  Crop,
  CreditCard,
  Languages,
  Download
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActiveToolTab } from '@/types/privacyTools';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { useI18n } from '@/i18n';
import { isDesktopApp } from '@/platform/files';

interface HeaderProps {
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    desktopFrame,
    setDesktopFrame,
    sidebarOpen,
    setSidebarOpen,
    loadSampleImage,
    images,
    setDesktopModalOpen
  } = useWatermarkStore();

  const { language, toggleLanguage, t } = useI18n();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navTools: { id: ActiveToolTab; label: string; icon: React.ReactNode }[] = [
    { id: 'watermark', label: t.nav.watermark, icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'redact', label: t.nav.redact, icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'exif', label: t.nav.exif, icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'screenshot', label: t.nav.screenshot, icon: <Crop className="w-3.5 h-3.5" /> },
    { id: 'id-copy', label: t.nav.idCopy, icon: <CreditCard className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shrink-0">
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2.5">
          <BrandIcon className="h-8 w-8 rounded-lg shadow-sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground font-mono">
                tools <span className="text-teal-500 dark:text-teal-400 font-semibold">local</span>
              </span>
              <Badge variant="success" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 h-4.5 gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.common.offlineBadge}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden xl:block">
              {t.common.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Tool Navigation Tabs */}
      <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 overflow-x-auto no-scrollbar">
        {navTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tool.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tool.icon}
            <span>{tool.label}</span>
            {tool.id === 'watermark' && images.length > 0 && (
              <span className="w-4 h-4 text-[10px] rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono">
                {images.length}
              </span>
            )}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-border/60 mx-1 hidden sm:block" />

        <button
          onClick={() => setActiveTab('json-config')}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'json-config'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="CodeMirror 6 JSON"
        >
          <Code className="w-3.5 h-3.5" />
          <span>{t.nav.config}</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'about'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.nav.about}
        >
          <Info className="w-3.5 h-3.5" />
          <span>{t.nav.about}</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {activeTab === 'watermark' && images.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleImage}
            className="text-xs h-8 gap-1.5 text-teal-500 border-teal-500/30 hover:bg-teal-500/10 hidden md:inline-flex"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.common.loadSample}</span>
          </Button>
        )}

        {/* Download Desktop App Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDesktopModalOpen(true)}
          title={t.sidebar.downloadDesktop}
          className="h-8 text-xs gap-1.5 hidden lg:inline-flex text-teal-600 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/10 shadow-xs font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.sidebar.downloadDesktop}</span>
        </Button>

        {/* Language Switcher */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          title={t.common.langToggle}
          className="h-8 px-2 text-xs gap-1 font-mono text-muted-foreground hover:text-foreground border border-border/50"
        >
          <Languages className="w-3.5 h-3.5 text-teal-500" />
          <span className="font-semibold text-[11px]">{language === 'zh' ? 'EN' : '中'}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          title={t.common.shortcuts}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          <Keyboard className="w-4 h-4" />
        </Button>

        {!isDesktopApp() && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDesktopFrame(!desktopFrame)}
            title={t.common.desktopToggle}
            className={`h-8 w-8 ${desktopFrame ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <AppWindow className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={t.common.themeToggle}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
};
