'use client';

import type { BrushStyle } from '@/lib/drawing';

interface ToolbarProps {
  disabled?: boolean;
  brushColor: string;
  brushSize: number;
  brushStyle: BrushStyle;
  onColorChange: (value: string) => void;
  onSizeChange: (value: number) => void;
  onStyleChange: (style: BrushStyle) => void;
  onUndo: () => void;
  onClear: () => void;
  onCapture: () => void;
  canUndo: boolean;
}

const styles: BrushStyle[] = ['pen', 'marker', 'neon', 'chalk'];

export default function Toolbar({ disabled = false, brushColor, brushSize, brushStyle, onColorChange, onSizeChange, onStyleChange, onUndo, onClear, onCapture, canUndo }: ToolbarProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-glow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Controls</p>
          <h2 className="mt-2 text-xl font-semibold text-white">AirWrite toolbar</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          Live drawing
        </span>
      </div>

      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Color</span>
            <input
              type="color"
              value={brushColor}
              disabled={disabled}
              onChange={(event) => onColorChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-900"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Brush size</span>
            <input
              type="range"
              min="4"
              max="40"
              value={brushSize}
              disabled={disabled}
              onChange={(event) => onSizeChange(Number(event.target.value))}
              className="w-full"
            />
            <div className="text-xs text-slate-400">{brushSize}px</div>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {styles.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onStyleChange(preset)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                preset === brushStyle ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={disabled || !canUndo}
            onClick={onUndo}
            className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onCapture}
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Capture
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
          <p className="font-semibold text-white">Fluid writing</p>
          <p className="mt-2 leading-6">Use pinch to draw; the style presets give a polished ink-like effect.</p>
        </div>
      </div>
    </div>
  );
}
