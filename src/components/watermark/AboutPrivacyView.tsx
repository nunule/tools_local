import React from 'react';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { ShieldCheck, Cpu, Archive, Monitor, Github, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import { GITHUB_URL } from '@/constants/projectLinks';

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

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.about.githubLink}
          className="inline-flex items-center gap-2.5 rounded-lg px-1 py-2 text-sm font-medium text-foreground transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:text-teal-300"
        >
          <Github className="h-4 w-4" />
          <span>GitHub</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </a>

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

        <section aria-labelledby="first-release-title" className="border-t border-border pt-6 pb-2">
          <div className="mb-3 flex items-center gap-2.5">
            <h3 id="first-release-title" className="text-sm font-semibold text-foreground">
              {t.about.firstReleaseTitle}
            </h3>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              v1.0.0
            </span>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {t.about.firstReleaseDescription}
          </p>
        </section>
      </div>
    </div>
  );
};
