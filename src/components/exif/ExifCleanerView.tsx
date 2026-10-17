import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Camera, 
  Clock, 
  Sliders, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Archive 
} from 'lucide-react';
import { ExifReport } from '@/types/privacyTools';
import { parsePhotoExif, stripExifMetadata } from '@/utils/exifParser';
import { triggerDownload } from '@/utils/batchExporter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';

export const ExifCleanerView: React.FC = () => {
  const { t, language } = useI18n();
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
    if (language === 'en') {
      ctx.fillText('Original iPhone 15 Pro Photo (Contains High-Precision GPS)', 600, 360);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText('Longitude 116.4074° E · Latitude 39.9042° N · Taken 2026-10-17 10:24', 600, 420);
    } else {
      ctx.fillText('iPhone 15 Pro 拍摄原图 (模拟包含精确GPS位置)', 600, 360);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText('经度 116.4074° E · 纬度 39.9042° N · 拍摄时间 2026-10-17 10:24', 600, 420);
    }

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
      riskReasons: language === 'en' ? [
        'Contains precise GPS coordinates (39.90420°, 116.40740°) which reveals exact home or workplace location',
        'Contains original timestamp (2026:10:17 10:24:32)',
        'Contains hardware device model (Apple iPhone 15 Pro Max)',
      ] : [
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
      alert(language === 'zh' ? '清除元数据失败，请重试' : 'Failed to strip metadata, please retry');
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
      alert(language === 'zh' ? '批量处理出错' : 'Error in batch processing');
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
              {report ? report.fileName : t.exif.title}
            </span>
            {batchFiles.length > 1 && (
              <Badge variant="default" className="text-[10px]">
                {language === 'zh' ? `批量 ${batchFiles.length} 张` : `Batch: ${batchFiles.length}`}
              </Badge>
            )}
            {cleanedBlob && (
              <Badge variant="success" className="text-[10px] gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t.exif.cleanedBadge}
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
                <span>{isStripping ? t.common.processing : t.exif.stripAndDownload}</span>
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
                <span>
                  {isBatchProcessing 
                    ? `${t.watermark.export.packaging} ${batchProgress}%` 
                    : (language === 'zh' ? `全部一键打包 ZIP (${batchFiles.length} 张)` : `Export All as ZIP (${batchFiles.length})`)}
                </span>
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
                    <span>{t.exif.highRiskAlert}</span>
                  </div>
                )}
              </div>

              {/* Status summary */}
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground bg-card/60 px-4 py-2 rounded-xl border border-border/60">
                <span>{t.exif.processingMethod}</span>
                <span className="text-emerald-500 font-medium">100% {t.common.offlineBadge}</span>
              </div>
            </div>
          ) : (
            <div className="max-w-md w-full p-8 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {t.exif.dropTitle}
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                {t.exif.dropDesc}
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
                    <span>{t.exif.selectPhotos}</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.exif.sampleBtn}</span>
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
              {t.exif.reportTitle}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {t.exif.reportSubtitle}
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
                      ? t.exif.riskHighTitle
                      : report.riskLevel === 'medium'
                      ? t.exif.riskMediumTitle
                      : t.exif.riskLowTitle}
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
                  <span>{t.exif.gpsSection}</span>
                </div>

                {report.gps ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground">{t.exif.latitude}</span>
                      <span className="font-mono text-foreground">{report.gps.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground">{t.exif.longitude}</span>
                      <span className="font-mono text-foreground">{report.gps.longitude.toFixed(6)}°</span>
                    </div>
                    {report.gps.altitude && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">{t.exif.altitude}</span>
                        <span className="font-mono text-foreground">{report.gps.altitude} m</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">{t.exif.noGps}</p>
                )}
              </div>

              {/* Camera & Hardware Section */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Camera className="w-3.5 h-3.5 text-sky-500" />
                  <span>{t.exif.cameraSection}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">{t.exif.make}</span>
                    <span className="font-medium text-foreground">{report.camera?.make || (language === 'zh' ? '未知' : 'Unknown')}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">{t.exif.model}</span>
                    <span className="font-medium text-foreground">{report.camera?.model || (language === 'zh' ? '未知' : 'Unknown')}</span>
                  </div>
                  {report.camera?.lensModel && (
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground">{t.exif.lens}</span>
                      <span className="font-mono text-foreground text-[10px] truncate max-w-[160px]" title={report.camera.lensModel}>
                        {report.camera.lensModel}
                      </span>
                    </div>
                  )}
                  {report.camera?.software && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">{t.exif.software}</span>
                      <span className="font-mono text-foreground">{report.camera.software}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing Section */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.exif.timingSection}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">{t.exif.dateTimeOriginal}</span>
                    <span className="font-mono text-foreground">{report.timing?.dateTimeOriginal || (language === 'zh' ? '未记录' : 'Not recorded')}</span>
                  </div>
                  {report.timing?.offsetTime && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">{t.exif.timezone}</span>
                      <span className="font-mono text-foreground">{report.timing.offsetTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Exposure Settings */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Sliders className="w-3.5 h-3.5 text-teal-500" />
                  <span>{t.exif.exposureSection}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">{t.exif.iso}</div>
                    <div className="font-mono font-bold text-foreground">{report.exposure?.iso || (language === 'zh' ? '自动' : 'Auto')}</div>
                  </div>
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">{t.exif.fNumber}</div>
                    <div className="font-mono font-bold text-foreground">f/{report.exposure?.fNumber || '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">{t.exif.shutter}</div>
                    <div className="font-mono font-bold text-foreground">{report.exposure?.exposureTime || '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-card border border-border/60">
                    <div className="text-[10px] text-muted-foreground">{t.exif.focalLength}</div>
                    <div className="font-mono font-bold text-foreground">{report.exposure?.focalLength || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              {language === 'zh' ? '请在左侧上传照片以生成详细信息报告' : 'Upload a photo on the left to generate EXIF report'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
