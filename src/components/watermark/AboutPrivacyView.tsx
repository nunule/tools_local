import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Layers, 
  Terminal, 
  Download, 
  Laptop, 
  CheckCircle,
  FileKey,
  FolderArchive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const AboutPrivacyView: React.FC = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 bg-muted/20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>零服务器交互 · 100% 本地端运行</span>
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              Toolbit Core Standards
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            本地图片水印工具技术架构与隐私承诺
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            专为身份证证件认证、商业机密文档、摄影版权保护打造的纯前端离线水印工具。无需担心任何图片被上传泄密。
          </p>
        </div>

        {/* 3 Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">绝不发送到外部网络</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              文件拖入后仅通过浏览器 FileReader 及 Canvas 2D 进行内存渲染，即使断开网络或处于飞行模式仍可完整无差别使用。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">高性能 Canvas 引擎</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              支持高分辨率图片原画质无损导出，支持 50% 错位交错砖墙平铺、阴影描边双重防伪、无级缩放与旋转。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">批量并发与 ZIP 打包</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              内置 JSZip 浏览器原生并发压缩，数百张图片可以在数秒内统一应用防伪水印并生成归档包供直接下载。
            </p>
          </div>
        </div>

        {/* Technical Stack Overview */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span>核心技术栈与工程实现</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="font-semibold text-foreground mb-1">前端核心</div>
              <div className="text-muted-foreground">React 19 + TypeScript</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="font-semibold text-foreground mb-1">状态管理</div>
              <div className="text-muted-foreground">Zustand 5 (带有 LocalStorage 持久化)</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="font-semibold text-foreground mb-1">构建与样式</div>
              <div className="text-muted-foreground">Vite 6 + Tailwind CSS 4 + shadcn/ui</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="font-semibold text-foreground mb-1">代码编辑器</div>
              <div className="text-muted-foreground">CodeMirror 6 (JSON 实时配置校验)</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="font-semibold text-foreground mb-1">路由与轻量化</div>
              <div className="text-muted-foreground">Wouter 极简客户端路由</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="font-semibold text-foreground mb-1">自动化测试体系</div>
              <div className="text-muted-foreground">Vitest + Testing Library + Playwright</div>
            </div>
          </div>
        </div>

        {/* Desktop PC Support */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-card to-sky-500/10 border border-border space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Laptop className="w-4 h-4" />
            <span>桌面客户端 (PC Desktop / PWA) 说明</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            本项目完全适配桌面原生尺寸及键盘交互。你可以通过点击右上角的「PC桌面窗口框架」切换桌面窗体风格；另外本项目天然具备 PWA / Tauri / Electron 离线跨平台打包能力，可作为独立桌面软件运行于 macOS、Windows 及 Linux。
          </p>
        </div>
      </div>
    </div>
  );
};
