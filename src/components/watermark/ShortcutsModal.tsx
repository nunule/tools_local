import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

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
    { key: 'Cmd/Ctrl + V', desc: t.shortcuts.cmdV },
    { key: 'Cmd/Ctrl + S', desc: t.shortcuts.cmdS },
    { key: 'Wheel', desc: t.shortcuts.wheel },
    { key: 'Drag', desc: t.shortcuts.drag },
    { key: 'C', desc: t.shortcuts.compareKey },
    { key: 'Double Click', desc: t.shortcuts.doubleClick },
    { key: 'Esc', desc: t.shortcuts.esc },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{t.shortcuts.title}</h3>
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
            {t.shortcuts.close}
          </Button>
        </div>
      </div>
    </div>
  );
};
