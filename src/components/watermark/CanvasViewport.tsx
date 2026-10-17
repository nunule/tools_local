import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Eye, 
  Grid, 
  Upload, 
  Sparkles, 
  Download,
  FileImage,
  Move
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { renderWatermarkedImage, canvasToBlob, formatFileSize } from '@/utils/watermarkRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const CanvasViewport: React.FC = () => {
  const {
    images,
    activeImageId,
    config,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isComparing,
    setIsComparing,
    showGrid,
    setShowGrid,
    addImages,
    loadSampleImage,
    updateConfig
  } = useWatermarkStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeImage = images.find((img) => img.id === activeImageId);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isRendering, setIsRendering] = useState(false);

  // Cached image object
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Reset pan when switching active image
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    loadedImageRef.current = null;
  }, [activeImageId]);

  // Load and cache active image HTMLImageElement
  useEffect(() => {
    if (!activeImage) {
      loadedImageRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageRef.current = img;
      renderCurrentCanvas();
    };
    img.src = activeImage.dataUrl;
  }, [activeImage?.dataUrl]);

  // Re-render watermark when config or compare changes
  const renderCurrentCanvas = useCallback(async () => {
    const img = loadedImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    setIsRendering(true);
    try {
      if (isComparing) {
        // Show original image without watermark
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      } else {
        // Render with watermark applied
        const rendered = await renderWatermarkedImage(img, config, {
          scale: 1, // Preview at full native resolution
          filename: activeImage?.name
        });

        canvas.width = rendered.width;
        canvas.height = rendered.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(rendered, 0, 0);
        }
      }
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [config, isComparing, activeImage?.name]);

  useEffect(() => {
    if (loadedImageRef.current) {
      renderCurrentCanvas();
    }
  }, [config, isComparing, renderCurrentCanvas]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || true) {
      const delta = e.deltaY * -0.0015;
      const newZoom = Math.max(0.1, Math.min(4, +(zoom + delta).toFixed(2)));
      setZoom(newZoom);
    }
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Drag and drop image upload handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter((file) => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      await processUploadedFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle direct file input
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        await processUploadedFiles(files);
      }
    }
    e.target.value = '';
  };

  // Process files to Base64 and measure dimensions
  const processUploadedFiles = async (files: File[]) => {
    const loadedList = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ file: File; name: string; size: number; type: string; dataUrl: string; width: number; height: number }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const img = new Image();
              img.onload = () => {
                resolve({
                  file,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  dataUrl,
                  width: img.width,
                  height: img.height
                });
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
          })
      )
    );

    addImages(loadedList);
  };

  // Clipboard paste support (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        await processUploadedFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Fit to screen calculation
  const handleFitScreen = () => {
    if (!containerRef.current || !activeImage) return;
    const containerW = containerRef.current.clientWidth - 80;
    const containerH = containerRef.current.clientHeight - 80;

    const scaleW = containerW / activeImage.width;
    const scaleH = containerH / activeImage.height;
    const fitScale = Math.min(scaleW, scaleH, 1);

    setZoom(+fitScale.toFixed(2));
    setPan({ x: 0, y: 0 });
  };

  if (!activeImage) {
    return (
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-muted/20 relative overflow-hidden"
      >
        <div className="max-w-xl w-full border-2 border-dashed border-border/80 hover:border-primary/60 transition-all rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1">
            拖入图片，开始添加水印
          </h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            支持 PNG、JPG、WebP、GIF，可多选或使用 Cmd/Ctrl + V 粘贴。
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button variant="default" size="default" className="gap-2 pointer-events-none shadow-md">
                <FileImage className="w-4 h-4" />
                选择本地图片
              </Button>
            </label>

            <Button
              variant="outline"
              size="default"
              onClick={loadSampleImage}
              className="gap-2 border-primary/30 hover:bg-primary/10 text-primary"
            >
              <Sparkles className="w-4 h-4" />
              使用示例图
            </Button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`flex-1 h-full relative overflow-hidden flex items-center justify-center select-none ${
        showGrid ? 'canvas-checkerboard' : 'bg-muted/30'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Top Floating Viewport Toolbar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* Left: Active Image Info */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border shadow-sm text-xs">
          <span className="font-semibold text-foreground max-w-[140px] truncate" title={activeImage.name}>
            {activeImage.name}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="font-mono text-muted-foreground">
            {activeImage.width} × {activeImage.height} px
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="font-mono text-muted-foreground">
            {formatFileSize(activeImage.size)}
          </span>
          {isRendering && (
            <Badge variant="warning" className="text-[10px] py-0 px-1 animate-pulse">
              渲染中...
            </Badge>
          )}
        </div>

        {/* Right: Zoom & View Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-card/90 backdrop-blur-md p-1 rounded-lg border border-border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            title="缩小 (Ctrl + -)"
            className="h-7 w-7 text-foreground/80 hover:text-foreground"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <button
            onClick={resetZoom}
            title="点击恢复 100% (1:1)"
            className="px-2 py-0.5 text-xs font-mono text-foreground/90 hover:bg-muted rounded"
          >
            {Math.round(zoom * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            title="放大 (Ctrl + +)"
            className="h-7 w-7 text-foreground/80 hover:text-foreground"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="w-[1px] h-4 bg-border mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitScreen}
            title="自适应画布大小"
            className="h-7 w-7 text-foreground/80 hover:text-foreground"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { resetZoom(); setPan({ x: 0, y: 0 }); }}
            title="重置居中"
            className="h-7 w-7 text-foreground/80 hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <div className="w-[1px] h-4 bg-border mx-0.5" />

          <Button
            variant={showGrid ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
            title="切换透明棋盘背景"
            className="h-7 w-7"
          >
            <Grid className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant={isComparing ? 'destructive' : 'ghost'}
            size="sm"
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            onClick={() => setIsComparing(!isComparing)}
            title="按住或点击对比无水印原图"
            className="h-7 px-2 text-xs gap-1 font-medium select-none"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isComparing ? '查看原图' : '对比'}</span>
          </Button>
        </div>
      </div>

      {/* Floating Canvas Centerpiece */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.08s ease-out'
        }}
        className="relative transition-transform duration-75 shadow-2xl rounded-sm overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="block max-w-none"
        />

        {isComparing && (
          <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-semibold shadow-md pointer-events-none">
            原图预览 (无水印)
          </div>
        )}
      </div>

      {/* Drag hints badge */}
      <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-muted-foreground bg-card/60 backdrop-blur-xs px-2 py-1 rounded border border-border/40 flex items-center gap-1.5">
        <Move className="w-3 h-3" />
        <span>拖拽平移 · 滚轮缩放 · 双击居中</span>
      </div>
    </div>
  );
};
