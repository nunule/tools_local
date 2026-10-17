import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  Copy, 
  Check, 
  Upload, 
  Download, 
  RotateCcw, 
  Play, 
  FileCode2,
  AlertCircle
} from 'lucide-react';
import { useWatermarkStore } from '@/store/useWatermarkStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WatermarkConfig } from '@/types/watermark';

export const CodeMirrorConfigView: React.FC = () => {
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
        throw new Error('配置必须是一个有效的 JSON 对象');
      }
      updateConfig(parsed);
      setSuccessMsg('配置已成功同步应用到水印工作室！');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'JSON 解析错误，请检查语法');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermark_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        setError('导入的文件非有效 JSON');
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
            CodeMirror 6 JSON 水印配置与脚本
          </span>
          <Badge variant="outline" className="text-[10px] font-mono py-0">
            JSON Schema v1.0
          </Badge>
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
              <span>导入 JSON</span>
            </Button>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs gap-1"
          >
            <Download className="w-3 h-3" />
            <span>导出 JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            className="h-7 text-xs gap-1 shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>应用到画布</span>
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
          onChange={(value) => {
            setJsonText(value);
            setError(null);
          }}
          className="h-full border-none focus:outline-none"
        />
      </div>

      {/* Bottom Footer hint */}
      <div className="h-8 border-t border-border bg-muted/20 px-4 flex items-center justify-between text-[11px] text-muted-foreground select-none">
        <span>支持直接修改配置参数并点击「应用到画布」立即生效</span>
        <span className="font-mono">CodeMirror 6 · React 19 Binding</span>
      </div>
    </div>
  );
};
