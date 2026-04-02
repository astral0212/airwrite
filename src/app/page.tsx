import CameraWorkspace from '../components/CameraWorkspace';
import { EtherealShadow } from '@/components/ui/etheral-shadow';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">

      {/* ── Ethereal background ───────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 bg-[#04020e]">
        <EtherealShadow
          color="rgba(91, 33, 182, 0.92)"
          animation={{ scale: 85, speed: 75 }}
          noise={{ opacity: 0.6, scale: 1.4 }}
          sizing="fill"
          style={{ width: '100%', height: '100%' }}
        />
        {/* Extra depth layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.18)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(6,2,20,0.85)_0%,transparent_60%)]" />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-10">

          {/* Hero */}
          <div className="space-y-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                Real-time air handwriting · webcam powered
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400 backdrop-blur-sm">
                ✊ Fist to activate Void Mode · ✌️ Peace to erase
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-br from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                  AirWrite
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-300/90">
                Write in the air with your finger. Start the camera, pinch to draw, and capture a polished PNG.
                Make a fist to enter <span className="text-violet-300 font-medium">Void Mode</span> — a cinematic cosmic scene.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Pinch to draw</p>
                <p className="mt-2 text-sm text-slate-400">Bring thumb and index together to start a stroke. Release to lift the pen.</p>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Void Mode</p>
                <p className="mt-2 text-sm text-slate-400">Hold a closed fist for 1 second to activate the cosmic void environment.</p>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Export</p>
                <p className="mt-2 text-sm text-slate-400">Capture the final frame as a PNG with the webcam and drawing merged.</p>
              </div>
            </div>
          </div>

          {/* Camera workspace */}
          <div className="rounded-3xl border border-violet-500/20 bg-black/30 p-5 shadow-[0_0_80px_rgba(109,40,217,0.15)] backdrop-blur-xl">
            <CameraWorkspace />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600">
            AirWrite — built with MediaPipe Hands + Next.js
          </p>

        </section>
      </div>
    </main>
  );
}
