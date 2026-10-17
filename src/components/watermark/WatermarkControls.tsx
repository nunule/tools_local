import React, { useState } from 'react';
import { 
  Type, 
  Grid3X3, 
  Palette, 
  Sliders, 
  Download, 
  Sparkles, 
  Bookmark, 
  RotateCw,
  RefreshCw,
  Layers,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Dot,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  Archive,
  Copy,
  Check
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  FONT_OPTIONS, 
  QUICK_COLOR_PALETTE, 
  WATERMARK_PRESETS,
  WatermarkPreset 
} from '@/constants/presets';
import { SinglePosition } from '@/types/watermark';
import { exportSingleImage, exportAllImagesAsZip } from '@/utils/batchExporter';

export const WatermarkControls: React.FC = () => {
  const {
    config,
    updateConfig,
    resetConfig,
    applyPreset,
    images,
    activeImageId,
    isExportingBatch,
    batchProgress,
    setExportingBatch
  } = useWatermarkStore();

  const [activeTab, setActiveTab] = useState<'text' | 'layout' | 'style' | 'presets' | 'export'>('text');
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);

  const activeImage = images.find((img) => img.id === activeImageId);

  // Macro injection helpers
  const insertMacro = (macro: string) => {
    updateConfig({ text: config.text ? `${config.text} ${macro}` : macro });
  };

  // Quick rotation angle presets
  const anglePresets = [-45, -30, -15, 0, 15, 30, 45, 90];

  // 9 Grid anchor definitions
  const gridPositions: { id: SinglePosition; label: string; icon: React.ReactNode }[] = [
    { id: 'top-left', label: '左上', icon: <ArrowUpLeft className="w-3.5 h-3.5" /> },
    { id: 'top-center', label: '中上', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'top-right', label: '右上', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'middle-left', label: '居左', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'center', label: '正中', icon: <Dot className="w-4 h-4" /> },
    { id: 'middle-right', label: '居右', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'bottom-left', label: '左下', icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: 'bottom-center', label: '中下', icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { id: 'bottom-right', label: '右下', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  ];

  const handleDownloadSingle = async () => {
    if (!activeImage) return;
    await exportSingleImage(activeImage, config);
  };

  const handleDownloadAll = async () => {
    if (images.length === 0 || isExportingBatch) return;
    await exportAllImagesAsZip(images, config, setExportingBatch);
  };

  return (
    <div className="w-80 lg:w-96 border-l border-border bg-card/70 backdrop-blur-md flex flex-col h-full z-20 select-none shrink-0 shadow-lg">
      {/* Panel Tab Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 p-1.5 shrink-0">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'text'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="水印文字与字体"
        >
          <Type className="w-3.5 h-3.5" />
          <span>文字</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'layout'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="平铺网格与方向"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>排布</span>
        </button>

        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'style'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="色彩透明度与效果"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>效果</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'presets'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="预设模版"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>预设</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'export'
              ? 'bg-card text-foreground shadow-xs text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="导出设置"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出</span>
        </button>
      </div>

      {/* Main Settings Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ==================== TAB 1: TEXT & CONTENT ==================== */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Watermark text textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">水印文本 (支持多行回车)</label>
                <button
                  onClick={() => updateConfig({ text: '' })}
                  className="text-[11px] text-muted-foreground hover:text-destructive"
                >
                  清空
                </button>
              </div>
              <textarea
                value={config.text}
                onChange={(e) => updateConfig({ text: e.target.value })}
                rows={3}
                placeholder="输入水印文字..."
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card resize-y"
              />
            </div>

            {/* Quick Macro Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">快速插入动态变量:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => insertMacro('{{date}}')}
                  className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-mono"
                  title="插入当前日期 (如 2026-10-17)"
                >
                  + 当前日期
                </button>
                <button
                  onClick={() => insertMacro('{{time}}')}
                  className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-mono"
                  title="插入当前时间"
                >
                  + 时间戳
                </button>
                <button
                  onClick={() => insertMacro('{{filename}}')}
                  className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-mono"
                  title="插入原图文件名"
                >
                  + 文件名
                </button>
                <button
                  onClick={() => updateConfig({ text: '仅供业务核验使用\n严禁用于其他商业途径' })}
                  className="px-2 py-0.5 rounded text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                >
                  防盗免责声明
                </button>
              </div>
            </div>

            <div className="w-full h-[1px] bg-border/60 my-2" />

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">字体样式</label>
              <select
                value={config.fontFamily}
                onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <Slider
              label="字号大小 (Font Size)"
              value={config.fontSize}
              min={12}
              max={160}
              step={1}
              unit="px"
              onChange={(fontSize) => updateConfig({ fontSize })}
            />

            {/* Font Weight */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">字重粗细 (Font Weight)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['300', '400', '600', '900'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => updateConfig({ fontWeight: w })}
                    className={`py-1 text-xs rounded border transition-all ${
                      config.fontWeight === w
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {w === '300' ? '细体' : w === '400' ? '常规' : w === '600' ? '粗体' : '极粗'}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height & Letter Spacing */}
            <Slider
              label="行间距 (Line Height)"
              value={config.lineHeight}
              min={1.0}
              max={2.5}
              step={0.05}
              unit="x"
              onChange={(lineHeight) => updateConfig({ lineHeight })}
            />

            <Slider
              label="字间距 (Letter Spacing)"
              value={config.letterSpacing}
              min={0}
              max={24}
              step={1}
              unit="px"
              onChange={(letterSpacing) => updateConfig({ letterSpacing })}
            />
          </div>
        )}

        {/* ==================== TAB 2: LAYOUT & ANGLE ==================== */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* Mode Switch: Tile vs Single */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">水印排布模式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig({ mode: 'tile' })}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    config.mode === 'tile'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>全屏防伪平铺</span>
                </button>

                <button
                  onClick={() => updateConfig({ mode: 'single' })}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    config.mode === 'single'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <Dot className="w-4 h-4" />
                  <span>单点定点水印</span>
                </button>
              </div>
            </div>

            {/* Rotation Angle Slider & Presets */}
            <div className="space-y-2 pt-2">
              <Slider
                label="旋转方向与角度 (Rotation)"
                value={config.rotate}
                min={-180}
                max={180}
                step={1}
                unit="°"
                onChange={(rotate) => updateConfig({ rotate })}
              />

              <div className="flex flex-wrap gap-1 justify-between">
                {anglePresets.map((angle) => (
                  <button
                    key={angle}
                    onClick={() => updateConfig({ rotate: angle })}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                      config.rotate === angle
                        ? 'bg-primary/20 text-primary border-primary font-bold'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {angle > 0 ? `+${angle}°` : `${angle}°`}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-[1px] bg-border/60 my-2" />

            {/* Mode-specific settings */}
            {config.mode === 'tile' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">平铺间距与密度</span>
                </div>

                <Slider
                  label="水平间距 (Gap X)"
                  value={config.gapX}
                  min={20}
                  max={300}
                  step={5}
                  unit="px"
                  onChange={(gapX) => updateConfig({ gapX })}
                />

                <Slider
                  label="垂直间距 (Gap Y)"
                  value={config.gapY}
                  min={20}
                  max={300}
                  step={5}
                  unit="px"
                  onChange={(gapY) => updateConfig({ gapY })}
                />

                <Switch
                  label="错位交错排布 (Stagger Brick Layout)"
                  description="相邻两行文字呈50%交错分布，防伪与美观度更高"
                  checked={config.stagger}
                  onCheckedChange={(stagger) => updateConfig({ stagger })}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">九宫格定位</label>
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/40 rounded-xl border border-border">
                    {gridPositions.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => updateConfig({ position: pos.id })}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${
                          config.position === pos.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                        }`}
                        title={pos.label}
                      >
                        {pos.icon}
                        <span className="text-[10px] mt-0.5">{pos.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label="水平边距偏移 (Offset X)"
                  value={config.offsetX}
                  min={0}
                  max={300}
                  step={2}
                  unit="px"
                  onChange={(offsetX) => updateConfig({ offsetX })}
                />

                <Slider
                  label="垂直边距偏移 (Offset Y)"
                  value={config.offsetY}
                  min={0}
                  max={300}
                  step={2}
                  unit="px"
                  onChange={(offsetY) => updateConfig({ offsetY })}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: COLOR & EFFECTS ==================== */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Color & Quick Palette */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">文字颜色与透明度</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => updateConfig({ color: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent p-0"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{config.color}</span>
                </div>
              </div>

              {/* Quick Colors */}
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_COLOR_PALETTE.map((pal) => (
                  <button
                    key={pal.label}
                    onClick={() => updateConfig({ color: pal.color, opacity: pal.opacity })}
                    className="flex items-center gap-1.5 p-1.5 rounded-md border border-border/80 bg-muted/30 hover:bg-muted text-[11px] transition-all"
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0" 
                      style={{ backgroundColor: pal.color }} 
                    />
                    <span className="truncate">{pal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <Slider
              label="水印透明程度 (Opacity)"
              value={config.opacity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(opacity) => updateConfig({ opacity })}
            />

            <div className="w-full h-[1px] bg-border/60 my-2" />

            {/* Text Stroke / Outline */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-2.5">
              <Switch
                label="文字描边轮廓 (Stroke)"
                description="使浅色白字在浅色图片上依然轮廓清晰可辨"
                checked={config.stroke.enabled}
                onCheckedChange={(enabled) => 
                  updateConfig({ stroke: { ...config.stroke, enabled } })
                }
              />

              {config.stroke.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">描边颜色</span>
                    <input
                      type="color"
                      value={config.stroke.color}
                      onChange={(e) => 
                        updateConfig({ stroke: { ...config.stroke, color: e.target.value } })
                      }
                      className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent p-0"
                    />
                  </div>

                  <Slider
                    label="描边粗细 (Width)"
                    value={config.stroke.width}
                    min={0.5}
                    max={8}
                    step={0.5}
                    unit="px"
                    onChange={(width) => 
                      updateConfig({ stroke: { ...config.stroke, width } })
                    }
                  />
                </div>
              )}
            </div>

            {/* Text Shadow */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-2.5">
              <Switch
                label="文字立体阴影 (Shadow)"
                description="营造水印立体层次感，防止与背景混杂"
                checked={config.shadow.enabled}
                onCheckedChange={(enabled) => 
                  updateConfig({ shadow: { ...config.shadow, enabled } })
                }
              />

              {config.shadow.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <Slider
                    label="阴影模糊半径 (Blur)"
                    value={config.shadow.blur}
                    min={0}
                    max={20}
                    step={1}
                    unit="px"
                    onChange={(blur) => 
                      updateConfig({ shadow: { ...config.shadow, blur } })
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Slider
                      label="偏移 X"
                      value={config.shadow.offsetX}
                      min={-15}
                      max={15}
                      step={1}
                      unit="px"
                      onChange={(offsetX) => 
                        updateConfig({ shadow: { ...config.shadow, offsetX } })
                      }
                    />
                    <Slider
                      label="偏移 Y"
                      value={config.shadow.offsetY}
                      min={-15}
                      max={15}
                      step={1}
                      unit="px"
                      onChange={(offsetY) => 
                        updateConfig({ shadow: { ...config.shadow, offsetY } })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Blend Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">色彩混合模式 (Blend Mode)</label>
              <select
                value={config.blendMode}
                onChange={(e) => updateConfig({ blendMode: e.target.value as any })}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="source-over">正常标准 (Source Over)</option>
                <option value="screen">滤色提亮 (Screen - 适合白透)</option>
                <option value="overlay">叠加融合 (Overlay)</option>
                <option value="soft-light">柔光 (Soft Light)</option>
                <option value="difference">差值反相 (Difference)</option>
                <option value="multiply">正片叠底 (Multiply)</option>
              </select>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: PRESETS ==================== */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">一键预设模版库</span>
              <button
                onClick={resetConfig}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                重置为默认
              </button>
            </div>

            <div className="space-y-2.5">
              {WATERMARK_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="p-3 rounded-xl border border-border/80 bg-muted/30 hover:border-primary/60 hover:bg-card cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground">
                      {preset.config.mode === 'tile' ? '平铺' : '单点'}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px]">
                      旋转 {preset.config.rotate ?? 0}° · 透明度 {preset.config.opacity}%
                    </span>
                    <span className="text-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      应用模版 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: EXPORT & BATCH ==================== */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">导出图像格式</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'image/png', label: 'PNG (无损)' },
                  { id: 'image/jpeg', label: 'JPEG (体积小)' },
                  { id: 'image/webp', label: 'WebP (现代高效)' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => updateConfig({ exportFormat: fmt.id as any })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      config.exportFormat === fmt.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {config.exportFormat !== 'image/png' && (
              <Slider
                label="压缩质量 (Quality)"
                value={config.exportQuality}
                min={10}
                max={100}
                step={1}
                unit="%"
                onChange={(exportQuality) => updateConfig({ exportQuality })}
              />
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">输出分辨率缩放 (Scale)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: 0.5, label: '0.5x' },
                  { val: 1, label: '1.0x (原始)' },
                  { val: 1.5, label: '1.5x' },
                  { val: 2, label: '2.0x (超清)' },
                ].map((sc) => (
                  <button
                    key={sc.val}
                    onClick={() => updateConfig({ scale: sc.val })}
                    className={`py-1 text-xs rounded border transition-all ${
                      config.scale === sc.val
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">文件名导出规则</label>
              <input
                type="text"
                value={config.filenamePattern}
                onChange={(e) => updateConfig({ filenamePattern: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                placeholder="{name}_watermarked"
              />
              <span className="text-[10px] text-muted-foreground block">
                支持占位符: <code className="bg-muted px-1 rounded text-primary">{'{name}'}</code> (原文件名), <code className="bg-muted px-1 rounded text-primary">{'{ext}'}</code> (扩展名)
              </span>
            </div>

            <div className="w-full h-[1px] bg-border/60 my-2" />

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                variant="default"
                size="lg"
                onClick={handleDownloadSingle}
                disabled={!activeImage}
                className="w-full gap-2 text-sm shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>下载当前图片</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadAll}
                disabled={images.length === 0 || isExportingBatch}
                className="w-full gap-2 text-sm border-primary/40 hover:bg-primary/10 text-primary"
              >
                <Archive className="w-4 h-4" />
                <span>{isExportingBatch ? `打包中 ${batchProgress}%` : `批量打包全部 (${images.length} 张)`}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Footer Action */}
      <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetConfig}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          重置参数
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleDownloadSingle}
          disabled={!activeImage}
          className="text-xs gap-1.5 h-8"
        >
          <Download className="w-3.5 h-3.5" />
          <span>保存图片</span>
        </Button>
      </div>
    </div>
  );
};
