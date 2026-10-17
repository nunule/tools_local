import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Camera, 
  Clock, 
  Sliders, 
  Download, 
  Upload, 
  Sparkles, 
  Trash2, 
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Archive
} from 'lucide-react';
import { ExifReport } from '@/types/privacyTools';
import { parsePhotoExif, stripExifMetadata } from '@/utils/exifParser';
import { triggerDownload } from '@/utils/batchExporter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';

export const ExifCleanerView: React.FC = () => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [report, setReport] = useState<ExifReport | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null);

  // Batch states
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Load sample image with simulated EXIF metadata
  const handleLoadSample = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 800);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('iPhone 15 Pro 拍摄原图 (模拟包含精确GPS位置)', 600, 360);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText('经度 116.4074° E · 纬度 39.9042° N · 拍摄时间 2026-10-17 10:24', 600, 420);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setPhotoPreview(dataUrl);

    // Mock realistic report
    const mockReport: ExifReport = {
      fileName: 'IMG_4829_IPHONE_CAMERA.JPG',
      fileSize: 3482904,
      fileType: 'image/jpeg',
      hasGps: true,
      gps: {
        latitude: 39.9042,
        longitude: 116.4074,
        altitude: 48.5,
      },
      camera: {
        make: 'Apple',
        model: 'iPhone 15 Pro Max',
        lensModel: 'iPhone 15 Pro Max back triple camera 6.78mm f/1.78',
        software: 'iOS 18.2',
      },
      timing: {
        dateTimeOriginal: '2026:10:17 10:24:32',
        dateTimeDigitized: '2026:10:17 10:24:32',
        offsetTime: '+08:00',
      },
      exposure: {
        iso: 64,
        fNumber: 1.78,
        exposureTime: '1/250s',
        focalLength: '24mm',
        flash: 'Off, did not fire',
      },
      rawDetails: {
        Make: 'Apple',
        Model: 'iPhone 15 Pro Max',
        GPSLatitude: [39, 54, 15.12],
        GPSLongitude: [116, 24, 26.64],
        DateTimeOriginal: '2026:10:17 10:24:32',
      },
      riskLevel: 'high',
      riskReasons: [
        '包含高精度 GPS 定位信息 (39.90420°, 116.40740°)，极易泄露家庭或工作住址',
        '包含精确拍摄时间戳 (2026:10:17 10:24:32)',
        '包含设备硬件型号 (Apple iPhone 15 Pro Max)',
      ],
    };

    setReport(mockReport);
    setCleanedBlob(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      setPhotoFile(file);
      setCleanedBlob(null);

      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      const parsedReport = await parsePhotoExif(file, file.name);
      setReport(parsedReport);
    } else {
      // Multi-file batch mode
      setBatchFiles(files);
      const first = files[0];
      setPhotoFile(first);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(first);

      const parsedReport = await parsePhotoExif(first, first.name);
      setReport(parsedReport);
    }
  };

  // Strip single image EXIF
  const handleStripSingle = async () => {
    if (!photoPreview) return;
    setIsStripping(true);

    try {
      const { cleanBlob } = await stripExifMetadata(photoPreview, 'image/jpeg', 0.95);
      setCleanedBlob(cleanBlob);

      const cleanFileName = (photoFile?.name || report?.fileName || 'photo.jpg').replace(/\.[^/.]+$/, '_clean.jpg');
      triggerDownload(cleanBlob, cleanFileName);

      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      alert('清除元数据失败，请重试');
    } finally {
      setIsStripping(false);
    }
  };

  // Strip all batch images and package as ZIP
  const handleBatchStripZip = async () => {
    if (batchFiles.length === 0) return;
    setIsBatchProcessing(true);
    setBatchProgress(0);

    const zip = new JSZip();
    const folder = zip.folder('cleaned_photos') || zip;

    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });

        const { cleanBlob } = await stripExifMetadata(dataUrl, 'image/jpeg', 0.95);
        const cleanName = file.name.replace(/\.[^/.]+$/, '_clean.jpg');
        folder.file(cleanName, cleanBlob);

        setBatchProgress(Math.round(((i + 1) / batchFiles.length) * 85));
      }

      setBatchProgress(90);
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
        setBatchProgress(Math.round(90 + (meta.percent / 100) * 10));
      });

      triggerDownload(zipBlob, `photos_exif_cleaned_${Date.now()}.zip`);
      confetti({ particleCount: 80, spread: 70 });
    } catch (err) {
      alert('批量处理出错');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(0);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Left side: Photo preview and clean status */}
      <div className="flex-1 flex flex-col overflow-hidden relative border-r border-border">
        {/* Top toolbar */}
        <div className="h-12 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {report ? report.fileName : '照片信息清理 (EXIF / GPS / 设备)'}
            </span>
            {batchFiles.length > 1 && (
              <Badge variant="default" className="text-[10px]">
                批量 {batchFiles.length} 张
              </Badge>
            )}
            {cleanedBlob && (
              <Badge variant="success" className="text-[10px] gap-1">
                <CheckCircle2 className="w-3 h-3" />
                已脱敏擦除全部 EXIF
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <Button
                variant="default"
                size="sm"
                onClick={handleStripSingle}
                disabled={isStripping}
                className="h-7 text-xs gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isStripping ? '处理中...' : '一键清除 EXIF 并下载'}</span>
              </Button>
            )}

            {batchFiles.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchStripZip}
                disabled={isBatchProcessing}
                className="h-7 text-xs gap-1.5"
              >
                <Archive className="w-3.5 h-3.5 text-primary" />
                <span>{isBatchProcessing ? `打包中 ${batchProgress}%` : `全部一键打包 ZIP (${batchFiles.length} 张)`}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Workspace Preview */}
        <div className="flex-1 p-6 flex items-center justify-center bg-muted/20 overflow-auto">
          {photoPreview ? (
            <div className="max-w-2xl w-full flex flex-col items-center gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl max-h-[60vh] bg-card">
                <img
                  src={photoPreview}
                  alt="Target"
                  className="max-h-[60vh] w-auto object-contain"
                />

                {report?.hasGps && (
                  <div className="absolute top-3 left-3 bg-red-500/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>含精确 GPS 隐私定位</span>
                  </div>
                )}
              </div>

              {/* Status summary */}
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground bg-card/60 px-4 py-2 rounded-xl border border-border/60">
                <span>处理方式：HTML5 Canvas 纯客户端重新编码</span>
                <span className="text-emerald-500 font-medium">100% 抹除 GPS、拍摄时间与设备序列号</span>
              </div>
            </div>
          ) : (
            <div className="max-w-md w-full p-8 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                拖拽照片以检测和清除隐私信息
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                手机原图通常附带有拍摄经纬度、具体门牌号附近定位、拍摄时间与设备型号。我们帮你在分享前一键清空。
              </p>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button variant="default" size="sm" className="gap-1.5 pointer-events-none">
                    <Upload className="w-3.5 h-3.5" />
                    <span>选择手机原图 (支持多选)</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>加载模拟 GPS 样例</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Detailed EXIF Inspection Panel */}
      <div className="w-80 lg:w-96 p-4 flex flex-col overflow-y-auto bg-card/70 backdrop-blur-md select-none">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">
              EXIF 隐私风险检测报告
            </h4>
            <p className="text-[11px] text-muted-foreground">
              解析照片底层嵌入的二进制元数据并评估隐私泄露等级
            </p>
          </div>

          {report ? (
            <div className="space-y-4">
              {/* Risk Level Banner */}
              <div
                className={`p-3 rounded-xl border space-y-1.5 ${
                  report.riskLevel === 'high'
                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                    : report.riskLevel === 'medium'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {report.riskLevel === 'high' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>
                    {report.riskLevel === 'high'
                      ? '高危风险：已检测到隐私位置信息'
                      : report.riskLevel === 'medium'
                      ? '中度风险：包含拍摄设备与时间'
                      : '安全：未发现敏感 EXIF'}
                  </span>
                </div>
                <ul className="text-[11px] space-y-1 list-disc list-inside text-foreground/80">
                  {report.riskReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* GPS Coordinates Section */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>GPS 拍摄地理位置</span>
                </div>

                {report.gps ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground">纬度 (Latitude)</span>
                      <span className="font-mono text-foreground">{report.gps.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground">经度 (Longitude)</span>
                      <span className="font-mono text-foreground">{report.gps.longitude.toFixed(6)}°</span>
                    </div>
                    {report.gps.altitude && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">海拔 (Altitude)</span>
                        <span className="font-mono text-foreground">{report.gps.altitude} m</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">无地理坐标信息</p>
                )}
              </div>

              {/* Camera & Hardware Section */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Camera className="w-3.5 h-3.5 text-sky-500" />
                  <span>拍摄设备与镜头型号</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">设备品牌</span>
                    <span className="font-medium text-foreground">{report.camera?.make || '未知'}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">设备型号</span>
                    <span className="font-medium text-foreground">{report.camera?.model || '未知'}</span>
                  </div>
                  {report.camera?.lensModel && (
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground">镜头</span>
                      <span className="font-mono text-foreground text-[10px] truncate max-w-[160px]" title={report.camera.lensModel}>
                        {report.camera.lensModel}
                      </span>
                    </div>
                  )}
                  {report.camera?.software && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">固件系统</span>
                      <span className="font-mono text-foreground">{report.camera.software}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing Section */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>拍摄时间戳</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">拍摄原始时间</span>
                    <span className="font-mono text-foreground">{report.timing?.dateTimeOriginal || '未记录'}</span>
                  </div>
                  {report.timing?.offsetTime && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">时区</span>
                      <span className="font-mono text-foreground">{report.timing.offsetTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Exposure Settings */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Sliders className="w-3.5 h-3.5 text-teal-500" />
                  <span>相机曝光参数</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">ISO 感光度</div>
                    <div className="font-mono font-bold text-foreground">{report.exposure?.iso || '自动'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">光圈 F 值</div>
                    <div className="font-mono font-bold text-foreground">f/{report.exposure?.fNumber || '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">快门时间</div>
                    <div className="font-mono font-bold text-foreground">{report.exposure?.exposureTime || '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">等效焦距</div>
                    <div className="font-mono font-bold text-foreground">{report.exposure?.focalLength || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              请在左侧上传照片以生成详细信息报告
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
