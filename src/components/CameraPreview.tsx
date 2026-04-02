'use client';

import type { MutableRefObject } from 'react';
import VoidModeOverlay from '@/components/VoidModeOverlay';

interface CameraPreviewProps {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  isCameraOn: boolean;
  isDrawing: boolean;
  error?: string | null;
  captureMessage?: string;
  mirrorPreview: boolean;
  debugEnabled: boolean;
  voidModeActive: boolean;
  voidModeFlash: boolean;
  onToggleDebug: () => void;
  onToggleMirror: () => void;
  onStartCamera: () => void;
}

export default function CameraPreview({
  canvasRef,
  videoRef,
  isCameraOn,
  isDrawing,
  error,
  captureMessage,
  mirrorPreview,
  debugEnabled,
  voidModeActive,
  voidModeFlash,
  onToggleDebug,
  onToggleMirror,
  onStartCamera,
}: CameraPreviewProps) {
  return (
    <div className={`rounded-3xl p-4 shadow-glow transition-all duration-700 ${voidModeActive ? 'border border-violet-500/50 bg-slate-950/80 shadow-[0_0_48px_rgba(139,92,246,0.28)]' : 'border border-white/10 bg-slate-950/60'}`}>
      <div className={`relative overflow-hidden rounded-[2rem] transition-all duration-700 ${voidModeActive ? 'border border-violet-400/40' : 'border border-white/10 bg-slate-950/80'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        <div className="relative aspect-[16/9] min-h-[520px] w-full bg-slate-900">
          <div className="absolute inset-0" style={{ transform: mirrorPreview ? undefined : 'scaleX(-1)' }}>
            <video ref={videoRef} muted className="absolute inset-0 h-full w-full object-cover" playsInline />
            <VoidModeOverlay isActive={voidModeActive} isFlashing={voidModeFlash} />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 px-4 text-sm text-slate-200">
            <span className="rounded-full bg-slate-900/80 px-3 py-2 text-slate-200">
              {isCameraOn ? 'Camera live' : 'Camera stopped'}
            </span>
            <span className="rounded-full bg-slate-900/80 px-3 py-2 text-slate-200">
              {isDrawing ? 'Drawing' : 'Pinch to draw'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartCamera}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Start Camera
            </button>
            <button
              type="button"
              onClick={onToggleMirror}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {mirrorPreview ? 'Show actual preview' : 'Show mirrored preview'}
            </button>
            <button
              type="button"
              onClick={onToggleDebug}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition ${
                debugEnabled ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {debugEnabled ? 'Hide debug' : 'Show debug'}
            </button>
          </div>
          <span className="text-sm text-slate-400">Use a clean background and keep your hand visible.</span>
          <p className="text-sm leading-6 text-slate-300">
            The webcam feed appears behind the transparent drawing canvas. Use pinch to lower/raise your virtual pen.
          </p>
          {error ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          {captureMessage ? <p className="rounded-2xl bg-accent/10 p-3 text-sm text-accent">{captureMessage}</p> : null}
        </div>
      </div>
    </div>
  );
}
