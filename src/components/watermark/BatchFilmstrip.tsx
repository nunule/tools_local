import React from 'react';
import { 
  Plus, 
  Trash2, 
  Archive, 
  X, 
  Image as ImageIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/utils/watermarkRenderer';
import { exportAllImagesAsZip } from '@/utils/batchExporter';

export const BatchFilmstrip: React.FC = () => {
  const {
    images,
    activeImageId,
    setActiveImage,
    removeImage,
    clearAllImages,
    addImages,
    config,
    isExportingBatch,
    batchProgress,
    setExportingBatch
  } = useWatermarkStore();

  if (images.length === 0) return null;

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        Promise.all(
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
        ).then((items) => addImages(items));
      }
    }
    e.target.value = '';
  };

  const handleBatchZip = async () => {
    if (images.length === 0 || isExportingBatch) return;
    await exportAllImagesAsZip(images, config, setExportingBatch);
  };

  return (
    <div className="h-20 border-t border-border bg-card/85 backdrop-blur-md px-4 flex items-center justify-between gap-4 shrink-0 select-none z-20">
      {/* Left Thumbnail Strip */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar flex-1 min-w-0">
        {images.map((img, idx) => {
          const isActive = img.id === activeImageId;
          return (
            <div
              key={img.id}
              onClick={() => setActiveImage(img.id)}
              className={`group relative shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                isActive
                  ? 'border-primary ring-2 ring-primary/30 shadow-md scale-105'
                  : 'border-border/60 hover:border-border hover:brightness-105 opacity-80 hover:opacity-100'
              }`}
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />

              {/* Index badge */}
              <div className="absolute bottom-0.5 left-1 text-[9px] font-mono text-white/90 bg-black/60 px-1 rounded">
                #{idx + 1}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white/90 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="移除此图"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}

        {/* Add more button */}
        <label className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-border/80 hover:border-primary/60 flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddMore}
            className="hidden"
          />
          <Plus className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium">添加</span>
        </label>
      </div>

      {/* Right Batch Actions */}
      <div className="flex items-center gap-2 shrink-0 border-l border-border/60 pl-3">
        <div className="flex flex-col text-right hidden sm:flex">
          <span className="text-xs font-medium text-foreground">
            已导入 <span className="font-mono text-primary">{images.length}</span> 张
          </span>
          <button
            onClick={clearAllImages}
            className="text-[11px] text-muted-foreground hover:text-destructive text-right transition-colors"
          >
            清空列表
          </button>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleBatchZip}
          disabled={isExportingBatch}
          className="gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Archive className="w-4 h-4" />
          <span>{isExportingBatch ? `打包中 ${batchProgress}%` : '一键打包 ZIP'}</span>
        </Button>
      </div>
    </div>
  );
};
