import React from 'react';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { ShieldCheck, Cpu, Archive, Monitor, HardDriveDownload } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/badge';

export const AboutPrivacyView: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 bg-muted/20 select-none">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Hero header */}
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
          <BrandIcon className="h-16 w-16 shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">tools local</h1>
              <Badge variant="default" className="text-[11px] bg-emerald-600 hover:bg-emerald-600">
                {t.about.heroBadge}
              </Badge>
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              {t.about.heroSubtitle}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.about.heroDesc}
            </p>
          </div>
        </div>

        {/* 3 Privacy & Performance Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-card border border-border p-5 space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {t.about.pillars.noNetworkTitle}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.about.pillars.noNetworkDesc}
            </p>
          </div>

          <div className="rounded-xl bg-card border border-border p-5 space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {t.about.pillars.canvasTitle}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.about.pillars.canvasDesc}
            </p>
          </div>

          <div className="rounded-xl bg-card border border-border p-5 space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Archive className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {t.about.pillars.batchTitle}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.about.pillars.batchDesc}
            </p>
          </div>
        </div>

        {/* Tech Architecture Stack */}
        <section className="rounded-xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{t.about.techTitle}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/80">
              <div className="font-semibold text-foreground">React 19 & TS</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">High Performance Core</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/80">
              <div className="font-semibold text-foreground">Tailwind CSS 4</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Modern Design System</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/80">
              <div className="font-semibold text-foreground">HTML5 Canvas 2D</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Pixel-Level Processing</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/80">
              <div className="font-semibold text-foreground">exifr & JSZip</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">EXIF Parsing & Archive</div>
            </div>
          </div>
        </section>

        {/* Desktop Application Section */}
        <section className="rounded-xl bg-card border border-border p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-bold text-foreground">{t.about.desktopTitle}</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.about.desktopDesc}
          </p>
        </section>
      </div>
    </div>
  );
};
