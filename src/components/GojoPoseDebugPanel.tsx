import type { GojoPoseDebugInfo } from '@/lib/poseDetection';

interface GojoPoseDebugPanelProps {
  debugInfo: GojoPoseDebugInfo;
  isPoseMatched: boolean;
  isPoseTriggered: boolean;
  holdProgress: number;
  cooldownTime: number;
  onClose: () => void;
}

const formatState = (state: string) => state.charAt(0).toUpperCase() + state.slice(1);

export default function GojoPoseDebugPanel({
  debugInfo,
  isPoseMatched,
  isPoseTriggered,
  holdProgress,
  cooldownTime,
  onClose,
}: GojoPoseDebugPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-sm text-slate-100 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pose Debug</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Gojo pose state</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => (
          <div key={finger} className="rounded-2xl bg-slate-900/80 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{finger}</p>
            <p className="mt-1 font-semibold text-slate-100">{formatState(debugInfo[finger])}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-slate-900/80 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Match</p>
          <p className="mt-1 font-semibold text-white">{isPoseMatched ? 'Yes' : 'No'}</p>
          <p className="mt-1 text-xs text-slate-400">Score: {debugInfo.score.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">Threshold: {debugInfo.scoreThreshold.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rule scores</p>
          <div className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            <div>Thumb tuck: {debugInfo.thumbTuckScore.toFixed(2)}</div>
            <div>Index extended: {debugInfo.indexScore.toFixed(2)}</div>
            <div>Middle bent: {debugInfo.middleScore.toFixed(2)}</div>
            <div>Ring folded: {debugInfo.ringScore.toFixed(2)}</div>
            <div>Pinky extended: {debugInfo.pinkyScore.toFixed(2)}</div>
            <div>Index above middle: {debugInfo.indexAboveMiddleScore.toFixed(2)}</div>
            <div>Middle near index: {debugInfo.middleNearIndexScore.toFixed(2)}</div>
            <div>Pinky spread: {debugInfo.pinkySpreadScore.toFixed(2)}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hold progress</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.round(holdProgress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">{Math.round(holdProgress * 100)}%</p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cooldown</p>
          <p className="mt-1 font-semibold text-white">{cooldownTime > 0 ? `${Math.ceil(cooldownTime / 1000)}s remaining` : 'Ready'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-400">
        <p>Index above middle: {debugInfo.indexAboveMiddle ? 'yes' : 'no'}</p>
        <p>Middle near index: {debugInfo.middleNearIndex ? 'yes' : 'no'}</p>
        <p>Pinky spread: {debugInfo.pinkySpread.toFixed(2)}</p>
        <p>Ring curl: {debugInfo.ringCurl.toFixed(2)}</p>
        <p>Thumb tuck dist: {debugInfo.thumbTuckDistance.toFixed(2)}</p>
      </div>
    </div>
  );
}
