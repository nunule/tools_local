import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  Copy, 
  Check, 
  Upload, 
  Download, 
  Play, 
  FileCode2,
  AlertCircle
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { triggerDownload } from '@/utils/batchExporter';
import { Button } from '@/components/ui/button';
import { WatermarkConfig } from '@/types/watermark';
import { useI18n } from '@/i18n';

export const CodeMirrorConfigView: React.FC = () => {
  const { t } = useI18n();
  const { config, updateConfig, theme } = useWatermarkStore();
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state to JSON text whenever config changes
  useEffect(() => {
    setJsonText(JSON.stringify(config, null, 2));
  }, [config]);

  const handleApply = () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonText) as WatermarkConfig;
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error(t.configEditor.mustBeObject);
      }
      updateConfig(parsed);
      setSuccessMsg(t.configEditor.appliedSuccess);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || t.configEditor.parseError);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    await triggerDownload(blob, `watermark_config_${Date.now()}.json`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        JSON.parse(text); // validate
        setJsonText(text);
        setError(null);
      } catch (err) {
        setError(t.configEditor.invalidFile);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-card overflow-hidden">
      {/* Top action toolbar */}
      <div className="h-12 border-b border-border bg-muted/30 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-foreground">
            {t.configEditor.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </span>
          )}
          {successMsg && (
            <span className="text-xs text-emerald-500 font-medium">
              {successMsg}
            </span>
          )}

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 pointer-events-none">
              <Upload className="w-3 h-3" />
              <span>{t.configEditor.importJson}</span>
            </Button>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs gap-1"
          >
            <Download className="w-3 h-3" />
            <span>{t.configEditor.exportJson}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? t.common.copied : t.common.copy}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            className="h-7 text-xs gap-1 shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{t.configEditor.applyToCanvas}</span>
          </Button>
        </div>
      </div>

      {/* CodeMirror 6 Editor Container */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        <CodeMirror
          value={jsonText}
          height="100%"
          theme={theme === 'dark' ? oneDark : undefined}
          extensions={[json()]}
          onChange={(val) => {
            setJsonText(val);
            if (error) setError(null);
          }}
          className="h-full border-none focus:outline-none"
        />
      </div>
    </div>
  );
};
