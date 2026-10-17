import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Crop, 
  Smartphone, 
  Globe, 
  Eye, 
  Download, 
  Upload, 
  Sparkles, 
  RotateCcw, 
  Minus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { triggerDownload } from '@/utils/batchExporter';
import { applyMosaicToRect } from '@/utils/redactRenderer';
import { useI18n } from '@/i18n';
import confetti from 'canvas-confetti';

interface QuickMask {
  id: string;
  type: 'avatar' | 'name-bar';
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ScreenshotStudioView: React.FC = () => {
  const { t, language } = useI18n();
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('screenshot.png');
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Trimming parameters
  const [trimTop, setTrimTop] = useState<number>(0);
  const [trimBottom, setTrimBottom] = useState<number>(0);
  const [trimLeft, setTrimLeft] = useState<number>(0);
  const [trimRight, setTrimRight] = useState<number>(0);

  // Masks
  const [masks, setMasks] = useState<QuickMask[]>([]);
  const [maskType, setMaskType] = useState<'mosaic' | 'solid'>('mosaic');
  const [isComparing, setIsComparing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  useEffect(() => {
    if (!screenshotSrc) {
      setBaseImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBaseImage(img);
      setTrimTop(0);
      setTrimBottom(0);
      setTrimLeft(0);
      setTrimRight(0);
      setMasks([]);
    };
    img.src = screenshotSrc;
  }, [screenshotSrc]);

  // Load sample mobile screenshot
  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1170;
    canvas.height = 2532; // iPhone standard resolution
    const ctx = canvas.getContext('2d')!;

    // Chat background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1170, 2532);

    // Simulated status bar (54px)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, 1170, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.fillText('9:41', 80, 80);
    ctx.fillText('5G · 100%', 940, 80);

    // Chat header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 120, 1170, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, sans-serif';
    if (language === 'en') {
      ctx.fillText('VIP Client · Project Sync (8)', 360, 210);
    } else {
      ctx.fillText('重要客户·商务对接群 (8)', 360, 210);
    }

    // Chat messages
    // Avatar 1
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(120, 380, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    if (language === 'en') {
      ctx.fillText('Alex Vance (ID: alex_vance_ny)', 200, 360);
    } else {
      ctx.fillText('李经理 (微信号: wxid_998124)', 200, 360);
    }

    // Bubble 1
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(200, 390, 780, 120, 24);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '36px -apple-system, sans-serif';
    if (language === 'en') {
      ctx.fillText('Hi team, here is the new contract quotation.', 240, 465);
    } else {
      ctx.fillText('张总，这是我们新的报价单，请查收。', 240, 465);
    }

    // Avatar 2
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(120, 600, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    if (language === 'en') {
      ctx.fillText('CFO · Sarah Jenkins', 200, 580);
    } else {
      ctx.fillText('财务总监·陈女士', 200, 580);
    }

    // Bubble 2
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(200, 610, 840, 120, 24);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '36px -apple-system, sans-serif';
    if (language === 'en') {
      ctx.fillText('Initial advance payment of $50,000 has cleared.', 240, 685);
    } else {
      ctx.fillText('首笔预付款 500,000 元已汇入尾号 8829 账户。', 240, 685);
    }

    // Bottom home bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.roundRect(400, 2490, 370, 12, 6);
    ctx.fill();

    setScreenshotSrc(canvas.toDataURL('image/png'));
    setFileName('mobile_chat_screenshot.png');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshotSrc(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    if (isComparing) {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(baseImage, 0, 0);
      return;
    }

    const cropX = trimLeft;
    const cropY = trimTop;
    const cropW = Math.max(10, baseImage.width - trimLeft - trimRight);
    const cropH = Math.max(10, baseImage.height - trimTop - trimBottom);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cropped region from source
    ctx.drawImage(baseImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Apply quick masks on cropped coordinate space
    for (const mask of masks) {
      const relX = mask.x - cropX;
      const relY = mask.y - cropY;

      if (maskType === 'mosaic') {
        applyMosaicToRect(ctx, relX, relY, mask.width, mask.height, 14);
      } else {
        ctx.fillStyle = '#0f172a';
        if (mask.type === 'avatar') {
          ctx.beginPath();
          ctx.arc(relX + mask.width / 2, relY + mask.height / 2, mask.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(relX, relY, mask.width, mask.height, 6);
          ctx.fill();
        }
      }
    }
  }, [baseImage, trimTop, trimBottom, trimLeft, trimRight, masks, maskType, isComparing]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Click on canvas to drop quick mask
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!baseImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickRelX = (e.clientX - rect.left) * scaleX;
    const clickRelY = (e.clientY - rect.top) * scaleY;

    // Map back to uncropped coordinates
    const origX = clickRelX + trimLeft;
    const origY = clickRelY + trimTop;

    // Add a 100x100 circle mask or bar mask
    const newMask: QuickMask = {
      id: `mask_${Date.now()}`,
      type: 'avatar',
      x: origX - 50,
      y: origY - 50,
      width: 100,
      height: 100,
    };

    setMasks((prev) => [...prev, newMask]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob) {
        const rawName = fileName.replace(/\.[^/.]+$/, '');
        if (!await triggerDownload(blob, `${rawName}_trimmed.png`)) return;
        confetti({ particleCount: 50, spread: 60 });
      }
    }, 'image/png');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Center Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative border-r border-border">
        {/* Top toolbar */}
        <div className="h-12 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {baseImage ? fileName : t.screenshot.title}
            </span>
            {baseImage && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {language === 'zh' ? '裁切后: ' : 'Cropped: '} 
                {Math.max(10, baseImage.width - trimLeft - trimRight)} × {Math.max(10, baseImage.height - trimTop - trimBottom)} px
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {baseImage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTrimTop(0);
                    setTrimBottom(0);
                    setTrimLeft(0);
                    setTrimRight(0);
                    setMasks([]);
                  }}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.screenshot.resetCrop}</span>
                </Button>

                <Button
                  variant={isComparing ? 'destructive' : 'ghost'}
                  size="sm"
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  className="h-7 text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.common.holdToCompare}</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 text-xs gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.screenshot.exportCropped}</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 p-6 flex items-center justify-center bg-muted/20 overflow-auto">
          {baseImage ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative shadow-2xl rounded-sm border border-border max-h-[75vh] max-w-[85vw] overflow-hidden bg-card">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="max-h-[75vh] w-auto object-contain cursor-pointer"
                  title={t.screenshot.clickToMaskHint}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {t.screenshot.clickToMaskHint}
              </span>
            </div>
          ) : (
            <div className="max-w-md w-full p-8 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-3">
                <Crop className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {t.screenshot.dropTitle}
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                {t.screenshot.dropDesc}
              </p>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="default" size="sm" className="gap-1.5 pointer-events-none">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.screenshot.selectFile}</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="gap-1.5 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.screenshot.sampleBtn}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Panel */}
      <div className="w-72 lg:w-80 p-4 flex flex-col justify-between bg-card/70 backdrop-blur-md select-none shrink-0 overflow-y-auto">
        <div className="space-y-5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">
              {t.screenshot.presetHeading}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {t.screenshot.presetSubheading}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                if (baseImage) {
                  const statusBarPx = Math.round(baseImage.height * 0.05);
                  setTrimTop(statusBarPx);
                }
              }}
              className="w-full p-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-500" />
                <div>
                  <div className="font-semibold text-foreground">{t.screenshot.trimTopBar}</div>
                  <div className="text-[10px] text-muted-foreground">{t.screenshot.trimTopBarDesc}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-primary">{t.screenshot.applyPreset}</span>
            </button>

            <button
              onClick={() => {
                if (baseImage) {
                  const bottomBarPx = Math.round(baseImage.height * 0.035);
                  setTrimBottom(bottomBarPx);
                }
              }}
              className="w-full p-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-semibold text-foreground">{t.screenshot.trimHomeBar}</div>
                  <div className="text-[10px] text-muted-foreground">{t.screenshot.trimHomeBarDesc}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-primary">{t.screenshot.applyPreset}</span>
            </button>

            <button
              onClick={() => {
                if (baseImage) {
                  const browserTopPx = Math.round(baseImage.height * 0.08);
                  setTrimTop(browserTopPx);
                }
              }}
              className="w-full p-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-500" />
                <div>
                  <div className="font-semibold text-foreground">{t.screenshot.trimBrowserBar}</div>
                  <div className="text-[10px] text-muted-foreground">{t.screenshot.trimBrowserBarDesc}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-primary">{t.screenshot.applyPreset}</span>
            </button>
          </div>

          <div className="w-full h-[1px] bg-border/60 my-2" />

          {/* Fine-tuning Sliders */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-foreground">{t.screenshot.trimSlidersHeading}</span>

            <Slider
              label={t.screenshot.trimTop}
              value={trimTop}
              min={0}
              max={baseImage ? Math.floor(baseImage.height / 2) : 500}
              step={2}
              unit="px"
              onChange={setTrimTop}
            />

            <Slider
              label={t.screenshot.trimBottom}
              value={trimBottom}
              min={0}
              max={baseImage ? Math.floor(baseImage.height / 2) : 500}
              step={2}
              unit="px"
              onChange={setTrimBottom}
            />

            <Slider
              label={t.screenshot.trimLeft}
              value={trimLeft}
              min={0}
              max={baseImage ? Math.floor(baseImage.width / 2) : 500}
              step={2}
              unit="px"
              onChange={setTrimLeft}
            />

            <Slider
              label={t.screenshot.trimRight}
              value={trimRight}
              min={0}
              max={baseImage ? Math.floor(baseImage.width / 2) : 500}
              step={2}
              unit="px"
              onChange={setTrimRight}
            />
          </div>

          <div className="w-full h-[1px] bg-border/60 my-2" />

          {/* Quick Masks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{t.screenshot.maskHeading}</span>
              {masks.length > 0 && (
                <button
                  onClick={() => setMasks([])}
                  className="text-[11px] text-muted-foreground hover:text-destructive"
                >
                  {t.screenshot.clearMasks} ({masks.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMaskType('mosaic')}
                className={`py-1.5 text-xs rounded-lg border font-medium ${
                  maskType === 'mosaic' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40'
                }`}
              >
                {t.screenshot.mosaicMask}
              </button>
              <button
                onClick={() => setMaskType('solid')}
                className={`py-1.5 text-xs rounded-lg border font-medium ${
                  maskType === 'solid' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40'
                }`}
              >
                {t.screenshot.solidMask}
              </button>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
          {t.screenshot.tip}
        </div>
      </div>
    </div>
  );
};
