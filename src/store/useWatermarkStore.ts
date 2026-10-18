import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  WatermarkConfig, 
  ImageItem, 
  ActiveToolTab, 
  WatermarkMode,
  SinglePosition 
} from '@/types/watermark';
import { DEFAULT_WATERMARK_CONFIG, WATERMARK_PRESETS, WatermarkPreset } from '@/constants/presets';

interface WatermarkStoreState {
  // Config
  config: WatermarkConfig;
  updateConfig: (patch: Partial<WatermarkConfig>) => void;
  resetConfig: () => void;
  applyPreset: (preset: WatermarkPreset) => void;

  // Images State
  images: ImageItem[];
  activeImageId: string | null;
  addImages: (newImages: { file?: File; name: string; size: number; type: string; dataUrl: string; width: number; height: number }[]) => void;
  removeImage: (id: string) => void;
  clearAllImages: () => void;
  setActiveImage: (id: string) => void;
  updateImageStatus: (id: string, status: ImageItem['status'], processedDataUrl?: string, processedSize?: number, error?: string) => void;
  loadSampleImage: () => void;

  // Canvas Viewport & UI State
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  
  isComparing: boolean;
  setIsComparing: (comparing: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;

  // Workspace
  activeTab: ActiveToolTab;
  setActiveTab: (tab: ActiveToolTab) => void;
  favoriteTools: ActiveToolTab[];
  toggleFavoriteTool: (tab: ActiveToolTab) => void;
  recentTools: ActiveToolTab[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  desktopFrame: boolean;
  setDesktopFrame: (val: boolean) => void;
  desktopModalOpen: boolean;
  setDesktopModalOpen: (open: boolean) => void;

  // Batch status
  isExportingBatch: boolean;
  batchProgress: number; // 0 - 100
  setExportingBatch: (isExporting: boolean, progress?: number) => void;
}

export const useWatermarkStore = create<WatermarkStoreState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_WATERMARK_CONFIG,
      updateConfig: (patch) => {
        set((state) => ({
          config: { ...state.config, ...patch }
        }));
      },
      resetConfig: () => {
        set({ config: DEFAULT_WATERMARK_CONFIG });
      },
      applyPreset: (preset) => {
        set((state) => ({
          config: { ...state.config, ...preset.config }
        }));
      },

      images: [],
      activeImageId: null,

      addImages: (newItems) => {
        const mappedItems: ImageItem[] = newItems.map((item) => ({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          file: item.file,
          name: item.name,
          size: item.size,
          type: item.type,
          width: item.width,
          height: item.height,
          dataUrl: item.dataUrl,
          aspectRatio: item.width / (item.height || 1),
          status: 'idle'
        }));

        set((state) => {
          const nextImages = [...state.images, ...mappedItems];
          return {
            images: nextImages,
            activeImageId: state.activeImageId || (nextImages[0] ? nextImages[0].id : null)
          };
        });
      },

      removeImage: (id) => {
        set((state) => {
          const remaining = state.images.filter((img) => img.id !== id);
          let nextActiveId = state.activeImageId;
          if (state.activeImageId === id) {
            nextActiveId = remaining.length > 0 ? remaining[0].id : null;
          }
          return {
            images: remaining,
            activeImageId: nextActiveId
          };
        });
      },

      clearAllImages: () => {
        set({ images: [], activeImageId: null });
      },

      setActiveImage: (id) => {
        set({ activeImageId: id });
      },

      updateImageStatus: (id, status, processedDataUrl, processedSize, error) => {
        set((state) => ({
          images: state.images.map((img) => 
            img.id === id 
              ? { ...img, status, processedDataUrl, processedSize, error }
              : img
          )
        }));
      },

      loadSampleImage: () => {
        // Generate high-quality SVG gradient badge demo image as Data URL
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Elegant modern mesh gradient
          const grad = ctx.createLinearGradient(0, 0, 1200, 800);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.4, '#1e1b4b');
          grad.addColorStop(0.7, '#1e293b');
          grad.addColorStop(1, '#090d16');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1200, 800);

          // Card container
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(100, 100, 1000, 600, 24);
          ctx.fill();
          ctx.stroke();

          // Accent spheres
          const circleGrad1 = ctx.createRadialGradient(350, 300, 20, 350, 300, 180);
          circleGrad1.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          circleGrad1.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = circleGrad1;
          ctx.beginPath();
          ctx.arc(350, 300, 180, 0, Math.PI * 2);
          ctx.fill();

          const circleGrad2 = ctx.createRadialGradient(850, 500, 20, 850, 500, 220);
          circleGrad2.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
          circleGrad2.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = circleGrad2;
          ctx.beginPath();
          ctx.arc(850, 500, 220, 0, Math.PI * 2);
          ctx.fill();

          // Sample card text
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 42px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('tools local', 600, 360);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '400 22px -apple-system, sans-serif';
          ctx.fillText('图片水印示例', 600, 420);

          ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
          ctx.font = '600 18px monospace';
          ctx.fillText('SAMPLE_DOCUMENT_PREVIEW.PNG [1200 x 800]', 600, 480);

          const sampleDataUrl = canvas.toDataURL('image/png');

          get().addImages([{
            name: 'sample_document.png',
            size: Math.round((sampleDataUrl.length * 3) / 4),
            type: 'image/png',
            width: 1200,
            height: 800,
            dataUrl: sampleDataUrl
          }]);
        }
      },

      zoom: 1,
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(4, zoom)) }),
      zoomIn: () => set((state) => ({ zoom: Math.min(4, +(state.zoom + 0.15).toFixed(2)) })),
      zoomOut: () => set((state) => ({ zoom: Math.max(0.1, +(state.zoom - 0.15).toFixed(2)) })),
      resetZoom: () => set({ zoom: 1 }),

      isComparing: false,
      setIsComparing: (isComparing) => set({ isComparing }),
      showGrid: false,
      setShowGrid: (showGrid) => set({ showGrid }),

      activeTab: 'watermark',
      setActiveTab: (activeTab) => set((state) => ({
        activeTab,
        recentTools: activeTab === 'about'
          ? state.recentTools
          : [activeTab, ...state.recentTools.filter((tab) => tab !== activeTab)].slice(0, 6),
      })),
      favoriteTools: ['watermark', 'redact'],
      toggleFavoriteTool: (tab) => set((state) => ({
        favoriteTools: state.favoriteTools.includes(tab)
          ? state.favoriteTools.filter((item) => item !== tab)
          : [...state.favoriteTools, tab],
      })),
      recentTools: ['watermark'],
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      theme: 'dark',
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        set({ theme });
      },
      desktopFrame: false,
      setDesktopFrame: (desktopFrame) => set({ desktopFrame }),
      desktopModalOpen: false,
      setDesktopModalOpen: (desktopModalOpen) => set({ desktopModalOpen }),

      isExportingBatch: false,
      batchProgress: 0,
      setExportingBatch: (isExportingBatch, progress = 0) => 
        set({ isExportingBatch, batchProgress: progress }),
    }),
    {
      name: 'tools-local-watermark-storage',
      partialize: (state) => ({
        config: state.config,
        theme: state.theme,
        desktopFrame: state.desktopFrame,
        sidebarOpen: state.sidebarOpen,
        favoriteTools: state.favoriteTools,
        recentTools: state.recentTools,
      })
    }
  )
);
