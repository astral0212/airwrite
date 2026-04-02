import CameraWorkspace from '../components/CameraWorkspace';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/5 px-4 py-2 text-sm text-accent shadow-glow">
              <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              Real-time air handwriting with your webcam
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                AirWrite — write in the air with your finger.
              </h1>
              <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
                Start the camera, pinch to draw, and capture a polished PNG of your air handwriting.
                This MVP combines a sleek live webcam preview, fingertip tracking, and elegant stroke rendering.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Fast start</p>
                <p className="mt-3 text-base text-slate-300">Click Start Camera, allow permission, then write with a pinch gesture.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">High-quality export</p>
                <p className="mt-3 text-base text-slate-300">Capture the final frame as a single PNG with the webcam and drawing overlay merged.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/40 p-5 shadow-glow backdrop-blur-xl">
            <CameraWorkspace />
          </div>
        </section>
      </div>
    </main>
  );
}
