import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (val: number) => void;
  showInput?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  label,
  unit = '',
  onChange,
  showInput = true,
  className,
  ...props
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground/80">{label}</span>
          <div className="flex items-center gap-1">
            {showInput ? (
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
                }}
                className="w-14 h-5 px-1 py-0 text-right text-xs bg-muted/60 border border-border/80 rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            ) : (
              <span className="font-mono text-muted-foreground">{value}</span>
            )}
            {unit && <span className="text-muted-foreground text-[10px]">{unit}</span>}
          </div>
        </div>
      )}
      <div className="relative flex items-center select-none touch-none w-full h-5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`
          }}
          {...props}
        />
      </div>
    </div>
  );
};
