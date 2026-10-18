import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpRight, Bookmark, Camera, ChevronDown, ChevronRight,
  CreditCard, Crop, FileCode2, History, Info, LayoutGrid, Moon, PanelLeftClose,
  PanelLeftOpen, Search, ShieldCheck, Stamp, Sun, Paintbrush, X,
  QrCode, ScanFace, FileText, Binary, FileSpreadsheet, type LucideIcon,
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { useI18n } from '@/i18n';
import { isDesktopApp } from '@/platform/files';
import type { ActiveToolTab } from '@/types/privacyTools';

type View = 'all' | 'favorites' | 'history';
type Tool = { id: ActiveToolTab; name: string; keywords: string; icon: LucideIcon; count?: number };
const railButton = 'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';

export const Sidebar: React.FC = () => {
  const {
    sidebarOpen, setSidebarOpen, activeTab, setActiveTab, images, theme, setTheme,
    setDesktopModalOpen, favoriteTools, toggleFavoriteTool, recentTools,
  } = useWatermarkStore();
  const { t } = useI18n();
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ upcoming: true });
  const searchRef = useRef<HTMLInputElement>(null);
  const focusSearch = useRef(false);
  const desktop = isDesktopApp();

  const tools: Tool[] = [
    { id: 'watermark', name: t.nav.watermark, keywords: 'watermark stamp 水印 图片', icon: Stamp, count: images.length },
    { id: 'redact', name: t.nav.redact, keywords: 'redact blur mosaic 隐私 打码 马赛克 模糊', icon: Paintbrush },
    { id: 'exif', name: t.nav.exif, keywords: 'exif gps camera metadata 照片 清理 定位 元数据', icon: Camera },
    { id: 'screenshot', name: t.nav.screenshot, keywords: 'screenshot crop 截图 裁切', icon: Crop },
    { id: 'id-copy', name: t.nav.idCopy, keywords: 'id copy card 证件 副本 身份证', icon: CreditCard },
    { id: 'json-config', name: t.configEditor.title, keywords: 'json config 配置', icon: FileCode2 },
  ];
  const upcoming = [
    { name: t.sidebar.upcomingTools.barcodeMask, icon: QrCode },
    { name: t.sidebar.upcomingTools.aiSensitive, icon: ScanFace },
    { name: t.sidebar.upcomingTools.pdfRedact, icon: FileText },
    { name: t.sidebar.upcomingTools.batchDesensitize, icon: Binary },
    { name: t.sidebar.upcomingTools.fileAnonymize, icon: FileSpreadsheet },
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = (tool: Tool) => `${tool.name} ${tool.keywords}`.toLocaleLowerCase().includes(normalizedQuery);
  const visibleTools = (view === 'history'
    ? recentTools.flatMap((id) => tools.filter((tool) => tool.id === id))
    : tools.filter((tool) => view !== 'favorites' || favoriteTools.includes(tool.id))
  ).filter(matches);
  const title = view === 'all' ? t.sidebar.allTools : view === 'favorites' ? t.sidebar.favorites : t.sidebar.history;

  useEffect(() => {
    if (sidebarOpen && focusSearch.current) {
      searchRef.current?.focus();
      focusSearch.current = false;
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey;
      const editing = event.target instanceof HTMLElement &&
        (event.target.matches('input, textarea, select') || event.target.isContentEditable || Boolean(event.target.closest('.cm-editor')));
      if (useWatermarkStore.getState().desktopModalOpen || document.querySelector('dialog[open]')) return;
      if (command && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarOpen(!useWatermarkStore.getState().sidebarOpen);
      }
      if ((command && event.key.toLowerCase() === 'k') || (!editing && event.key === '/')) {
        event.preventDefault();
        if (useWatermarkStore.getState().sidebarOpen) searchRef.current?.focus();
        else {
          focusSearch.current = true;
          setSidebarOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSidebarOpen]);

  const openView = (next: View) => {
    setView(next);
    setQuery('');
    setSidebarOpen(true);
  };
  const navigate = (id: ActiveToolTab) => {
    setActiveTab(id);
    if (window.matchMedia?.('(max-width: 767px)').matches) setSidebarOpen(false);
  };
  const renderTool = (tool: Tool) => {
    const Icon = tool.icon;
    const selected = activeTab === tool.id;
    const saved = favoriteTools.includes(tool.id);
    return (
      <div key={tool.id} className={`group relative flex items-center rounded-lg ${selected ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300' : 'text-foreground/75 hover:bg-muted/70'}`}>
        {selected && <span className="absolute left-0 h-4 w-0.5 rounded-full bg-teal-500" />}
        <button onClick={() => navigate(tool.id)} aria-current={selected ? 'page' : undefined}
          className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg pl-3 pr-1 text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
          <Icon className={`h-4 w-4 shrink-0 ${selected ? '' : 'text-muted-foreground'}`} />
          <span className={`truncate ${selected ? 'font-semibold' : 'font-medium'}`}>{tool.name}</span>
          {Boolean(tool.count) && <span className="ml-auto rounded bg-teal-500/10 px-1.5 font-mono text-[10px]">{tool.count}</span>}
        </button>
        <button onClick={() => toggleFavoriteTool(tool.id)} aria-pressed={saved}
          aria-label={`${saved ? t.sidebar.unsave : t.sidebar.save} ${tool.name}`}
          title={saved ? t.sidebar.unsave : t.sidebar.save}
          className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-opacity hover:bg-muted focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${saved ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}>
          <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} strokeWidth={saved ? 1.5 : 2} />
        </button>
      </div>
    );
  };
  const renderCategory = (id: string, label: string, list: Tool[]) => list.length > 0 && (
    <section key={id} className="mb-5">
      <button onClick={() => setCollapsed((state) => ({ ...state, [id]: !state[id] }))}
        aria-expanded={normalizedQuery ? true : !collapsed[id]} aria-controls={`nav-${id}`}
        className="mb-1 flex h-8 w-full items-center gap-1.5 px-2 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground">
        {collapsed[id] && !normalizedQuery ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <span>{label}</span><span className="ml-auto font-mono text-[10px] opacity-70">{list.length}</span>
      </button>
      {(!collapsed[id] || normalizedQuery) && <div id={`nav-${id}`} className="space-y-0.5">{list.map(renderTool)}</div>}
    </section>
  );

  return (
    <aside aria-label={t.sidebar.tools} className="relative z-30 flex h-full shrink-0 select-none">
      <nav aria-label={t.sidebar.workspace} className="flex w-[52px] flex-col items-center border-r border-border bg-muted/35 py-3">
        <button onClick={() => { navigate('watermark'); openView('all'); }} className="mb-6 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500" aria-label="tools local">
          <BrandIcon className="h-8 w-8 rounded-lg" />
        </button>
        <div className="flex flex-col gap-2">
          {([{ id: 'all', icon: LayoutGrid, label: t.sidebar.allTools }, { id: 'favorites', icon: Bookmark, label: t.sidebar.favorites }, { id: 'history', icon: History, label: t.sidebar.history }] as const).map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => openView(id)} title={label} aria-label={label} aria-pressed={view === id && sidebarOpen}
              className={`${railButton} ${view === id && sidebarOpen ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon className="h-[18px] w-[18px]" />
              {view === id && sidebarOpen && <span className="absolute -left-2 h-5 w-0.5 rounded-r bg-teal-500" />}
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className={`${railButton} text-muted-foreground hover:bg-muted`} title={t.sidebar.expand} aria-label={t.sidebar.expand}><PanelLeftOpen className="h-[18px] w-[18px]" /></button>}
          {!desktop && <button onClick={() => setDesktopModalOpen(true)} className={`${railButton} text-teal-700 hover:bg-teal-500/10 dark:text-teal-300`} title={t.sidebar.downloadDesktop} aria-label={t.sidebar.downloadDesktop}><ArrowDownToLine className="h-[18px] w-[18px]" /></button>}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`${railButton} text-muted-foreground hover:bg-muted`} title={t.common.themeToggle} aria-label={t.common.themeToggle}>{theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>
          <button onClick={() => navigate('about')} className={`${railButton} text-muted-foreground hover:bg-muted`} title={t.nav.about} aria-label={t.nav.about}><Info className="h-[18px] w-[18px]" /></button>
        </div>
      </nav>
      {sidebarOpen && <>
        <button onClick={() => setSidebarOpen(false)} tabIndex={-1} aria-hidden="true" className="fixed inset-y-0 right-0 left-[52px] z-10 bg-black/30 md:hidden" />
        <div className="absolute inset-y-0 left-[52px] z-20 flex w-[244px] flex-col border-r border-border bg-card shadow-xl md:static md:shadow-none">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <span className="font-mono text-[13px] font-semibold tracking-tight">tools <span className="text-teal-600 dark:text-teal-300">local</span></span>
            <button onClick={() => setSidebarOpen(false)} title={`${t.sidebar.collapse} (⌘/Ctrl B)`} aria-label={t.sidebar.collapse} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><PanelLeftClose className="h-4 w-4" /></button>
          </div>
          <div className="px-3 pt-4 pb-2">
            <div className="mb-3 flex items-center justify-between px-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"><span>{title}</span><span className="font-mono tracking-normal">{visibleTools.length.toString().padStart(2, '0')}</span></div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t.sidebar.filterPlaceholder} placeholder={t.sidebar.filterPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') { setQuery(''); searchRef.current?.blur(); }
                  if (event.key === 'Enter' && visibleTools[0]) navigate(visibleTools[0].id);
                }} className="h-9 w-full rounded-lg border border-border bg-background/70 pl-8 pr-9 text-xs outline-none placeholder:text-muted-foreground/75 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/10" />
              {query ? <button aria-label={t.sidebar.clearSearch} onClick={() => { setQuery(''); searchRef.current?.focus(); }} className="absolute top-2 right-2 rounded p-0.5 text-muted-foreground"><X className="h-3.5 w-3.5" /></button> : <kbd className="pointer-events-none absolute top-2 right-2 rounded border border-border px-1.5 text-[10px] text-muted-foreground">/</kbd>}
            </div>
          </div>
          <nav aria-label={title} className="min-h-0 flex-1 overflow-y-auto px-3 pt-2">
            {view === 'all' ? <>
              {renderCategory('image', t.sidebar.categories.imagePrivacy, visibleTools.filter((tool) => tool.id !== 'json-config'))}
              {renderCategory('config', t.sidebar.categories.configDev, visibleTools.filter((tool) => tool.id === 'json-config'))}
            </> : <div className="space-y-0.5 pt-2">{visibleTools.map(renderTool)}</div>}
            {visibleTools.length === 0 && <div role="status" className="py-8 text-center text-xs leading-6 text-muted-foreground">{normalizedQuery ? t.sidebar.noResults : view === 'favorites' ? t.sidebar.emptyFavorites : t.sidebar.emptyHistory}</div>}
            {view === 'all' && !normalizedQuery && <section className="mt-2 border-t border-border/70 pt-3">
              <button onClick={() => setCollapsed((state) => ({ ...state, upcoming: !state.upcoming }))} aria-expanded={!collapsed.upcoming} aria-controls="nav-upcoming" className="flex h-8 w-full items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
                {collapsed.upcoming ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}<span>{t.sidebar.categories.batch2Upcoming}</span><span className="ml-auto font-mono text-[10px]">{upcoming.length}</span>
              </button>
              {!collapsed.upcoming && <ul id="nav-upcoming" className="space-y-1 pb-3">{upcoming.map(({ name, icon: Icon }) => <li key={name} className="flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground"><Icon className="h-3.5 w-3.5 shrink-0 opacity-60" /><span className="min-w-0 flex-1 truncate">{name}</span><span className="rounded bg-muted px-1 text-[9px]">{t.sidebar.soon}</span></li>)}</ul>}
            </section>}
          </nav>
          <div className="shrink-0 border-t border-border p-3">
            {!desktop && <button onClick={() => setDesktopModalOpen(true)} className="group mb-3 w-full rounded-xl border border-teal-600/20 bg-teal-500/[0.07] p-3 text-left transition-colors hover:border-teal-500/40 hover:bg-teal-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300"><ArrowDownToLine className="h-4 w-4" /><span className="flex-1 text-xs font-semibold">{t.sidebar.downloadDesktop}</span><ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
              <p className="mt-1.5 pl-6 text-[10px] text-muted-foreground">{t.sidebar.downloadDesktopDesc}</p>
            </button>}
            <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /><span>{t.sidebar.runsLocally}</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-500" /></div>
          </div>
        </div>
      </>}
    </aside>
  );
};
