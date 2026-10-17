import { WatermarkConfig } from '@/types/watermark';

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  text: '仅供业务核验使用\n他用无效 严禁转载',
  mode: 'tile',
  fontSize: 32,
  fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontWeight: '600',
  lineHeight: 1.35,
  letterSpacing: 2,
  color: '#ffffff',
  opacity: 45, // 45% white transparent
  rotate: -30,
  blendMode: 'source-over',
  gapX: 120,
  gapY: 100,
  stagger: true,
  position: 'bottom-right',
  offsetX: 40,
  offsetY: 40,
  stroke: {
    enabled: true,
    color: '#000000',
    width: 1.5,
  },
  shadow: {
    enabled: true,
    color: 'rgba(0, 0, 0, 0.4)',
    blur: 4,
    offsetX: 1,
    offsetY: 2,
  },
  exportFormat: 'image/png',
  exportQuality: 92,
  scale: 1,
  filenamePattern: '{name}_watermarked',
};

export interface WatermarkPreset {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'creative' | 'legal';
  config: Partial<WatermarkConfig>;
}

export const WATERMARK_PRESETS: WatermarkPreset[] = [
  {
    id: 'confidential-tiled',
    name: '防盗用全屏平铺',
    description: '白色半透明斜角交错防复制水印，带细微深色描边，适配任何亮/暗背景',
    category: 'security',
    config: {
      text: '内部资料 请勿外传\nCONFIDENTIAL',
      mode: 'tile',
      fontSize: 34,
      rotate: -30,
      opacity: 40,
      color: '#ffffff',
      stagger: true,
      gapX: 120,
      gapY: 100,
      stroke: { enabled: true, color: '#000000', width: 1.5 },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', blur: 3, offsetX: 1, offsetY: 1 }
    }
  },
  {
    id: 'id-verification',
    name: '证件审核专用',
    description: '办理实名认证/入职/租房身份证件，防止被挪用欺诈',
    category: 'legal',
    config: {
      text: '仅供 {{date}} 办理业务核验使用\n复印及他用一律无效',
      mode: 'tile',
      fontSize: 28,
      rotate: -25,
      opacity: 55,
      color: '#ffffff',
      stagger: true,
      gapX: 90,
      gapY: 80,
      stroke: { enabled: true, color: 'rgba(15, 23, 42, 0.8)', width: 1.5 },
      shadow: { enabled: false, color: '#000000', blur: 0, offsetX: 0, offsetY: 0 }
    }
  },
  {
    id: 'minimal-corner',
    name: '右下角精细角标',
    description: '摄影照片与自媒体展示常用的经典右下角半透明水印',
    category: 'creative',
    config: {
      text: '© LocalBit Studio · {{date}}',
      mode: 'single',
      position: 'bottom-right',
      fontSize: 22,
      rotate: 0,
      offsetX: 32,
      offsetY: 32,
      opacity: 75,
      color: '#ffffff',
      stroke: { enabled: false, color: '#000000', width: 0 },
      shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.6)', blur: 6, offsetX: 0, offsetY: 2 }
    }
  },
  {
    id: 'center-stamp',
    name: '中心醒目印鉴',
    description: '大号半透明样本印章，覆盖居中位置',
    category: 'creative',
    config: {
      text: 'SAMPLE 样本预览\nDO NOT COPY',
      mode: 'single',
      position: 'center',
      fontSize: 64,
      rotate: -20,
      opacity: 35,
      color: '#ffffff',
      offsetX: 0,
      offsetY: 0,
      stroke: { enabled: true, color: 'rgba(0,0,0,0.5)', width: 2 },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.4)', blur: 8, offsetX: 2, offsetY: 4 }
    }
  },
  {
    id: 'dense-security',
    name: '高密防泄密栅格',
    description: '极其密集排列的斜角网格，杜绝任何局部截图裁剪',
    category: 'security',
    config: {
      text: '内部审核 {{date}}\n严禁外发',
      mode: 'tile',
      fontSize: 20,
      rotate: -45,
      opacity: 30,
      color: '#ffffff',
      gapX: 60,
      gapY: 50,
      stagger: true,
      stroke: { enabled: true, color: '#000000', width: 1 },
      shadow: { enabled: false, color: '#000000', blur: 0, offsetX: 0, offsetY: 0 }
    }
  }
];

export const FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (默认英文字体)', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Inter (现代无衬线)', value: 'Inter, -apple-system, sans-serif' },
  { label: '苹方 / 微软雅黑 (系统默认)', value: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '宋体 (传统衬线)', value: 'SimSun, "Songti SC", serif' },
  { label: '黑体 (粗黑)', value: '"SimHei", "Heiti SC", sans-serif' },
  { label: 'JetBrains Mono (等宽科技感)', value: '"JetBrains Mono", monospace' },
  { label: 'Impact (硬核粗体)', value: 'Impact, sans-serif' },
  { label: 'Georgia (优雅衬线)', value: 'Georgia, serif' }
];

export const QUICK_COLOR_PALETTE = [
  { label: '透亮纯白', color: '#ffffff', opacity: 45 },
  { label: '柔和浅灰', color: '#e2e8f0', opacity: 50 },
  { label: '冷调纯黑', color: '#090d16', opacity: 40 },
  { label: '警戒印红', color: '#ef4444', opacity: 60 },
  { label: '商务靛蓝', color: '#3b82f6', opacity: 55 },
  { label: '防伪金黄', color: '#eab308', opacity: 60 },
];
