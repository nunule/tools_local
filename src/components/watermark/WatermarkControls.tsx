import React, { useState } from 'react';
import { 
  Type, 
  Grid3X3, 
  Palette, 
  Bookmark, 
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
  Download
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { useI18n } from '@/i18n';
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
  const { t, language } = useI18n();
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

  const activeImage = images.find((img) => img.id === activeImageId);

  // Macro injection helpers
  const insertMacro = (macro: string) => {
    updateConfig({ text: config.text ? `${config.text} ${macro}` : macro });
  };

  // Quick rotation angle presets
  const anglePresets = [-45, -30, -15, 0, 15, 30, 45, 90];

  // 9 Grid anchor definitions
  const gridPositions: { id: SinglePosition; label: string; icon: React.ReactNode }[] = [
    { id: 'top-left', label: t.watermark.layout.anchors.topLeft, icon: <ArrowUpLeft className="w-3.5 h-3.5" /> },
    { id: 'top-center', label: t.watermark.layout.anchors.topCenter, icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'top-right', label: t.watermark.layout.anchors.topRight, icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'middle-left', label: t.watermark.layout.anchors.middleLeft, icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'center', label: t.watermark.layout.anchors.center, icon: <Dot className="w-4 h-4" /> },
    { id: 'middle-right', label: t.watermark.layout.anchors.middleRight, icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'bottom-left', label: t.watermark.layout.anchors.bottomLeft, icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: 'bottom-center', label: t.watermark.layout.anchors.bottomCenter, icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { id: 'bottom-right', label: t.watermark.layout.anchors.bottomRight, icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  ];

  const getColorLabel = (color: string) => {
    if (language === 'zh') {
      if (color === '#ffffff') return '透亮纯白';
      if (color === '#e2e8f0') return '柔和浅灰';
      if (color === '#090d16') return '冷调纯黑';
      if (color === '#ef4444') return '警戒印红';
      if (color === '#3b82f6') return '商务靛蓝';
      if (color === '#eab308') return '防伪金黄';
    } else {
      if (color === '#ffffff') return 'Bright White';
      if (color === '#e2e8f0') return 'Soft Light Gray';
      if (color === '#090d16') return 'Matte Black';
      if (color === '#ef4444') return 'Alert Red';
      if (color === '#3b82f6') return 'Business Blue';
      if (color === '#eab308') return 'Security Gold';
    }
    return color;
  };

  const getFontWeightLabel = (w: '300' | '400' | '600' | '900') => {
    if (language === 'zh') {
      return w === '300' ? '细体' : w === '400' ? '常规' : w === '600' ? '粗体' : '极粗';
    }
    return w === '300' ? 'Light' : w === '400' ? 'Regular' : w === '600' ? 'SemiBold' : 'Black';
  };

  const getFontLabel = (f: { label: string; value: string }) => {
    if (language === 'en') {
      if (f.label.includes('Plus Jakarta Sans')) return 'Plus Jakarta Sans (Default Latin)';
      if (f.label.includes('Inter')) return 'Inter (Modern Sans)';
      if (f.label.includes('苹方')) return 'PingFang / YaHei (System Sans)';
      if (f.label.includes('宋体')) return 'Songti / SimSun (Serif)';
      if (f.label.includes('黑体')) return 'SimHei / Heiti (Bold Sans)';
      if (f.label.includes('JetBrains Mono')) return 'JetBrains Mono (Monospace)';
      if (f.label.includes('Impact')) return 'Impact (Heavy Sans)';
      if (f.label.includes('Georgia')) return 'Georgia (Elegant Serif)';
    }
    return f.label;
  };

  const getPresetDetails = (preset: WatermarkPreset) => {
    if (language === 'en') {
      switch (preset.id) {
        case 'confidential-tiled':
          return {
            name: 'Confidential Tiled',
            description: 'White semi-transparent diagonal staggered anti-theft watermark with subtle dark stroke.',
            mode: 'Tile'
          };
        case 'id-verification':
          return {
            name: 'ID Verification Copy',
            description: 'Designed for KYC, rental, and employment identity document verification.',
            mode: 'Tile'
          };
        case 'minimal-corner':
          return {
            name: 'Minimal Corner Signature',
            description: 'Subtle semi-transparent corner watermark for photography and creative media.',
            mode: 'Single'
          };
        case 'center-stamp':
          return {
            name: 'Center Stamp',
            description: 'Large semi-transparent sample watermark stamped across the center.',
            mode: 'Single'
          };
        case 'dense-security':
          return {
            name: 'Dense Security Grid',
            description: 'Ultra-dense diagonal grid watermark that prevents partial cropping or tampering.',
            mode: 'Tile'
          };
        default:
          return { name: preset.name, description: preset.description, mode: preset.config.mode === 'tile' ? 'Tile' : 'Single' };
      }
    }
    return {
      name: preset.name,
      description: preset.description,
      mode: preset.config.mode === 'tile' ? '平铺' : '单点'
    };
  };

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
          title={t.watermark.tabs.text}
        >
          <Type className="w-3.5 h-3.5" />
          <span>{t.watermark.tabs.text}</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'layout'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.watermark.layout.modeLabel}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>{t.watermark.tabs.layout}</span>
        </button>

        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'style'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.watermark.tabs.style}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{t.watermark.tabs.style}</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'presets'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.watermark.presets.title}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{t.watermark.tabs.presets}</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'export'
              ? 'bg-card text-foreground shadow-xs text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.watermark.tabs.export}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.watermark.tabs.export}</span>
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
                <label className="text-xs font-medium text-foreground">{t.watermark.text.label}</label>
                <button
                  onClick={() => updateConfig({ text: '' })}
                  className="text-[11px] text-muted-foreground hover:text-destructive"
                >
                  {t.watermark.text.clear}
                </button>
              </div>
              <textarea
                value={config.text}
                onChange={(e) => updateConfig({ text: e.target.value })}
                rows={3}
                placeholder={t.watermark.text.placeholder}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card resize-y"
              />
            </div>

            {/* Quick Macro Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">{t.watermark.text.macrosLabel}</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => insertMacro('{{date}}')}
                  className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-mono"
                  title="2026-10-17"
                >
                  {t.watermark.text.dateMacro}
                </button>
                <button
                  onClick={() => insertMacro('{{time}}')}
                  className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-mono"
                >
                  {t.watermark.text.timeMacro}
                </button>
                <button
                  onClick={() => insertMacro('{{filename}}')}
                  className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 font-mono"
                >
                  {t.watermark.text.filenameMacro}
                </button>
                <button
                  onClick={() => updateConfig({ 
                    text: language === 'zh'
                      ? '仅供业务核验使用\n严禁用于其他商业途径'
                      : 'For Identity Verification Only\nCommercial Use Strictly Prohibited'
                  })}
                  className="px-2 py-0.5 rounded text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                >
                  {t.watermark.text.disclaimerPreset}
                </button>
              </div>
            </div>

            <div className="w-full h-[1px] bg-border/60 my-2" />

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t.watermark.text.fontFamily}</label>
              <select
                value={config.fontFamily}
                onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {getFontLabel(font)}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <Slider
              label={t.watermark.text.fontSize}
              value={config.fontSize}
              min={12}
              max={160}
              step={1}
              unit="px"
              onChange={(fontSize) => updateConfig({ fontSize })}
            />

            {/* Font Weight */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t.watermark.text.fontWeight}</label>
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
                    {getFontWeightLabel(w)}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height & Letter Spacing */}
            <Slider
              label={t.watermark.text.lineHeight}
              value={config.lineHeight}
              min={1.0}
              max={2.5}
              step={0.05}
              unit="x"
              onChange={(lineHeight) => updateConfig({ lineHeight })}
            />

            <Slider
              label={t.watermark.text.letterSpacing}
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
              <label className="text-xs font-medium text-foreground">{t.watermark.layout.modeLabel}</label>
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
                  <span>{t.watermark.layout.tileMode}</span>
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
                  <span>{t.watermark.layout.singleMode}</span>
                </button>
              </div>
            </div>

            {/* Rotation Angle Slider & Presets */}
            <div className="space-y-2 pt-2">
              <Slider
                label={t.watermark.layout.rotation}
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
                <Slider
                  label={t.watermark.layout.gapX}
                  value={config.gapX}
                  min={20}
                  max={300}
                  step={5}
                  unit="px"
                  onChange={(gapX) => updateConfig({ gapX })}
                />

                <Slider
                  label={t.watermark.layout.gapY}
                  value={config.gapY}
                  min={20}
                  max={300}
                  step={5}
                  unit="px"
                  onChange={(gapY) => updateConfig({ gapY })}
                />

                <Switch
                  label={t.watermark.layout.stagger}
                  description={t.watermark.layout.staggerDesc}
                  checked={config.stagger}
                  onCheckedChange={(stagger) => updateConfig({ stagger })}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">{t.watermark.layout.singleAnchor}</label>
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
                  label={t.watermark.layout.offsetX}
                  value={config.offsetX}
                  min={0}
                  max={300}
                  step={2}
                  unit="px"
                  onChange={(offsetX) => updateConfig({ offsetX })}
                />

                <Slider
                  label={t.watermark.layout.offsetY}
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
                <label className="text-xs font-medium text-foreground">{t.watermark.style.colorAndOpacity}</label>
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
                    <span className="truncate">{getColorLabel(pal.color)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <Slider
              label={t.watermark.style.opacity}
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
                label={t.watermark.style.stroke}
                description={t.watermark.style.strokeDesc}
                checked={config.stroke.enabled}
                onCheckedChange={(enabled) => 
                  updateConfig({ stroke: { ...config.stroke, enabled } })
                }
              />

              {config.stroke.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.watermark.style.strokeColor}</span>
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
                    label={t.watermark.style.strokeWidth}
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
                label={t.watermark.style.shadow}
                description={t.watermark.style.shadowDesc}
                checked={config.shadow.enabled}
                onCheckedChange={(enabled) => 
                  updateConfig({ shadow: { ...config.shadow, enabled } })
                }
              />

              {config.shadow.enabled && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <Slider
                    label={t.watermark.style.shadowBlur}
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
                      label={t.watermark.style.shadowOffsetX}
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
                      label={t.watermark.style.shadowOffsetY}
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
              <label className="text-xs font-medium text-foreground">{t.watermark.style.blendMode}</label>
              <select
                value={config.blendMode}
                onChange={(e) => updateConfig({ blendMode: e.target.value as any })}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="source-over">
                  {language === 'zh' ? '正常标准 (Source Over)' : 'Normal (Source Over)'}
                </option>
                <option value="screen">
                  {language === 'zh' ? '滤色提亮 (Screen - 适合白透)' : 'Screen (Bright White)'}
                </option>
                <option value="overlay">
                  {language === 'zh' ? '叠加融合 (Overlay)' : 'Overlay'}
                </option>
                <option value="soft-light">
                  {language === 'zh' ? '柔光 (Soft Light)' : 'Soft Light'}
                </option>
                <option value="difference">
                  {language === 'zh' ? '差值反相 (Difference)' : 'Difference'}
                </option>
                <option value="multiply">
                  {language === 'zh' ? '正片叠底 (Multiply)' : 'Multiply'}
                </option>
              </select>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: PRESETS ==================== */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{t.watermark.presets.title}</span>
              <button
                onClick={resetConfig}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {t.watermark.presets.resetDefault}
              </button>
            </div>

            <div className="space-y-2.5">
              {WATERMARK_PRESETS.map((preset) => {
                const info = getPresetDetails(preset);
                return (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-xl border border-border/80 bg-muted/30 hover:border-primary/60 hover:bg-card cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {info.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground">
                        {info.mode}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {info.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono text-[10px]">
                        {language === 'zh' ? '旋转' : 'Rotate'} {preset.config.rotate ?? 0}° · {language === 'zh' ? '透明度' : 'Opacity'} {preset.config.opacity}%
                      </span>
                      <span className="text-primary text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.watermark.presets.applyPreset}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: EXPORT & BATCH ==================== */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t.watermark.export.format}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'image/png', label: 'PNG' + (language === 'zh' ? ' (无损)' : ' (Lossless)') },
                  { id: 'image/jpeg', label: 'JPEG' + (language === 'zh' ? ' (压缩)' : ' (Fast)') },
                  { id: 'image/webp', label: 'WebP' + (language === 'zh' ? ' (高效)' : ' (Modern)') },
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
                label={t.watermark.export.quality}
                value={config.exportQuality}
                min={10}
                max={100}
                step={1}
                unit="%"
                onChange={(exportQuality) => updateConfig({ exportQuality })}
              />
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t.watermark.export.scale}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: 0.5, label: '0.5x' },
                  { val: 1, label: language === 'zh' ? '1.0x (原始)' : '1.0x (Original)' },
                  { val: 1.5, label: '1.5x' },
                  { val: 2, label: language === 'zh' ? '2.0x (超清)' : '2.0x (HD)' },
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
              <label className="text-xs font-medium text-foreground">{t.watermark.export.filenameRule}</label>
              <input
                type="text"
                value={config.filenamePattern}
                onChange={(e) => updateConfig({ filenamePattern: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                placeholder="{name}_watermarked"
              />
              <span className="text-[10px] text-muted-foreground block">
                {t.watermark.export.filenameHint}
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
                <span>{t.watermark.export.downloadCurrent}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadAll}
                disabled={images.length === 0 || isExportingBatch}
                className="w-full gap-2 text-sm border-primary/40 hover:bg-primary/10 text-primary"
              >
                <Archive className="w-4 h-4" />
                <span>
                  {isExportingBatch 
                    ? `${t.watermark.export.packaging} ${batchProgress}%` 
                    : (language === 'zh' ? `批量打包全部 (${images.length} 张)` : `Export All as ZIP (${images.length})`)}
                </span>
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
          {t.common.reset}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleDownloadSingle}
          disabled={!activeImage}
          className="text-xs gap-1.5 h-8"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.common.download}</span>
        </Button>
      </div>
    </div>
  );
};
