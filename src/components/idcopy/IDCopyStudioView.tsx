import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Check, 
  Download, 
  Upload, 
  Sparkles, 
  Calendar, 
  Building2, 
  Layers,
  Eye,
  Sliders,
  Printer
} from 'lucide-react';
import { IDCopyConfig, IDDocType } from '@/types/privacyTools';
import { renderIDCertifiedCopy } from '@/utils/idCopyRenderer';
import { triggerDownload } from '@/utils/batchExporter';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

export const IDCopyStudioView: React.FC = () => {
  const [frontDataUrl, setFrontDataUrl] = useState<string | null>(null);
  const [backDataUrl, setBackDataUrl] = useState<string | null>(null);

  const [config, setConfig] = useState<IDCopyConfig>({
    docType: 'id-card',
    purpose: '入职入职材料审核',
    issuerOrg: '某某科技有限公司',
    validDays: 30,
    customWatermark: '仅供办理入职使用 他用无效',
    maskIdSuffix: true,
    maskAddressDetail: true,
    maskBirthDate: false,
    watermarkOpacity: 55,
    watermarkAngle: -25,
    layout: 'a4-sheet',
  });

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
    ctxF.fillText('居民身份证', 100, 90);

    // Text fields
    ctxF.fillStyle = '#334155';
    ctxF.font = '500 24px -apple-system, sans-serif';
    ctxF.fillText('姓名：王小明', 100, 180);
    ctxF.fillText('性别：男      民族：汉', 100, 240);
    ctxF.fillText('出生：1994 年 08 月 15 日', 100, 300);
    ctxF.fillText('住址：上海市浦东新区张江高科园区碧波路 888 弄 3 号楼 602 室', 100, 360);

    ctxF.font = 'bold 32px monospace';
    ctxF.fillText('公民身份号码：310115199408154829', 100, 520);

    // Avatar box
    ctxF.fillStyle = '#cbd5e1';
    ctxF.fillRect(720, 140, 200, 260);
    ctxF.fillStyle = '#64748b';
    ctxF.font = '20px sans-serif';
    ctxF.textAlign = 'center';
    ctxF.fillText('免冠证件照', 820, 275);
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
    ctxB.fillText('中华人民共和国', 500, 240);
    ctxB.fillText('居民身份证', 500, 310);

    ctxB.fillStyle = '#334155';
    ctxB.font = '500 24px -apple-system, sans-serif';
    ctxB.textAlign = 'start';
    ctxB.fillText('签发机关：上海市公安局浦东分局', 240, 440);
    ctxB.fillText('有效期限：2020.08.15 - 2040.08.15', 240, 500);

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

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Center Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative border-r border-border">
        {/* Top toolbar */}
        <div className="h-12 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              证件分享副本 (组合裁剪 / 敏感字段遮挡 / 防盗用途水印)
            </span>
            <Badge variant="success" className="text-[10px] gap-1">
              <ShieldCheck className="w-3 h-3" />
              防盗用安全副本
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {frontDataUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                className="h-7 text-xs gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出脱敏安全副本</span>
              </Button>
            )}
          </div>
        </div>

        {/* Workspace Canvas */}
        <div className="flex-1 p-6 flex items-center justify-center bg-muted/20 overflow-auto">
          {frontDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="shadow-2xl rounded-sm border border-border max-h-[75vh] max-w-[85vw] overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="max-h-[75vh] w-auto object-contain block"
                />
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                已自动覆写“仅供办理使用”斜向防伪水印并隐去敏感门牌号及身份证尾号
              </span>
            </div>
          ) : (
            <div className="max-w-md w-full p-8 border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                制作身份证、驾照、护照安全分享副本
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                在将证件照片发送给中介、HR 或平台实名认证时，自动隐去住址门牌号与尾号，并覆盖防盗用途水印。
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
                    <span>上传证件正面 (人像面)</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="gap-1.5 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>载入模拟居民身份证</span>
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
              证件副本安全合规配置
            </h4>
            <p className="text-[11px] text-muted-foreground">
              组合裁剪排版、敏感字段遮挡及指定业务用途水印
            </p>
          </div>

          {/* Document Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">证件类型</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'id-card', label: '居民身份证' },
                { id: 'driver-license', label: '驾驶证' },
                { id: 'passport', label: '护照/港澳台' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig({ ...config, docType: t.id as IDDocType })}
                  className={`py-1.5 text-xs rounded-lg border font-medium ${
                    config.docType === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">排版版式</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'a4-sheet', label: '标准 A4 副本' },
                { id: 'side-by-side', label: '正反面并排' },
                { id: 'single', label: '仅正面' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setConfig({ ...config, layout: l.id as any })}
                  className={`py-1.5 text-xs rounded-lg border font-medium ${
                    config.layout === l.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40'
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
                {backDataUrl ? '已加载反面 (国徽面)' : '未上传反面 (国徽面)'}
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
                  {backDataUrl ? '重新上传' : '上传反面'}
                </Button>
              </label>
            </div>
          )}

          <div className="w-full h-[1px] bg-border/60 my-2" />

          {/* Sensitive Field Redactions */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-foreground">敏感信息快速脱敏遮挡</span>

            <Switch
              label="遮挡身份证号后 4 位"
              description="保留前14位核验出生日期，遮蔽个人身份校验特征"
              checked={config.maskIdSuffix}
              onCheckedChange={(maskIdSuffix) => setConfig({ ...config, maskIdSuffix })}
            />

            <Switch
              label="遮挡详细门牌住址"
              description="保留省市区行政区划，隐去单元门牌号等隐私"
              checked={config.maskAddressDetail}
              onCheckedChange={(maskAddressDetail) => setConfig({ ...config, maskAddressDetail })}
            />

            <Switch
              label="遮挡出生年月日"
              description="隐去具体的出生日期信息"
              checked={config.maskBirthDate}
              onCheckedChange={(maskBirthDate) => setConfig({ ...config, maskBirthDate })}
            />
          </div>

          <div className="w-full h-[1px] bg-border/60 my-2" />

          {/* Purpose & Legal Protection Watermarks */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-foreground">法定防伪用途声明水印</span>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">具体业务用途</label>
              <input
                type="text"
                value={config.purpose}
                onChange={(e) => setConfig({ ...config, purpose: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/40 font-medium"
                placeholder="例如：入职办理 / 租房合同核验 / 办卡"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {['入职审核', '租房签约', '银行开户', '证券认证', '签证申办'].map((p) => (
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
              <label className="text-[11px] text-muted-foreground">办理机构或单位名称</label>
              <input
                type="text"
                value={config.issuerOrg}
                onChange={(e) => setConfig({ ...config, issuerOrg: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/40 font-medium"
                placeholder="例如：XX有限责任公司"
              />
            </div>

            <Slider
              label="有效期限"
              value={config.validDays}
              min={7}
              max={180}
              step={7}
              unit="天"
              onChange={(validDays) => setConfig({ ...config, validDays })}
            />

            <Slider
              label="水印透明度"
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
          依照中国居民身份证法及个人信息保护法规范，标注“仅供特定机构核验使用”并隐去门牌号可有效阻断他人冒名贷款或办理电信业务。
        </div>
      </div>
    </div>
  );
};
