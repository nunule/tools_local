import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Download, 
  Upload, 
  Sparkles, 
  Printer 
} from 'lucide-react';
import { IDCopyConfig, IDDocType } from '@/types/privacyTools';
import { renderIDCertifiedCopy } from '@/utils/idCopyRenderer';
import { triggerDownload } from '@/utils/batchExporter';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import confetti from 'canvas-confetti';

export const IDCopyStudioView: React.FC = () => {
  const { t, language } = useI18n();
  const [frontDataUrl, setFrontDataUrl] = useState<string | null>(null);
  const [backDataUrl, setBackDataUrl] = useState<string | null>(null);

  const [config, setConfig] = useState<IDCopyConfig>({
    docType: 'id-card',
    purpose: language === 'zh' ? '入职材料审核' : 'Employment Verification',
    issuerOrg: language === 'zh' ? '某某科技有限公司' : 'Acme Corporation',
    validDays: 30,
    customWatermark: language === 'zh' ? '仅供办理入职使用 他用无效' : 'For employment verification only. Other use invalid.',
    maskIdSuffix: true,
    maskAddressDetail: true,
    maskBirthDate: false,
    watermarkOpacity: 55,
    watermarkAngle: -25,
    layout: 'a4-sheet',
  });

  // Keep purpose and customWatermark aligned on language switch if unchanged
  useEffect(() => {
    if (language === 'en' && config.purpose === '入职材料审核') {
      setConfig((prev) => ({
        ...prev,
        purpose: 'Employment Verification',
        issuerOrg: 'Acme Corporation',
        customWatermark: 'For employment verification only. Other use invalid.'
      }));
    } else if (language === 'zh' && config.purpose === 'Employment Verification') {
      setConfig((prev) => ({
        ...prev,
        purpose: '入职材料审核',
        issuerOrg: '某某科技有限公司',
        customWatermark: '仅供办理入职使用 他用无效'
      }));
    }
  }, [language]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load sample front & back ID card
  const handleLoadSample = () => {
    // Generate sample Front ID Card
    const canvasF = document.createElement('canvas');
    canvasF.width = 1000;
    canvasF.height = 630;
    const ctxF = canvasF.getContext('2d')!;

    // Card background
    ctxF.fillStyle = '#f1f5f9';
    ctxF.fillRect(0, 0, 1000, 630);

    // Header
    ctxF.fillStyle = '#0284c7';
    ctxF.font = 'bold 36px "Microsoft YaHei", sans-serif';
    ctxF.fillText(language === 'zh' ? '居民身份证' : 'IDENTITY CARD', 100, 90);

    // Text fields
    ctxF.fillStyle = '#334155';
    ctxF.font = '500 24px -apple-system, sans-serif';
    if (language === 'en') {
      ctxF.fillText('Name: David Miller', 100, 180);
      ctxF.fillText('Sex: M      Nationality: USA', 100, 240);
      ctxF.fillText('Birth: Aug 15, 1994', 100, 300);
      ctxF.fillText('Address: 888 Innovation Way, Suite 602, Silicon Valley, CA', 100, 360);
      ctxF.font = 'bold 32px monospace';
      ctxF.fillText('ID / SSN: 310115199408154829', 100, 520);
    } else {
      ctxF.fillText('姓名：王小明', 100, 180);
      ctxF.fillText('性别：男      民族：汉', 100, 240);
      ctxF.fillText('出生：1994 年 08 月 15 日', 100, 300);
      ctxF.fillText('住址：上海市浦东新区张江高科园区碧波路 888 弄 3 号楼 602 室', 100, 360);
      ctxF.font = 'bold 32px monospace';
      ctxF.fillText('公民身份号码：310115199408154829', 100, 520);
    }

    // Avatar box
    ctxF.fillStyle = '#cbd5e1';
    ctxF.fillRect(720, 140, 200, 260);
    ctxF.fillStyle = '#64748b';
    ctxF.font = '20px sans-serif';
    ctxF.textAlign = 'center';
    ctxF.fillText(language === 'zh' ? '免冠证件照' : 'PHOTO', 820, 275);
    ctxF.textAlign = 'start';

    // Generate sample Back ID Card
    const canvasB = document.createElement('canvas');
    canvasB.width = 1000;
    canvasB.height = 630;
    const ctxB = canvasB.getContext('2d')!;

    ctxB.fillStyle = '#f1f5f9';
    ctxB.fillRect(0, 0, 1000, 630);

    ctxB.fillStyle = '#dc2626';
    ctxB.font = 'bold 34px "Microsoft YaHei", sans-serif';
    ctxB.textAlign = 'center';
    ctxB.fillText(language === 'zh' ? '中华人民共和国' : 'NATIONAL REGISTRY', 500, 240);
    ctxB.fillText(language === 'zh' ? '居民身份证' : 'RESIDENT IDENTITY CARD', 500, 310);

    ctxB.fillStyle = '#334155';
    ctxB.font = '500 24px -apple-system, sans-serif';
    ctxB.textAlign = 'start';
    if (language === 'en') {
      ctxB.fillText('Issuing Authority: Police Department of Metro City', 240, 440);
      ctxB.fillText('Validity Period: 2020.08.15 - 2040.08.15', 240, 500);
    } else {
      ctxB.fillText('签发机关：上海市公安局浦东分局', 240, 440);
      ctxB.fillText('有效期限：2020.08.15 - 2040.08.15', 240, 500);
    }

    setFrontDataUrl(canvasF.toDataURL('image/png'));
    setBackDataUrl(canvasB.toDataURL('image/png'));
  };

  const redraw = useCallback(async () => {
    if (!frontDataUrl || !canvasRef.current) return;

    const imgFront = new Image();
    imgFront.crossOrigin = 'anonymous';
    imgFront.onload = async () => {
      let imgBack: HTMLImageElement | null = null;
      if (backDataUrl) {
        imgBack = new Image();
        imgBack.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          imgBack!.onload = resolve;
          imgBack!.src = backDataUrl;
        });
      }

      const generated = await renderIDCertifiedCopy(imgFront, imgBack, config);
      const targetCanvas = canvasRef.current;
      if (targetCanvas) {
        targetCanvas.width = generated.width;
        targetCanvas.height = generated.height;
        const ctx = targetCanvas.getContext('2d');
        if (ctx) ctx.drawImage(generated, 0, 0);
      }
    };
    imgFront.src = frontDataUrl;
  }, [frontDataUrl, backDataUrl, config]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, `safe_id_certified_copy_${Date.now()}.png`);
        confetti({ particleCount: 60, spread: 70 });
      }
    }, 'image/png');
  };

  const quickPurposes = language === 'zh'
    ? ['入职审核', '租房签约', '银行开户', '证券认证', '签证申办']
    : ['Employment', 'Lease Agreement', 'Bank Account', 'Security KYC', 'Visa Application'];

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Center Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative border-r border-border">
        {/* Top toolbar */}
        <div className="h-12 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t.idCopy.title}
            </span>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Printer className="w-3 h-3 text-indigo-400" />
              {t.idCopy.badge}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {frontDataUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                className="h-7 text-xs gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-500"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.idCopy.exportBtn}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Viewport Workspace */}
        <div className="flex-1 p-6 flex items-center justify-center bg-muted/20 overflow-auto">
          {frontDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative shadow-2xl rounded-sm border border-border max-h-[75vh] max-w-[85vw] overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="max-h-[75vh] w-auto object-contain block"
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {t.idCopy.notice}
              </span>
            </div>
          ) : (
            <div className="max-w-md w-full p-8 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {t.idCopy.dropTitle}
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                {t.idCopy.dropDesc}
              </p>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = (ev) => setFrontDataUrl(ev.target?.result as string);
                        r.readAsDataURL(f);
                      }
                    }}
                    className="hidden"
                  />
                  <Button variant="default" size="sm" className="gap-1.5 pointer-events-none">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.idCopy.uploadFront}</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="gap-1.5 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.idCopy.sampleBtn}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Panel */}
      <div className="w-80 lg:w-96 p-4 flex flex-col justify-between bg-card/70 backdrop-blur-md select-none shrink-0 overflow-y-auto">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">
              {t.idCopy.configTitle}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {t.idCopy.configSubtitle}
            </p>
          </div>

          {/* Document Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">{t.idCopy.docType}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'id-card', label: t.idCopy.types.idCard },
                { id: 'driver-license', label: t.idCopy.types.driverLicense },
                { id: 'passport', label: t.idCopy.types.passport },
              ].map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setConfig({ ...config, docType: doc.id as IDDocType })}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    config.docType === doc.id ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">{t.idCopy.layoutLabel}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'a4-sheet', label: t.idCopy.layouts.a4Sheet },
                { id: 'side-by-side', label: t.idCopy.layouts.sideBySide },
                { id: 'single', label: t.idCopy.layouts.single },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setConfig({ ...config, layout: l.id as any })}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    config.layout === l.id ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload second side if A4 or side-by-side */}
          {config.layout !== 'single' && (
            <div className="p-2.5 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {backDataUrl ? t.idCopy.backLoaded : t.idCopy.backNotLoaded}
              </span>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (ev) => setBackDataUrl(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="h-6 text-[11px] pointer-events-none">
                  {backDataUrl ? t.idCopy.reuploadBack : t.idCopy.uploadBack}
                </Button>
              </label>
            </div>
          )}

          <div className="w-full h-[1px] bg-border/60 my-2" />

          {/* Sensitive Field Redactions */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-foreground">{t.idCopy.redactionSection}</span>

            <Switch
              label={t.idCopy.maskIdSuffix}
              description={t.idCopy.maskIdSuffixDesc}
              checked={config.maskIdSuffix}
              onCheckedChange={(maskIdSuffix) => setConfig({ ...config, maskIdSuffix })}
            />

            <Switch
              label={t.idCopy.maskAddress}
              description={t.idCopy.maskAddressDesc}
              checked={config.maskAddressDetail}
              onCheckedChange={(maskAddressDetail) => setConfig({ ...config, maskAddressDetail })}
            />

            <Switch
              label={t.idCopy.maskBirth}
              description={t.idCopy.maskBirthDesc}
              checked={config.maskBirthDate}
              onCheckedChange={(maskBirthDate) => setConfig({ ...config, maskBirthDate })}
            />
          </div>

          <div className="w-full h-[1px] bg-border/60 my-2" />

          {/* Purpose & Legal Protection Watermarks */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-foreground">{t.idCopy.purposeSection}</span>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">{t.idCopy.purposeLabel}</label>
              <input
                type="text"
                value={config.purpose}
                onChange={(e) => setConfig({ ...config, purpose: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/40 font-medium"
                placeholder={t.idCopy.purposePlaceholder}
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {quickPurposes.map((p) => (
                <button
                  key={p}
                  onClick={() => setConfig({ ...config, purpose: p })}
                  className="px-2 py-0.5 rounded text-[10px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">{t.idCopy.issuerLabel}</label>
              <input
                type="text"
                value={config.issuerOrg}
                onChange={(e) => setConfig({ ...config, issuerOrg: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/40 font-medium"
                placeholder={t.idCopy.issuerPlaceholder}
              />
            </div>

            <Slider
              label={t.idCopy.validDays}
              value={config.validDays}
              min={7}
              max={180}
              step={7}
              unit={language === 'zh' ? '天' : 'd'}
              onChange={(validDays) => setConfig({ ...config, validDays })}
            />

            <Slider
              label={t.idCopy.watermarkOpacity}
              value={config.watermarkOpacity}
              min={20}
              max={90}
              step={5}
              unit="%"
              onChange={(watermarkOpacity) => setConfig({ ...config, watermarkOpacity })}
            />
          </div>
        </div>

        {/* Tip */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground mt-4">
          {t.idCopy.complianceTip}
        </div>
      </div>
    </div>
  );
};
