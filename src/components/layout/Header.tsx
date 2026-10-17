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
  CreditCard
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActiveToolTab } from '@/types/privacyTools';
import { BrandIcon } from '@/components/brand/BrandIcon';

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

  const navTools: { id: ActiveToolTab; label: string; icon: React.ReactNode }[] = [
    { id: 'watermark', label: '图片水印', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'redact', label: '隐私遮挡', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'exif', label: '照片清理', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'screenshot', label: '截图隐私', icon: <Crop className="w-3.5 h-3.5" /> },
    { id: 'id-copy', label: '证件副本', icon: <CreditCard className="w-3.5 h-3.5" /> },
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
                100% 本地离线
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden xl:block">
              浏览器端纯本地图像处理 · 零上传 · 隐私安全
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
          title="CodeMirror 6 JSON 配置"
        >
          <Code className="w-3.5 h-3.5" />
          <span>配置</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'about'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="隐私与离线架构"
        >
          <Info className="w-3.5 h-3.5" />
          <span>说明</span>
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
