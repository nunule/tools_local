import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Moon, 
  Keyboard, 
  AppWindow, 
  Code, 
  Layers, 
  Info,
  Menu,
  Image as ImageIcon
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActiveToolTab } from '@/types/watermark';

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
    images
  } = useWatermarkStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 p-[1.5px] shadow-md shadow-teal-500/25">
            <div className="w-full h-full rounded-[6.5px] bg-card flex items-center justify-center">
              <svg 
                className="w-4.5 h-4.5 text-teal-500 dark:text-teal-400" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="3.5" />
                <path d="M7 7h5" />
                <path d="M7 11h10" />
                <path d="m14 15 3 3" />
                <circle cx="14" cy="15" r="2" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground font-mono">
                tools <span className="text-teal-500 dark:text-teal-400 font-semibold">local</span>
              </span>
              <Badge variant="success" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 h-4.5 gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                100% 本地离线
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden md:block">
              浏览器端纯本地图像处理 · 零上传 · 隐私安全
            </p>
          </div>
        </div>
      </div>

      {/* Center: Tool Navigation Tabs */}
      <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
        <button
          onClick={() => setActiveTab('watermark')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'watermark'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>水印工作台</span>
          {images.length > 0 && (
            <span className="w-4 h-4 text-[10px] rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono">
              {images.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('json-config')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'json-config'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>JSON 配置 (CodeMirror)</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'about'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>离线安全说明</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">
        {images.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleImage}
            className="text-xs h-8 gap-1.5 text-sky-500 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>加载样例图</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          title="键盘快捷键 (Cmd/Ctrl + /)"
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          <Keyboard className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDesktopFrame(!desktopFrame)}
          title={desktopFrame ? '退出PC窗口装饰' : '切换PC桌面窗口框架'}
          className={`h-8 w-8 ${desktopFrame ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <AppWindow className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="切换明暗主题"
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
};
