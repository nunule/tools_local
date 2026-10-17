import React, { useState, useMemo } from 'react';
import { 
  Home, 
  LayoutGrid, 
  Bookmark, 
  History, 
  Download, 
  Sun, 
  Moon, 
  Settings, 
  Search, 
  PanelLeftClose, 
  PanelLeft, 
  ChevronDown, 
  ChevronRight, 
  ShieldCheck, 
  Stamp, 
  Paintbrush, 
  Camera, 
  Crop, 
  CreditCard, 
  FileCode, 
  Info, 
  QrCode, 
  ScanFace, 
  FileText, 
  Binary, 
  FileSpreadsheet,
  X,
  Sparkles,
  Laptop
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActiveToolTab } from '@/types/privacyTools';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { useI18n } from '@/i18n';

export const Sidebar: React.FC = () => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    activeTab, 
    setActiveTab, 
    images,
    theme,
    setTheme,
    setDesktopModalOpen 
  } = useWatermarkStore();

  const { t, language } = useI18n();

  // Search filter query in the secondary drawer
  const [filterQuery, setFilterQuery] = useState('');

  // Dock active filter mode: 'all' | 'favorites' | 'history'
  const [dockFilter, setDockFilter] = useState<'all' | 'favorites' | 'history'>('all');

  // Favorites tracking (stored locally in component state)
  const [favorites, setFavorites] = useState<string[]>(['watermark', 'redact', 'exif']);

  // Collapsible categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    imagePrivacy: false,
    configDev: false,
    upcoming: false,
  });

  const toggleCategory = (catKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // Primary available tools in Category 1
  const imagePrivacyTools = useMemo(() => [
    {
      id: 'watermark' as ActiveToolTab,
      name: t.nav.watermark,
      desc: language === 'zh' ? '全屏错位防伪平铺 · 定点水印' : 'Tiled & single anchor watermark',
      icon: <Stamp className="w-4 h-4 text-teal-500" />,
      badge: images.length > 0 ? `${images.length}` : undefined,
    },
    {
      id: 'redact' as ActiveToolTab,
      name: t.nav.redact,
      desc: language === 'zh' ? '框选涂抹 · 纯色/马赛克/模糊' : 'Rect & brush mosaic / blur',
      icon: <Paintbrush className="w-4 h-4 text-sky-500" />,
    },
    {
      id: 'exif' as ActiveToolTab,
      name: t.nav.exif,
      desc: language === 'zh' ? '抹除定位GPS/拍摄时间/设备' : 'Wipe GPS & hardware metadata',
      icon: <Camera className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'screenshot' as ActiveToolTab,
      name: t.nav.screenshot,
      desc: language === 'zh' ? '裁状态栏/Home条 · 遮头像账号' : 'Trim status bar & mask avatars',
      icon: <Crop className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'id-copy' as ActiveToolTab,
      name: t.nav.idCopy,
      desc: language === 'zh' ? '身份证/驾照脱敏 · 防盗用途水印' : 'ID card copy & purpose stamp',
      icon: <CreditCard className="w-4 h-4 text-rose-500" />,
    },
  ], [t, language, images.length]);

  // Dev tools in Category 2
  const configDevTools = useMemo(() => [
    {
      id: 'json-config' as ActiveToolTab,
      name: language === 'zh' ? 'JSON 配置脚本' : 'JSON Config Script',
      desc: 'CodeMirror 6 JSON Editor',
      icon: <FileCode className="w-4 h-4 text-indigo-400" />,
      badge: 'CM6',
    },
    {
      id: 'about' as ActiveToolTab,
      name: t.nav.about,
      desc: language === 'zh' ? '100% 本地离线安全架构' : '100% offline security info',
      icon: <Info className="w-4 h-4 text-emerald-400" />,
    },
  ], [t, language]);

  // Upcoming Batch 2 preview tools
  const upcomingTools = useMemo(() => [
    {
      id: 'upcoming-barcode',
      name: t.sidebar.upcomingTools.barcodeMask,
      desc: t.sidebar.upcomingTools.barcodeMaskDesc,
      icon: <QrCode className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'upcoming-ai',
      name: t.sidebar.upcomingTools.aiSensitive,
      desc: t.sidebar.upcomingTools.aiSensitiveDesc,
      icon: <ScanFace className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'upcoming-pdf',
      name: t.sidebar.upcomingTools.pdfRedact,
      desc: t.sidebar.upcomingTools.pdfRedactDesc,
      icon: <FileText className="w-4 h-4 text-red-400" />,
    },
    {
      id: 'upcoming-text',
      name: t.sidebar.upcomingTools.batchDesensitize,
      desc: t.sidebar.upcomingTools.batchDesensitizeDesc,
      icon: <Binary className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'upcoming-file',
      name: t.sidebar.upcomingTools.fileAnonymize,
      desc: t.sidebar.upcomingTools.fileAnonymizeDesc,
      icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" />,
    },
  ], [t]);

  // Filter tools based on query & dock filter
  const filterList = <T extends { id: string; name: string; desc: string }>(list: T[]): T[] => {
    return list.filter((item) => {
      if (dockFilter === 'favorites' && !favorites.includes(item.id)) {
        return false;
      }
      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    });
  };

  const filteredImagePrivacy = filterList(imagePrivacyTools);
  const filteredConfigDev = filterList(configDevTools);
  const filteredUpcoming = filterList(upcomingTools);

  const hasAnyResults = filteredImagePrivacy.length > 0 || filteredConfigDev.length > 0 || filteredUpcoming.length > 0;

  return (
    <aside className="flex h-full z-20 shrink-0 select-none">
      {/* ========================================================= */}
      {/* TIER 1: Narrow Activity Dock (Toolbit-Style Icon Rail)     */}
      {/* ========================================================= */}
      <div className="w-12 sm:w-13 border-r border-border bg-card/90 flex flex-col items-center justify-between py-3 shrink-0 z-20">
        {/* Top dock section */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Brand Logo Button */}
          <button
            onClick={() => {
              setActiveTab('watermark');
              setSidebarOpen(true);
            }}
            className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center p-1.5 transition-all text-primary hover:scale-105 active:scale-95 shadow-xs"
            title="tools local"
          >
            <BrandIcon className="w-6 h-6 rounded-md" />
          </button>

          <div className="w-6 h-[1px] bg-border/60 my-1" />

          {/* Home */}
          <button
            onClick={() => {
              setActiveTab('watermark');
              setDockFilter('all');
              setSidebarOpen(true);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'watermark' && dockFilter === 'all'
                ? 'bg-primary/15 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
            title={t.sidebar.home}
          >
            <Home className="w-4 h-4" />
          </button>

          {/* All Tools (Grid) */}
          <button
            onClick={() => {
              setDockFilter('all');
              setFilterQuery('');
              setSidebarOpen(true);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              dockFilter === 'all' && sidebarOpen
                ? 'bg-primary/15 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
            title={t.sidebar.allTools}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Favorites (Bookmark) */}
          <button
            onClick={() => {
              setDockFilter((prev) => (prev === 'favorites' ? 'all' : 'favorites'));
              setSidebarOpen(true);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              dockFilter === 'favorites'
                ? 'bg-primary/20 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
            title={t.sidebar.favorites}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* History */}
          <button
            onClick={() => {
              setDockFilter((prev) => (prev === 'history' ? 'all' : 'history'));
              setSidebarOpen(true);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              dockFilter === 'history'
                ? 'bg-primary/20 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
            title={t.sidebar.history}
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom dock section */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* ======================================================== */}
          {/* SPECIAL: Download Desktop Version Button                 */}
          {/* ======================================================== */}
          <button
            onClick={() => setDesktopModalOpen(true)}
            className="group relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/15 transition-all shadow-xs"
            title={t.sidebar.downloadDesktop}
          >
            <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5 group-active:translate-y-1" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </button>

          {/* Theme Toggle (Moon / Sun) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              setActiveTab('json-config');
              setSidebarOpen(true);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'json-config'
                ? 'bg-primary/15 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
            title={t.sidebar.settings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TIER 2: Secondary Tools Drawer (Toolbit Tree & Filter)    */}
      {/* ========================================================= */}
      {sidebarOpen && (
        <div className="w-60 lg:w-64 border-r border-border bg-card/70 backdrop-blur-md flex flex-col justify-between overflow-hidden transition-all duration-200 shrink-0">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Drawer Top Header: TOOLS + Search + Collapse Button */}
            <div className="h-11 px-3.5 border-b border-border/80 flex items-center justify-between shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider">
                  {t.sidebar.tools}
                </span>
                {dockFilter !== 'all' && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase font-mono text-primary">
                    {dockFilter}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(false)}
                  title={t.sidebar.collapse}
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Filter Search Input Box (Toolbit-Style) */}
            <div className="p-2.5 shrink-0 border-b border-border/50">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder={t.sidebar.filterPlaceholder}
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-border/80 bg-muted/40 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery('')}
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Tool Categories & Accordion List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {!hasAnyResults ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {t.sidebar.noResults}
                </div>
              ) : (
                <>
                  {/* Category 1: Image & Privacy Security */}
                  {filteredImagePrivacy.length > 0 && (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleCategory('imagePrivacy')}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-teal-500 font-mono text-[13px]">&#123;&#125;</span>
                          <span className="truncate">{t.sidebar.categories.imagePrivacy}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80 shrink-0">
                          <span>{filteredImagePrivacy.length}</span>
                          {collapsedCategories.imagePrivacy ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </button>

                      {!collapsedCategories.imagePrivacy && (
                        <div className="space-y-0.5 pl-2 border-l border-border/40 ml-2">
                          {filteredImagePrivacy.map((tool) => {
                            const isActive = activeTab === tool.id;
                            const isFav = favorites.includes(tool.id);
                            return (
                              <div
                                key={tool.id}
                                onClick={() => setActiveTab(tool.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer transition-all group ${
                                  isActive
                                    ? 'bg-primary/15 text-primary font-medium shadow-xs'
                                    : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="shrink-0">{tool.icon}</span>
                                  <span className="truncate">{tool.name}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {tool.badge && (
                                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-primary/20 text-primary">
                                      {tool.badge}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => toggleFavorite(e, tool.id)}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-amber-400 ${
                                      isFav ? 'opacity-100 text-amber-400' : 'text-muted-foreground'
                                    }`}
                                  >
                                    <Bookmark className="w-3 h-3 fill-current" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category 2: Config & Dev */}
                  {filteredConfigDev.length > 0 && (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleCategory('configDev')}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate">{t.sidebar.categories.configDev}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80 shrink-0">
                          <span>{filteredConfigDev.length}</span>
                          {collapsedCategories.configDev ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </button>

                      {!collapsedCategories.configDev && (
                        <div className="space-y-0.5 pl-2 border-l border-border/40 ml-2">
                          {filteredConfigDev.map((tool) => {
                            const isActive = activeTab === tool.id;
                            return (
                              <div
                                key={tool.id}
                                onClick={() => setActiveTab(tool.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-primary/15 text-primary font-medium shadow-xs'
                                    : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="shrink-0">{tool.icon}</span>
                                  <span className="truncate">{tool.name}</span>
                                </div>
                                {tool.badge && (
                                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted border border-border/60 text-muted-foreground">
                                    {tool.badge}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category 3: Upcoming Roadmap (Batch 2) */}
                  {filteredUpcoming.length > 0 && (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleCategory('upcoming')}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="truncate">{t.sidebar.categories.batch2Upcoming}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80 shrink-0">
                          <span>{filteredUpcoming.length}</span>
                          {collapsedCategories.upcoming ? (
                            <ChevronRight className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </button>

                      {!collapsedCategories.upcoming && (
                        <div className="space-y-0.5 pl-2 border-l border-border/40 ml-2">
                          {filteredUpcoming.map((tool) => (
                            <div
                              key={tool.id}
                              onClick={() => {
                                alert(language === 'zh'
                                  ? `【${tool.name}】属于第二批扩展功能模块，正在本地全力研发中，敬请期待！`
                                  : `"${tool.name}" is part of our upcoming Batch 2 release and is currently in active local development!`);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group"
                            >
                              <div className="flex items-center gap-2 truncate opacity-75 group-hover:opacity-100">
                                <span className="shrink-0">{tool.icon}</span>
                                <span className="truncate">{tool.name}</span>
                              </div>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Soon
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Drawer Bottom Footer (Toolbit-Style Settings & Local Status) */}
          <div className="border-t border-border/60 bg-muted/20 p-2.5 space-y-1.5 shrink-0">
            {/* Download Desktop App Banner Button */}
            <button
              onClick={() => setDesktopModalOpen(true)}
              className="w-full p-2 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/20 text-xs font-semibold text-primary flex items-center justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Laptop className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.sidebar.downloadDesktop}</span>
              </div>
              <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-y-0.5" />
            </button>

            {/* Settings Link */}
            <button
              onClick={() => setActiveTab('json-config')}
              className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t.sidebar.settings}</span>
            </button>

            {/* Runs Locally Indicator */}
            <div className="flex items-center gap-2 px-2 py-0.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{t.sidebar.runsLocally}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
