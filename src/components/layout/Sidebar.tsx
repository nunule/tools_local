import React from 'react';
import { 
  Stamp, 
  FileCode, 
  Paintbrush, 
  Camera, 
  Crop, 
  CreditCard, 
  HardDrive, 
  Cpu, 
  SlidersHorizontal,
  ChevronLeft,
  KeyRound
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActiveToolTab } from '@/types/privacyTools';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { useI18n } from '@/i18n';

export const Sidebar: React.FC = () => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    activeTab, 
    setActiveTab, 
    images 
  } = useWatermarkStore();

  const { t, language } = useI18n();

  if (!sidebarOpen) {
    return (
      <aside className="w-12 border-r border-border bg-card/60 flex flex-col items-center py-3 justify-between z-20 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          title="Open Sidebar"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        <div className="text-[10px] text-muted-foreground rotate-90 font-mono tracking-widest whitespace-nowrap">
          {t.common.offlineNotice}
        </div>
      </aside>
    );
  }

  const primaryTools: { id: ActiveToolTab; name: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'watermark',
      name: t.nav.watermark,
      desc: language === 'zh' ? '白透防盗水印 · 平铺错位排布' : 'Tile & single watermark studio',
      icon: <Stamp className="w-4 h-4 text-teal-500" />,
      badge: images.length > 0 ? `${images.length}` : undefined,
    },
    {
      id: 'redact',
      name: t.nav.redact,
      desc: language === 'zh' ? '框选涂抹 · 纯色/马赛克/模糊' : 'Box & brush blur/mosaic',
      icon: <Paintbrush className="w-4 h-4 text-sky-500" />,
    },
    {
      id: 'exif',
      name: t.nav.exif,
      desc: language === 'zh' ? '查看并抹除定位GPS/时间/设备' : 'Wipe GPS & hardware metadata',
      icon: <Camera className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'screenshot',
      name: t.nav.screenshot,
      desc: language === 'zh' ? '裁状态栏/通知 · 遮头像与账号' : 'Trim status bar & mask avatars',
      icon: <Crop className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'id-copy',
      name: t.nav.idCopy,
      desc: language === 'zh' ? '证件脱敏 · 防盗用途水印' : 'ID card copy & purpose watermark',
      icon: <CreditCard className="w-4 h-4 text-rose-500" />,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between z-20 select-none shrink-0 transition-all">
      <div className="flex flex-col overflow-y-auto">
        {/* Category: 图像隐私工具箱 */}
        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              {t.nav.mediaCategory}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              title="Close Sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            {primaryTools.map((tool) => {
              const isActive = activeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`w-full flex items-start justify-between px-2.5 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                      : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{tool.icon}</div>
                    <div>
                      <div className="text-xs font-semibold">{tool.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{tool.desc}</div>
                    </div>
                  </div>
                  {tool.badge && (
                    <Badge variant={isActive ? 'default' : 'outline'} className="text-[9px] py-0 px-1 font-mono shrink-0">
                      {tool.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category: 开发者工具 (CodeMirror 6) */}
        <div className="p-3 border-t border-border/50">
          <div className="px-2 mb-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              {t.nav.devCategory}
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('json-config')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'json-config'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                  : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>{language === 'zh' ? 'JSON 配置脚本' : 'JSON Config Script'}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">CM6</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'about'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                  : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>{t.nav.about}</span>
              </div>
            </button>
          </div>
        </div>

        {/* System & Local Status */}
        <div className="p-3 border-t border-border/50">
          <div className="px-2 mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              {t.nav.statusCategory}
            </span>
          </div>

          <div className="bg-muted/40 rounded-lg p-2.5 space-y-2 border border-border/40 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                {t.nav.dataPrivacy}
              </span>
              <span className="font-mono text-emerald-500 font-medium">{t.nav.zeroUpload}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                {t.nav.renderEngine}
              </span>
              <span className="font-mono text-foreground/80">{t.nav.canvasEngine}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border bg-card/80">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BrandIcon className="h-3.5 w-3.5 rounded" />
            <span className="font-mono font-medium text-foreground/90">tools local</span>
          </div>
          <span className="font-mono">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
