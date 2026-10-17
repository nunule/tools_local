import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Square, 
  Paintbrush, 
  Eye, 
  Undo, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Check,
  Grid,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { RedactItem, RedactStyle, RedactShape, Point } from '@/types/privacyTools';
import { renderRedactions } from '@/utils/redactRenderer';
import { triggerDownload } from '@/utils/batchExporter';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

export const RedactStudioView: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('photo.jpg');
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Redaction state
  const [redacts, setRedacts] = useState<RedactItem[]>([]);
  const [activeShape, setActiveShape] = useState<RedactShape>('rect');
  const [activeStyle, setActiveStyle] = useState<RedactStyle>('mosaic');
  const [solidColor, setSolidColor] = useState<string>('#000000');
  const [mosaicSize, setMosaicSize] = useState<number>(14);
  const [blurRadius, setBlurRadius] = useState<number>(16);
  const [brushRadius, setBrushRadius] = useState<number>(28);

  // Viewport
  const [zoom, setZoom] = useState<number>(1);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Drawing tracking
  const [isDrawing, setIsDrawing] = useState(false);
  const currentRectRef = useRef<{ startX: number; startY: number } | null>(null);
  const currentBrushPointsRef = useRef<Point[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image object
  useEffect(() => {
    if (!imageSrc) {
      setBaseImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBaseImage(img);
      setRedacts([]);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Re-render canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isComparing) {
      ctx.drawImage(baseImage, 0, 0);
    } else {
      renderRedactions(ctx, baseImage, redacts);
    }
  }, [baseImage, redacts, isComparing]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle local sample image
  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 680;
    const ctx = canvas.getContext('2d')!;

    // Clean background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1000, 680);

    // Simulated sensitive order / invoice card
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 60, 840, 560, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('电商平台敏感发货单 / 快递物流面单', 120, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillText('收件人姓名：张伟', 120, 180);
    ctx.fillText('联系手机号：138-8888-9999', 120, 220);
    ctx.fillText('详细收货地址：北京市朝阳区望京科技园B座1208室', 120, 260);
    ctx.fillText('快递单号：SF1082948291048', 120, 300);
    ctx.fillText('身份证件号：110101199003072381', 120, 340);
    ctx.fillText('订单商品：高端数码相机 x 1 台 (实付 ¥12,999)', 120, 380);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillText('⚠️ 演示提示：请使用左侧的【马赛克】、【高斯模糊】或【纯色覆盖】框选/涂抹以上姓名和手机号', 120, 480);

    setImageSrc(canvas.toDataURL('image/png'));
    setImageName('sensitive_invoice_demo.png');
  };

  // Upload file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => setImageSrc(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Convert mouse event coordinates to canvas pixel space
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Mouse handlers for drawing redact regions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!baseImage) return;
    setIsDrawing(true);
    const pos = getCanvasCoords(e);

    if (activeShape === 'rect') {
      currentRectRef.current = { startX: pos.x, startY: pos.y };
    } else {
      currentBrushPointsRef.current = [pos];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !baseImage) return;
    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeShape === 'rect' && currentRectRef.current) {
      redraw();
      const x = Math.min(currentRectRef.current.startX, pos.x);
      const y = Math.min(currentRectRef.current.startY, pos.y);
      const w = Math.abs(pos.x - currentRectRef.current.startX);
      const h = Math.abs(pos.y - currentRectRef.current.startY);

      // Render temporary preview rectangle
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    } else if (activeShape === 'brush') {
      currentBrushPointsRef.current.push(pos);
      // Fast live stroke preview
      ctx.save();
      ctx.strokeStyle = activeStyle === 'solid' ? solidColor : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = brushRadius;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = currentBrushPointsRef.current;
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getCanvasCoords(e);

    if (activeShape === 'rect' && currentRectRef.current) {
      const x = Math.min(currentRectRef.current.startX, pos.x);
      const y = Math.min(currentRectRef.current.startY, pos.y);
      const w = Math.abs(pos.x - currentRectRef.current.startX);
      const h = Math.abs(pos.y - currentRectRef.current.startY);

      if (w > 5 && h > 5) {
        const newItem: RedactItem = {
          id: `redact_${Date.now()}`,
          shape: 'rect',
          style: activeStyle,
          solidColor,
          mosaicSize,
          blurRadius,
          x,
          y,
          width: w,
          height: h,
        };
        setRedacts((prev) => [...prev, newItem]);
      }
      currentRectRef.current = null;
    } else if (activeShape === 'brush' && currentBrushPointsRef.current.length > 0) {
      const newItem: RedactItem = {
        id: `redact_${Date.now()}`,
        shape: 'brush',
        style: activeStyle,
        solidColor,
        mosaicSize,
        blurRadius,
        brushRadius,
        points: [...currentBrushPointsRef.current],
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      setRedacts((prev) => [...prev, newItem]);
      currentBrushPointsRef.current = [];
    }
  };

  const handleUndo = () => {
    setRedacts((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setRedacts([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const ext = imageName.split('.').pop() || 'png';
        const rawName = imageName.replace(/\.[^/.]+$/, '');
        triggerDownload(blob, `${rawName}_redacted.${ext}`);
        confetti({ particleCount: 50, spread: 60 });
      }
    }, 'image/png');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Center Canvas Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Floating Top Bar */}
        <div className="h-12 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {baseImage ? imageName : '未加载图片'}
            </span>
            {baseImage && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {baseImage.width} × {baseImage.height} px
              </Badge>
            )}
            {redacts.length > 0 && (
              <Badge variant="success" className="text-[10px]">
                已打码 {redacts.length} 处
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {baseImage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={redacts.length === 0}
                  className="h-7 text-xs gap-1"
                  title="撤销上一次遮挡 (Ctrl + Z)"
                >
                  <Undo className="w-3.5 h-3.5" />
                  <span>撤销</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={redacts.length === 0}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空</span>
                </Button>

                <div className="w-[1px] h-4 bg-border mx-1" />

                <Button
                  variant={isComparing ? 'destructive' : 'ghost'}
                  size="sm"
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  className="h-7 text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>按住对比</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 text-xs gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出已脱敏图片</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Canvas Workspace Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-auto flex items-center justify-center p-6 bg-muted/20 select-none"
        >
          {baseImage ? (
            <div 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="relative shadow-2xl rounded-sm border border-border/60 transition-transform"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="cursor-crosshair block"
              />
            </div>
          ) : (
            <div className="max-w-md w-full p-8 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-3">
                <Paintbrush className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                上传需要隐私遮挡的照片或账单
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                支持框选或涂抹手机号、姓名、住址、订单号，支持纯色、马赛克、高斯模糊
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
                    <span>选择本地文件</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="gap-1.5 border-teal-500/30 text-teal-500 hover:bg-teal-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>试用敏感订单样例</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Panel */}
      <div className="w-72 lg:w-80 border-l border-border bg-card/70 backdrop-blur-md p-4 flex flex-col justify-between shrink-0 select-none">
        <div className="space-y-5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">
              隐私遮挡工具
            </h4>
            <p className="text-[11px] text-muted-foreground">
              选择涂抹模式与遮罩效果，在左侧画面直接涂抹或框选
            </p>
          </div>

          {/* Tool Shape */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">涂抹形状</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveShape('rect')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  activeShape === 'rect'
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>矩形框选</span>
              </button>

              <button
                onClick={() => setActiveShape('brush')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  activeShape === 'brush'
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>自由涂抹笔刷</span>
              </button>
            </div>
          </div>

          {/* Mask Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">遮蔽效果类型</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'mosaic', label: '马赛克' },
                { id: 'blur', label: '高斯模糊' },
                { id: 'solid', label: '纯色块' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveStyle(st.id as RedactStyle)}
                  className={`py-2 text-xs rounded-lg border font-medium transition-all ${
                    activeStyle === st.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Parameters */}
          {activeStyle === 'mosaic' && (
            <Slider
              label="马赛克颗粒大小 (Block Size)"
              value={mosaicSize}
              min={6}
              max={36}
              step={2}
              unit="px"
              onChange={setMosaicSize}
            />
          )}

          {activeStyle === 'blur' && (
            <Slider
              label="模糊半径 (Blur Radius)"
              value={blurRadius}
              min={6}
              max={40}
              step={2}
              unit="px"
              onChange={setBlurRadius}
            />
          )}

          {activeStyle === 'solid' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">纯色覆盖颜色</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { color: '#000000', label: '纯黑' },
                  { color: '#ffffff', label: '纯白' },
                  { color: '#64748b', label: '深灰' },
                  { color: '#ef4444', label: '警戒红' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setSolidColor(c.color)}
                    className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 ${
                      solidColor === c.color ? 'border-primary ring-1 ring-primary' : 'border-border'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c.color }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeShape === 'brush' && (
            <Slider
              label="画笔笔刷粗细 (Brush Size)"
              value={brushRadius}
              min={10}
              max={80}
              step={2}
              unit="px"
              onChange={setBrushRadius}
            />
          )}
        </div>

        {/* Bottom Tip */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
            <span>数学级不可逆保护</span>
          </div>
          <p>
            打码直接修改图像底层像素数据，不可被逆向还原，保障个人敏感隐私百分之百安全。
          </p>
        </div>
      </div>
    </div>
  );
};
