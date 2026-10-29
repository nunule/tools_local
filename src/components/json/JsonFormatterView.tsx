import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import {
  Braces,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Columns2,
  Square,
  Wand2,
  Minimize2,
  ArrowRightLeft,
  ArrowDownAZ,
  Code2,
  Maximize2,
  Minimize,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { triggerDownload } from '@/utils/batchExporter';
import {
  formatJson,
  minifyJson,
  safeRepairJson,
  escapeJsonString,
  unescapeJsonString,
  chineseToUnicode,
  unicodeToChinese,
  getUtf8ByteSize,
  extractJsonError,
  IndentType,
  JsonParseError,
} from '@/utils/jsonEngine';
import {
  DEFAULT_JSON_SAMPLE,
  UNICODE_DEMO_SAMPLE,
  ESCAPED_DEMO_SAMPLE,
} from '@/constants/jsonSamples';

interface ToolbarDropdownProps {
  align?: 'left' | 'right';
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>;
    isOpen: boolean;
    toggle: () => void;
  }) => React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
}

const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({ align = 'left', trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (align === 'right') {
        setCoords({
          top: rect.bottom + 4,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      } else {
        setCoords({
          top: rect.bottom + 4,
          left: Math.max(8, rect.left),
        });
      }
    }
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      {trigger({
        ref: triggerRef,
        isOpen,
        toggle: () => {
          if (!isOpen) updatePosition();
          setIsOpen((prev) => !prev);
        },
      })}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              ...(coords.left !== undefined ? { left: `${coords.left}px` } : {}),
              ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
            }}
            className="z-50 min-w-44 flex flex-col bg-card border border-border rounded-lg shadow-xl py-1 text-xs select-none"
          >
            {children({ close: () => setIsOpen(false) })}
          </div>,
          document.body
        )}
    </>
  );
};

export const JsonFormatterView: React.FC = () => {
  const { t, language } = useI18n();
  const { theme } = useWatermarkStore();

  // Layout states
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Editor content states
  const [inputText, setInputText] = useState(DEFAULT_JSON_SAMPLE);
  const [outputText, setOutputText] = useState('');
  const [singleText, setSingleText] = useState(DEFAULT_JSON_SAMPLE);

  // Formatter options
  const [indent, setIndent] = useState<IndentType>(2);

  // Status & Telemetry states
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<JsonParseError | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [hasBigInt, setHasBigInt] = useState(false);
  const [isRepaired, setIsRepaired] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // CodeMirror refs for jumping to errors
  const inputEditorRef = useRef<any>(null);
  const outputEditorRef = useRef<any>(null);
  const singleEditorRef = useRef<any>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeContent = viewMode === 'split' ? (outputText || inputText) : singleText;

  // Check if string contains >15-digit large numbers
  const checkBigInt = useCallback((str: string) => {
    const hasLarge = /(?<!["\w])-?\d{16,}(?!["\w])/.test(str);
    setHasBigInt(hasLarge);
  }, []);

  // Format action
  const handleFormat = useCallback(
    (targetIndent: IndentType = indent, sortKeys = false, customSource?: string) => {
      const source = customSource !== undefined
        ? customSource
        : (viewMode === 'split' ? inputText : singleText);

      if (!source.trim()) {
        if (viewMode === 'split') {
          setOutputText('');
        }
        setError(null);
        setCompressionRatio(null);
        setIsRepaired(false);
        return;
      }

      const res = formatJson(source, { indent: targetIndent, sortKeys, autoRepair: true });
      setDurationMs(res.durationMs);
      setCompressionRatio(null);

      if (res.success) {
        setError(null);
        setIsRepaired(Boolean(res.isRepaired));
        if (viewMode === 'split') {
          setOutputText(res.output);
        } else {
          setSingleText(res.output);
        }
        checkBigInt(res.output);
        if (res.isRepaired) {
          setNotification({ message: t.jsonFormatter.safeFixSuccess, type: 'info' });
          setTimeout(() => setNotification(null), 4000);
        }
      } else {
        setError(res.error || null);
        if (viewMode === 'split') {
          setOutputText('');
        }
      }
    },
    [viewMode, inputText, singleText, indent, checkBigInt, t]
  );

  // Minify action
  const handleMinify = useCallback(() => {
    const source = viewMode === 'split' ? inputText : singleText;
    if (!source.trim()) return;

    const res = minifyJson(source, { autoRepair: true });
    setDurationMs(res.durationMs);

    if (res.success) {
      setError(null);
      setIsRepaired(Boolean(res.isRepaired));
      setCompressionRatio(res.compressionRatio);
      if (viewMode === 'split') {
        setOutputText(res.output);
      } else {
        setSingleText(res.output);
      }
      checkBigInt(res.output);
    } else {
      setError(res.error || null);
      if (viewMode === 'split') {
        setOutputText('');
      }
    }
  }, [viewMode, inputText, singleText, checkBigInt]);

  // Safe repair action
  const handleSafeRepair = useCallback(() => {
    const source = viewMode === 'split' ? inputText : singleText;
    if (!source.trim()) return;

    const res = safeRepairJson(source);
    if (res.repaired) {
      const formatted = formatJson(res.output, { indent, autoRepair: false });
      const finalVal = formatted.success ? formatted.output : res.output;

      if (viewMode === 'split') {
        setInputText(finalVal);
        setOutputText(finalVal);
      } else {
        setSingleText(finalVal);
      }
      setIsRepaired(true);
      setError(null);
      setNotification({ message: t.jsonFormatter.safeFixSuccess, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      checkBigInt(finalVal);
    } else {
      handleFormat(indent);
    }
  }, [viewMode, inputText, singleText, indent, handleFormat, checkBigInt, t]);

  // Sort keys A-Z action
  const handleSortKeys = useCallback(() => {
    handleFormat(indent, true);
  }, [handleFormat, indent]);

  // Escape action
  const handleEscape = useCallback(() => {
    const source = viewMode === 'split' ? (outputText || inputText) : singleText;
    if (!source) return;
    const escaped = escapeJsonString(source);
    if (viewMode === 'split') {
      setOutputText(escaped);
    } else {
      setSingleText(escaped);
    }
    setError(null);
    setCompressionRatio(null);
  }, [viewMode, outputText, inputText, singleText]);

  // Unescape action
  const handleUnescape = useCallback(() => {
    const source = viewMode === 'split' ? inputText : singleText;
    if (!source) return;
    const unescaped = unescapeJsonString(source);
    if (viewMode === 'split') {
      setInputText(unescaped);
      const res = formatJson(unescaped, { indent, autoRepair: true });
      if (res.success) {
        setOutputText(res.output);
        setError(null);
        setIsRepaired(Boolean(res.isRepaired));
      } else {
        setOutputText(unescaped);
      }
    } else {
      const res = formatJson(unescaped, { indent, autoRepair: true });
      setSingleText(res.success ? res.output : unescaped);
      if (res.success) {
        setError(null);
        setIsRepaired(Boolean(res.isRepaired));
      }
    }
    checkBigInt(unescaped);
  }, [viewMode, inputText, singleText, indent, checkBigInt]);

  // Chinese to Unicode
  const handleToUnicode = useCallback(() => {
    const source = viewMode === 'split' ? (outputText || inputText) : singleText;
    if (!source) return;
    const converted = chineseToUnicode(source);
    if (viewMode === 'split') {
      setOutputText(converted);
    } else {
      setSingleText(converted);
    }
  }, [viewMode, outputText, inputText, singleText]);

  // Unicode to Chinese
  const handleToChinese = useCallback(() => {
    const source = viewMode === 'split' ? (outputText || inputText) : singleText;
    if (!source) return;
    const converted = unicodeToChinese(source);
    if (viewMode === 'split') {
      setInputText(converted);
      const res = formatJson(converted, { indent, autoRepair: true });
      setOutputText(res.success ? res.output : converted);
      setError(res.success ? null : res.error || null);
    } else {
      const res = formatJson(converted, { indent, autoRepair: true });
      setSingleText(res.success ? res.output : converted);
      setError(res.success ? null : res.error || null);
    }
    checkBigInt(converted);
  }, [viewMode, outputText, inputText, singleText, indent, checkBigInt]);

  // Initial format on load
  useEffect(() => {
    handleFormat(2, false, DEFAULT_JSON_SAMPLE);
  }, []);

  // Jump to error line
  const handleJumpToError = () => {
    if (!error) return;
    const activeEditor = viewMode === 'single' ? singleEditorRef.current?.view : inputEditorRef.current?.view;
    if (!activeEditor) return;

    try {
      const docLen = activeEditor.state.doc.length;
      let targetPos = 0;

      if (error.position >= 0 && error.position <= docLen) {
        targetPos = error.position;
      } else {
        const lineCount = activeEditor.state.doc.lines;
        const targetLine = Math.min(Math.max(1, error.line), lineCount);
        const lineObj = activeEditor.state.doc.line(targetLine);
        targetPos = Math.min(lineObj.from + Math.max(0, error.column - 1), lineObj.to);
      }

      const headPos = Math.min(targetPos + 1, docLen);
      activeEditor.dispatch({
        selection: { anchor: targetPos, head: headPos },
        scrollIntoView: true,
      });
      activeEditor.focus();
    } catch {
      // fallback
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const textToCopy = viewMode === 'split' ? (outputText || inputText) : singleText;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear action
  const handleClear = () => {
    if (viewMode === 'split') {
      setInputText('');
      setOutputText('');
    } else {
      setSingleText('');
    }
    setError(null);
    setCompressionRatio(null);
    setIsRepaired(false);
  };

  // Load sample
  const handleLoadSample = (sample: string) => {
    if (viewMode === 'split') {
      setInputText(sample);
      const res = formatJson(sample, { indent, autoRepair: true });
      if (res.success) {
        setOutputText(res.output);
        setError(null);
        setIsRepaired(Boolean(res.isRepaired));
      } else {
        setOutputText('');
        setError(res.error || null);
      }
    } else {
      const res = formatJson(sample, { indent, autoRepair: true });
      if (res.success) {
        setSingleText(res.output);
        setError(null);
        setIsRepaired(Boolean(res.isRepaired));
      } else {
        setSingleText(sample);
        setError(res.error || null);
      }
    }
    checkBigInt(sample);
  };

  // Download JSON
  const handleDownload = async () => {
    const content = viewMode === 'split' ? (outputText || inputText) : singleText;
    if (!content) return;
    const blob = new Blob([content], { type: 'application/json' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await triggerDownload(blob, `formatted_${timestamp}.json`);
  };

  // Handle file import
  const handleImportFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (viewMode === 'split') {
        setInputText(text);
        const res = formatJson(text, { indent, autoRepair: true });
        if (res.success) {
          setOutputText(res.output);
          setError(null);
          setIsRepaired(Boolean(res.isRepaired));
        } else {
          setOutputText('');
          setError(res.error || null);
        }
      } else {
        const res = formatJson(text, { indent, autoRepair: true });
        if (res.success) {
          setSingleText(res.output);
          setError(null);
          setIsRepaired(Boolean(res.isRepaired));
        } else {
          setSingleText(text);
          setError(res.error || null);
        }
      }
      checkBigInt(text);
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  // CodeMirror 6 custom diagnostics linter for native error highlighting & positioning
  const customLinter = useMemo(() => {
    return linter((view) => {
      const doc = view.state.doc.toString();
      if (!doc.trim()) return [];

      const res = formatJson(doc, { autoRepair: true });
      if (!res.success && res.error) {
        const docLen = view.state.doc.length;
        const from = Math.min(Math.max(0, res.error.position), docLen);
        const to = Math.min(from + 1, docLen);
        const diagnostic: Diagnostic = {
          from,
          to: Math.max(from, to),
          severity: 'error',
          message: res.error.message,
        };
        return [diagnostic];
      }
      return [];
    });
  }, []);

  const editorExtensions = useMemo(() => {
    return [json(), lintGutter(), customLinter];
  }, [customLinter]);

  // Telemetry statistics
  const currentChars = activeContent.length;
  const currentLines = activeContent ? activeContent.split('\n').length : 0;
  const currentBytes = getUtf8ByteSize(activeContent);
  const formattedBytes =
    currentBytes < 1024
      ? `${currentBytes} B`
      : `${(currentBytes / 1024).toFixed(1)} KB`;

  // Indent labels
  const indentOptions: { value: IndentType; label: string }[] = [
    { value: 2, label: t.jsonFormatter.beautify2 },
    { value: 4, label: t.jsonFormatter.beautify4 },
    { value: '\t', label: t.jsonFormatter.beautifyTab },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 h-full flex flex-col bg-background text-foreground overflow-hidden relative select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-teal-500/10 backdrop-blur-xs border-2 border-dashed border-teal-500 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-teal-500 animate-bounce mb-2" />
          <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
            {t.jsonFormatter.dropHint}
          </span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.jsonc,.txt,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />

      {/* Top Main Toolbar */}
      <div className="h-12 border-b border-border bg-card/80 backdrop-blur-xs px-2.5 sm:px-4 flex items-center justify-between shrink-0 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none min-w-0">
        {/* Left: View Mode Toggle & Sample Loader */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 mr-1 sm:mr-2 shrink-0">
            <Braces className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="hidden xl:inline text-xs font-semibold tracking-tight whitespace-nowrap">
              {t.jsonFormatter.title}
            </span>
          </div>

          {/* Dual / Single View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shrink-0 h-7">
            <button
              onClick={() => {
                if (viewMode !== 'split') {
                  setInputText(singleText);
                  setViewMode('split');
                  setTimeout(() => handleFormat(indent, false, singleText), 50);
                }
              }}
              title={t.jsonFormatter.splitView}
              aria-label={t.jsonFormatter.splitView}
              className={`flex items-center gap-1 px-2 h-6 rounded-md text-xs shrink-0 whitespace-nowrap transition-colors ${
                viewMode === 'split'
                  ? 'bg-card text-teal-700 dark:text-teal-300 shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.jsonFormatter.splitView}</span>
            </button>
            <button
              onClick={() => {
                if (viewMode !== 'single') {
                  setSingleText(outputText || inputText);
                  setViewMode('single');
                }
              }}
              title={t.jsonFormatter.singleView}
              aria-label={t.jsonFormatter.singleView}
              className={`flex items-center gap-1 px-2 h-6 rounded-md text-xs shrink-0 whitespace-nowrap transition-colors ${
                viewMode === 'single'
                  ? 'bg-card text-teal-700 dark:text-teal-300 shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Square className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.jsonFormatter.singleView}</span>
            </button>
          </div>

          {/* Sample Preset Button */}
          <ToolbarDropdown
            align="left"
            trigger={({ ref, isOpen, toggle }) => (
              <Button
                ref={ref}
                variant="outline"
                size="sm"
                onClick={toggle}
                className={`h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap ${
                  isOpen ? 'bg-muted text-foreground' : ''
                }`}
                title={t.jsonFormatter.loadSample}
                aria-label={t.jsonFormatter.loadSample}
                aria-expanded={isOpen}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="hidden xl:inline">{t.jsonFormatter.loadSample}</span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </Button>
            )}
          >
            {({ close }) => (
              <>
                <button
                  onClick={() => {
                    handleLoadSample(DEFAULT_JSON_SAMPLE);
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground whitespace-nowrap"
                >
                  {language === 'zh' ? '完整业务响应 (含大数/注释)' : 'Full API Sample (BigInt/Comments)'}
                </button>
                <button
                  onClick={() => {
                    handleLoadSample(UNICODE_DEMO_SAMPLE);
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground whitespace-nowrap"
                >
                  {language === 'zh' ? 'Unicode 中文示例' : 'Unicode Chinese Demo'}
                </button>
                <button
                  onClick={() => {
                    handleLoadSample(ESCAPED_DEMO_SAMPLE);
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground whitespace-nowrap"
                >
                  {language === 'zh' ? '已转义 JSON 字符串' : 'Escaped JSON String'}
                </button>
              </>
            )}
          </ToolbarDropdown>

          {/* Clear Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-destructive shrink-0 whitespace-nowrap"
            title={t.jsonFormatter.clear}
            aria-label={t.jsonFormatter.clear}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">{t.jsonFormatter.clear}</span>
          </Button>
        </div>

        {/* Center: Core Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 py-1">
          {/* Beautify Indent Selector */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shrink-0 h-7">
            {indentOptions.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => {
                  setIndent(opt.value);
                  handleFormat(opt.value);
                }}
                className={`px-2 sm:px-2.5 h-6 rounded-md text-xs shrink-0 whitespace-nowrap transition-colors flex items-center justify-center font-medium ${
                  indent === opt.value
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={opt.label}
                aria-label={opt.label}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Minify */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMinify}
            className="h-7 text-xs gap-1 px-2 sm:px-2.5 shrink-0 whitespace-nowrap"
            title={t.jsonFormatter.minify}
            aria-label={t.jsonFormatter.minify}
          >
            <Minimize2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="hidden md:inline">{t.jsonFormatter.minify}</span>
          </Button>

          {/* Safe Repair (FSM) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSafeRepair}
            className="h-7 text-xs gap-1 px-2 sm:px-2.5 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 shrink-0 whitespace-nowrap"
            title={t.jsonFormatter.safeFix}
            aria-label={t.jsonFormatter.safeFix}
          >
            <Wand2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span className="hidden md:inline">{t.jsonFormatter.safeFix}</span>
          </Button>

          {/* Sort Keys (A-Z) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortKeys}
            className="h-7 text-xs gap-1 px-2 sm:px-2.5 hidden sm:inline-flex shrink-0 whitespace-nowrap"
            title={t.jsonFormatter.sortKeys}
            aria-label={t.jsonFormatter.sortKeys}
          >
            <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="hidden lg:inline">{t.jsonFormatter.sortKeys}</span>
          </Button>

          {/* More Productivity Tools Dropdown */}
          <ToolbarDropdown
            align="right"
            trigger={({ ref, isOpen, toggle }) => (
              <Button
                ref={ref}
                variant="outline"
                size="sm"
                onClick={toggle}
                className={`h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap ${
                  isOpen ? 'bg-muted text-foreground' : ''
                }`}
                title={language === 'zh' ? '转换' : 'Transform'}
                aria-label={language === 'zh' ? '转换' : 'Transform'}
                aria-expanded={isOpen}
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="hidden md:inline">{language === 'zh' ? '转换' : 'Transform'}</span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </Button>
            )}
          >
            {({ close }) => (
              <>
                <button
                  onClick={() => {
                    handleEscape();
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-between whitespace-nowrap"
                >
                  <span>{t.jsonFormatter.escape}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">\"</span>
                </button>
                <button
                  onClick={() => {
                    handleUnescape();
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-between whitespace-nowrap"
                >
                  <span>{t.jsonFormatter.unescape}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">"</span>
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={() => {
                    handleToUnicode();
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-between whitespace-nowrap"
                >
                  <span>{t.jsonFormatter.toUnicode}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">\u4f60</span>
                </button>
                <button
                  onClick={() => {
                    handleToChinese();
                    close();
                  }}
                  className="px-3 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-between whitespace-nowrap"
                >
                  <span>{t.jsonFormatter.toChinese}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">中</span>
                </button>
              </>
            )}
          </ToolbarDropdown>
        </div>

        {/* Right: Export & Copy & Fullscreen */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs gap-1 px-2 hidden sm:inline-flex shrink-0 whitespace-nowrap"
            title={t.jsonFormatter.uploadFile}
            aria-label={t.jsonFormatter.uploadFile}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">{t.jsonFormatter.uploadFile}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs gap-1 px-2 shrink-0 whitespace-nowrap"
            title={t.jsonFormatter.download}
            aria-label={t.jsonFormatter.download}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden lg:inline">{t.jsonFormatter.download}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1 px-2.5 sm:px-3 shadow-xs bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 shrink-0 whitespace-nowrap"
            title={copied ? t.jsonFormatter.copied : t.jsonFormatter.copy}
            aria-label={copied ? t.jsonFormatter.copied : t.jsonFormatter.copy}
          >
            {copied ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            <span className="hidden sm:inline">{copied ? t.jsonFormatter.copied : t.jsonFormatter.copy}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="h-7 w-7 text-muted-foreground shrink-0"
            title={isFullscreen ? t.jsonFormatter.exitFullscreen : t.jsonFormatter.fullscreen}
            aria-label={isFullscreen ? t.jsonFormatter.exitFullscreen : t.jsonFormatter.fullscreen}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Error or Notification Notice Bar */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 text-destructive text-xs px-4 py-1.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold shrink-0">{t.jsonFormatter.syntaxError}:</span>
            <span className="truncate">{error.message}</span>
            <span className="font-mono text-[11px] opacity-80 shrink-0">
              ({t.jsonFormatter.line} {error.line}, {t.jsonFormatter.column} {error.column})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToError}
              className="h-6 text-[11px] px-2 border-destructive/30 hover:bg-destructive/10 text-destructive shrink-0 whitespace-nowrap"
            >
              {t.jsonFormatter.jumpToError}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSafeRepair}
              className="h-6 text-[11px] px-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0 whitespace-nowrap"
            >
              {t.jsonFormatter.safeFix}
            </Button>
          </div>
        </div>
      )}

      {notification && !error && (
        <div className="bg-teal-500/10 border-b border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs px-4 py-1.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Stage */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {viewMode === 'split' ? (
          /* Dual Column Split Layout */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Left Pane: Input */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-card/20">
              <div className="h-8 border-b border-border/80 bg-muted/30 px-3 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
                  {t.jsonFormatter.inputTitle}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {inputText.length} {t.jsonFormatter.characters}
                </span>
              </div>
              <div className="flex-1 overflow-auto font-mono text-xs">
                <CodeMirror
                  ref={inputEditorRef}
                  value={inputText}
                  height="100%"
                  theme={theme === 'dark' ? oneDark : undefined}
                  extensions={editorExtensions}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    bracketMatching: true,
                    closeBrackets: true,
                  }}
                  onChange={(val) => {
                    setInputText(val);
                    checkBigInt(val);
                  }}
                  onUpdate={(viewUpdate) => {
                    if (viewUpdate.selectionSet || viewUpdate.docChanged) {
                      const head = viewUpdate.state.selection.main.head;
                      const line = viewUpdate.state.doc.lineAt(head);
                      setCursorPos({ line: line.number, col: head - line.from + 1 });
                    }
                  }}
                  placeholder={t.jsonFormatter.placeholder}
                  className="h-full border-none focus:outline-none"
                />
              </div>
            </div>

            {/* Right Pane: Formatted Output */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-card/40">
              <div className="h-8 border-b border-border/80 bg-muted/30 px-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
                    {t.jsonFormatter.outputTitle}
                  </span>
                  {isRepaired && (
                    <span className="rounded bg-teal-500/10 px-1.5 py-0.2 font-mono text-[10px] text-teal-600 dark:text-teal-400">
                      {t.jsonFormatter.autoRepaired}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (outputText) {
                        setInputText(outputText);
                        setNotification({ message: t.jsonFormatter.applyToInput, type: 'info' });
                        setTimeout(() => setNotification(null), 2000);
                      }
                    }}
                    className="h-6 text-[10px] px-1.5 gap-1 text-muted-foreground hover:text-foreground"
                    title={t.jsonFormatter.applyToInput}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{t.jsonFormatter.applyToInput}</span>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto font-mono text-xs">
                <CodeMirror
                  ref={outputEditorRef}
                  value={outputText}
                  height="100%"
                  theme={theme === 'dark' ? oneDark : undefined}
                  extensions={editorExtensions}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    bracketMatching: true,
                  }}
                  onChange={(val) => {
                    setOutputText(val);
                    checkBigInt(val);
                  }}
                  onUpdate={(viewUpdate) => {
                    if (viewUpdate.selectionSet || viewUpdate.docChanged) {
                      const head = viewUpdate.state.selection.main.head;
                      const line = viewUpdate.state.doc.lineAt(head);
                      setCursorPos({ line: line.number, col: head - line.from + 1 });
                    }
                  }}
                  className="h-full border-none focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Single Window Focus View */
          <div className="flex-1 flex flex-col min-h-0 bg-card/30">
            <div className="flex-1 overflow-auto font-mono text-xs">
              <CodeMirror
                ref={singleEditorRef}
                value={singleText}
                height="100%"
                theme={theme === 'dark' ? oneDark : undefined}
                extensions={editorExtensions}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  bracketMatching: true,
                  closeBrackets: true,
                }}
                onChange={(val) => {
                  setSingleText(val);
                  checkBigInt(val);
                }}
                onUpdate={(viewUpdate) => {
                  if (viewUpdate.selectionSet || viewUpdate.docChanged) {
                    const head = viewUpdate.state.selection.main.head;
                    const line = viewUpdate.state.doc.lineAt(head);
                    setCursorPos({ line: line.number, col: head - line.from + 1 });
                  }
                }}
                placeholder={t.jsonFormatter.placeholder}
                className="h-full border-none focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Realtime Status & Telemetry Footer Bar */}
      <footer className="h-7 border-t border-border bg-muted/40 px-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none shrink-0">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-3">
          {error ? (
            <span className="flex items-center gap-1.5 text-destructive font-medium">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              {t.jsonFormatter.invalidJson} ({t.jsonFormatter.line} {error.line})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              {t.jsonFormatter.validJson}
            </span>
          )}

          {hasBigInt && (
            <span
              className="hidden sm:inline-flex items-center gap-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
              title={t.jsonFormatter.bigIntPreserved}
            >
              <span>BigInt</span>
              <span className="hidden md:inline">(&gt;18位保真)</span>
            </span>
          )}

          {durationMs > 0 && (
            <span className="hidden sm:inline text-muted-foreground/80">
              {durationMs} ms
            </span>
          )}
        </div>

        {/* Right Metrics & Cursor Position */}
        <div className="flex items-center gap-3 sm:gap-4">
          {compressionRatio !== null && (
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              {t.jsonFormatter.compressionRatio}: {compressionRatio > 0 ? `-${compressionRatio}%` : '0%'}
            </span>
          )}

          <span className="hidden md:inline">
            {currentLines} {t.jsonFormatter.lines}
          </span>

          <span className="hidden sm:inline">
            {currentChars.toLocaleString()} {t.jsonFormatter.characters}
          </span>

          <span>{formattedBytes}</span>

          <span className="hidden lg:inline border-l border-border/80 pl-3 text-muted-foreground/70">
            {indent === '\t' ? 'Tab' : `${indent} Spaces`}
          </span>

          <span className="border-l border-border/80 pl-3">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        </div>
      </footer>
    </div>
  );
};
