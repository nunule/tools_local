import React, { useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd/Ctrl + V', desc: '直接从剪贴板粘贴截图或图片' },
    { key: 'Cmd/Ctrl + S', desc: '快速导出保存当前已加水印图片' },
    { key: '滚轮 (Wheel)', desc: '在画布上平滑缩放视图 (10% ~ 400%)' },
    { key: '鼠标左键拖拽', desc: '平移移动大型高分辨率图片画布' },
    { key: '按住对比 (C)', desc: '临时切换查看原始无水印图像进行效果对比' },
    { key: '双击重置', desc: '恢复 100% 原始缩放并居中' },
    { key: 'Esc', desc: '关闭当前浮层弹窗' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">桌面与键盘快捷键</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* List */}
        <div className="p-5 space-y-3">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border/80 font-mono text-[11px] font-semibold text-foreground shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex justify-end">
          <Button variant="default" size="sm" onClick={onClose} className="text-xs">
            知道了
          </Button>
        </div>
      </div>
    </div>
  );
};
