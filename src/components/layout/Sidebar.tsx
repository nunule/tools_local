import React from 'react';
import { 
  Stamp, 
  FileCode, 
  Binary, 
  KeyRound, 
  Scissors, 
  ShieldAlert, 
  HardDrive, 
  Cpu, 
  ExternalLink,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const Sidebar: React.FC = () => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    activeTab, 
    setActiveTab, 
    images 
  } = useWatermarkStore();

  if (!sidebarOpen) {
    return (
      <aside className="w-12 border-r border-border bg-card/60 flex flex-col items-center py-3 justify-between z-20 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          title="展开侧边栏"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        <div className="text-[10px] text-muted-foreground rotate-90 font-mono tracking-widest whitespace-nowrap">
          OFFLINE
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between z-20 select-none shrink-0 transition-all">
      <div className="flex flex-col overflow-y-auto">
        {/* Category: 媒体与图像处理 */}
        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              媒体与图像处理
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              title="折叠导航栏"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('watermark')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'watermark'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                  : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Stamp className="w-4 h-4 text-primary" />
                <span>图片水印工作室</span>
              </div>
              <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 font-mono">
                {images.length > 0 ? `${images.length} 张` : 'Live'}
              </Badge>
            </button>

            <button
              onClick={() => alert('提示：图片格式转换与本地WebP压缩已内嵌在水印右侧的【导出设置】面板中，可直接在导出时无损转换！')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Scissors className="w-4 h-4" />
                <span>格式转换 / 压缩</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">已集成</span>
            </button>

            <button
              onClick={() => alert('提示：本地Canvas处理天然脱敏，不保留任何相机原始敏感EXIF GPS信息！')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4" />
                <span>EXIF 隐私防泄密</span>
              </div>
              <Badge variant="outline" className="text-[10px] py-0 px-1 h-4">
                自动清除
              </Badge>
            </button>
          </div>
        </div>

        {/* Category: 开发者常用工具 (CodeMirror 6) */}
        <div className="p-3 border-t border-border/50">
          <div className="px-2 mb-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              开发者工具 (CodeMirror 6)
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
                <span>JSON 配置编辑器</span>
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
                <span>离线与隐私架构</span>
              </div>
            </button>
          </div>
        </div>

        {/* System & Runtime Specs */}
        <div className="p-3 border-t border-border/50">
          <div className="px-2 mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              本地运行状态
            </span>
          </div>

          <div className="bg-muted/40 rounded-lg p-2.5 space-y-2 border border-border/40 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                数据隐私
              </span>
              <span className="font-mono text-emerald-500 font-medium">无网络上传</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                渲染加速
              </span>
              <span className="font-mono text-foreground/80">HTML5 Canvas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border bg-card/80">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Toolbit Local Suite</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
