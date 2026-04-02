'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Hands, Results } from '@mediapipe/hands';
import CameraPreview from '@/components/CameraPreview';
import GojoPoseDebugPanel from '@/components/GojoPoseDebugPanel';
import Toolbar from '@/components/Toolbar';
import { exportAirWriteImage } from '@/lib/export';
import { renderCanvas, shouldAddPoint, smoothPoint, Stroke, BrushStyle, Point } from '@/lib/drawing';
import { isPinchBegin, isPinchContinue, INDEX_FINGER_TIP, THUMB_TIP } from '@/lib/hand';
import { useGojoPose } from '@/hooks/useGojoPose';

export default function CameraWorkspace() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isPinchedRef = useRef(false);
  const lostTrackingFramesRef = useRef(0);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#7df9ff');
  const [brushSize, setBrushSize] = useState(16);
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('neon');
  const [captureMessage, setCaptureMessage] = useState<string>('');
  const [showMirrorPreview, setShowMirrorPreview] = useState(false);
  const [showPoseDebug, setShowPoseDebug] = useState(false);
  const [voidModeEnabled, setVoidModeEnabled] = useState(false);
  const [voidModeActive, setVoidModeActive] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [effectDuration, setEffectDuration] = useState(0);

  const { debugInfo, isPoseMatched, isPoseTriggered, holdProgress, cooldownTime, updateLandmarks } = useGojoPose();

  const brushColorRef = useRef(brushColor);
  const voidModeCooldownRef = useRef(0);
  const voidModeEffectRef = useRef(0);
  const voidModePrevTriggerRef = useRef(false);
  const lastVoidFrameRef = useRef(Date.now());
  const VOID_MODE_DURATION_MS = 7000;
  const VOID_MODE_COOLDOWN_MS = 9000;
  const brushSizeRef = useRef(brushSize);
  const brushStyleRef = useRef<BrushStyle>(brushStyle);
  const voidModeActiveRef = useRef(false);
  const prevBrushColorRef = useRef<string | null>(null);
  const prevBrushStyleRef = useRef<BrushStyle | null>(null);

  const [voidModeFlash, setVoidModeFlash] = useState(false);

  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    brushStyleRef.current = brushStyle;
  }, [brushStyle]);

  useEffect(() => {
    voidModeActiveRef.current = voidModeActive;
  }, [voidModeActive]);

  useEffect(() => {
    if (voidModeActive) {
      prevBrushColorRef.current = brushColorRef.current;
      prevBrushStyleRef.current = brushStyleRef.current;
      setBrushColor('#a78bfa');
      setBrushStyle('neon');
    } else if (prevBrushColorRef.current !== null) {
      setBrushColor(prevBrushColorRef.current);
      setBrushStyle(prevBrushStyleRef.current ?? 'neon');
      prevBrushColorRef.current = null;
      prevBrushStyleRef.current = null;
    }
  }, [voidModeActive]);

  useEffect(() => {
    setPoseDetected(isPoseMatched);
  }, [isPoseMatched]);

  useEffect(() => {
    setActivationProgress(holdProgress);
  }, [holdProgress]);

  useEffect(() => {
    if (!isPoseTriggered) {
      voidModePrevTriggerRef.current = false;
      return;
    }

    if (isPoseTriggered && !voidModePrevTriggerRef.current) {
      voidModePrevTriggerRef.current = true;

      if (voidModeEnabled && !voidModeActive && voidModeCooldownRef.current <= 0) {
        setVoidModeActive(true);
        voidModeEffectRef.current = VOID_MODE_DURATION_MS;
        setEffectDuration(VOID_MODE_DURATION_MS);
        setVoidModeFlash(true);
        window.setTimeout(() => setVoidModeFlash(false), 380);
      }
    }
  }, [isPoseTriggered, voidModeEnabled, voidModeActive]);

  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };
  }, []);

  const updateCanvasSize = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const { videoWidth, videoHeight } = video;
    if (videoWidth && videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      canvas.style.width = `${video.clientWidth}px`;
      canvas.style.height = `${video.clientHeight}px`;
    }
  };

  const startStroke = (point: Point) => {
    const stroke: Stroke = {
      points: [point],
      color: brushColorRef.current,
      width: brushSizeRef.current,
      style: brushStyleRef.current,
    };
    currentStrokeRef.current = stroke;
    setIsDrawing(true);
  };

  const addPointToStroke = (point: Point) => {
    if (!currentStrokeRef.current) return;
    const lastPoint = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1] ?? null;
    if (!shouldAddPoint(lastPoint, point)) return;
    const nextPoint = lastPoint ? smoothPoint(lastPoint, point) : point;
    currentStrokeRef.current.points.push(nextPoint);
  };

  const endStroke = () => {
    if (!currentStrokeRef.current) return;
    strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
    setStrokes(strokesRef.current);
    currentStrokeRef.current = null;
    setIsDrawing(false);
  };

  const handleUndo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokes(strokesRef.current);
  };

  const handleClear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    setStrokes([]);
    setIsDrawing(false);
    setCaptureMessage('');
    isPinchedRef.current = false;
  };

  const handleColorChange = (value: string) => setBrushColor(value);
  const handleSizeChange = (value: number) => setBrushSize(value);
  const handleStyleChange = (value: BrushStyle) => setBrushStyle(value);

  const captureImage = () => {
    if (!videoRef.current) {
      setCaptureMessage('Camera is not active yet.');
      return;
    }

    try {
      const dataUrl = exportAirWriteImage(videoRef.current, strokesRef.current, currentStrokeRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'airwrite-capture.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setCaptureMessage('Download started: airwrite-capture.png');
      window.setTimeout(() => setCaptureMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setCaptureMessage('Unable to export image. Please try again.');
    }
  };

  const drawCursor = (x: number, y: number, ctx: CanvasRenderingContext2D) => {
    const inVoid = voidModeActiveRef.current;
    ctx.save();
    ctx.strokeStyle = inVoid ? '#c084fc' : '#7df9ff';
    ctx.fillStyle = inVoid ? 'rgba(167, 139, 250, 0.9)' : 'rgba(69, 214, 255, 0.92)';
    ctx.shadowColor = inVoid ? 'rgba(167, 139, 250, 0.95)' : 'rgba(69, 214, 255, 0.85)';
    ctx.shadowBlur = inVoid ? 24 : 16;
    ctx.beginPath();
    ctx.arc(x, y, inVoid ? 13 : 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = inVoid ? 3 : 2.5;
    ctx.stroke();
    ctx.restore();
  };

  const updateVoidModeTimers = (delta: number) => {
    if (voidModeEffectRef.current > 0) {
      voidModeEffectRef.current = Math.max(0, voidModeEffectRef.current - delta);
      setEffectDuration(voidModeEffectRef.current);

      if (voidModeEffectRef.current === 0 && voidModeActive) {
        setVoidModeActive(false);
        voidModeCooldownRef.current = VOID_MODE_COOLDOWN_MS;
        setCooldown(voidModeCooldownRef.current);
      }
    }

    if (voidModeCooldownRef.current > 0) {
      voidModeCooldownRef.current = Math.max(0, voidModeCooldownRef.current - delta);
      setCooldown(voidModeCooldownRef.current);
    }
  };

  const handleVoidModeToggle = () => {
    setVoidModeEnabled((previous) => {
      if (previous) {
        setVoidModeActive(false);
        setEffectDuration(0);
        voidModeEffectRef.current = 0;
      }
      return !previous;
    });
  };

  const handleHandsResults = (results: Results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const now = Date.now();
    const delta = Math.min(now - lastVoidFrameRef.current, 120);
    lastVoidFrameRef.current = now;
    updateVoidModeTimers(delta);

    updateCanvasSize();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const allHands = results.multiHandLandmarks ?? [];
    updateLandmarks(allHands);

    const landmarks = allHands[0];
    let cursorPosition: Point | null = null;

    if (landmarks) {
      lostTrackingFramesRef.current = 0;
      const indexTip = landmarks[INDEX_FINGER_TIP];
      const thumbTip = landmarks[THUMB_TIP];

      if (indexTip && thumbTip) {
        const x = indexTip.x * canvas.width;
        const y = indexTip.y * canvas.height;
        const pinchStart = isPinchBegin(indexTip, thumbTip);
        const pinchHold = isPinchContinue(indexTip, thumbTip);

        cursorPosition = { x, y };

        if ((pinchStart || pinchHold) && !isPinchedRef.current) {
          startStroke({ x, y });
          isPinchedRef.current = true;
        } else if (pinchHold && isPinchedRef.current) {
          addPointToStroke({ x, y });
        } else if (!pinchHold && isPinchedRef.current) {
          lostTrackingFramesRef.current += 1;
          if (lostTrackingFramesRef.current > 18) {
            isPinchedRef.current = false;
            endStroke();
          }
        }
      } else if (isPinchedRef.current) {
        isPinchedRef.current = false;
        endStroke();
      }
    } else if (isPinchedRef.current) {
      lostTrackingFramesRef.current += 1;
      if (lostTrackingFramesRef.current > 12) {
        isPinchedRef.current = false;
        endStroke();
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderCanvas(ctx, strokesRef.current, currentStrokeRef.current);

    if (cursorPosition) {
      drawCursor(cursorPosition.x, cursorPosition.y, ctx);
    }
  };

  const startCamera = async () => {
    if (cameraRef.current) return;

    setError(null);

    if (!videoRef.current) return;

    const video = videoRef.current;

    const hands = new Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.6,
    });
    hands.onResults(handleHandsResults);
    handsRef.current = hands;

    let firstFrame = true;
    const camera = new Camera(video, {
      onFrame: async () => {
        if (firstFrame) {
          firstFrame = false;
          setIsCameraOn(true);
          updateCanvasSize();
        }
        if (handsRef.current) {
          await handsRef.current.send({ image: video });
        }
      },
      width: 1280,
      height: 720,
    });
    cameraRef.current = camera;

    camera.start().catch((err: unknown) => {
      setError('Unable to access the webcam. Please allow camera permissions and try again.');
      setIsCameraOn(false);
      cameraRef.current = null;
      handsRef.current = null;
      console.error(err);
    });
  };

  return (
    <div className="space-y-5">
      <CameraPreview
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCameraOn={isCameraOn}
        isDrawing={isDrawing}
        error={error}
        captureMessage={captureMessage}
        mirrorPreview={showMirrorPreview}
        debugEnabled={showPoseDebug}
        voidModeActive={voidModeActive}
        voidModeFlash={voidModeFlash}
        onToggleDebug={() => setShowPoseDebug((value) => !value)}
        onToggleMirror={() => setShowMirrorPreview((value) => !value)}
        onStartCamera={startCamera}
      />

      {showPoseDebug ? (
        <GojoPoseDebugPanel
          debugInfo={debugInfo}
          isPoseMatched={isPoseMatched}
          isPoseTriggered={isPoseTriggered}
          holdProgress={holdProgress}
          cooldownTime={cooldownTime}
          onClose={() => setShowPoseDebug(false)}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
          <div className="space-y-4 text-slate-300">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Working area</p>
            <p className="text-base leading-6">
              Keep your hand centered and move slowly while pinched for the smoothest strokes.
            </p>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm">
              <p className="uppercase tracking-[0.2em] text-slate-500">Gojo pose</p>
              <p className="mt-2 font-semibold text-white">
                {isPoseTriggered ? 'Triggered' : isPoseMatched ? 'Matched' : 'Not matched'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Hold: {Math.round(holdProgress * 100)}% · Cooldown: {cooldownTime > 0 ? `${Math.ceil(cooldownTime / 1000)}s` : 'ready'}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="uppercase tracking-[0.2em] text-slate-500">Void Mode</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {voidModeActive
                      ? 'Void Mode Active'
                      : voidModeEnabled
                      ? activationProgress > 0
                        ? 'Activating Void Mode...'
                        : poseDetected
                        ? 'Pose Detected'
                        : 'Void Mode Ready'
                      : 'Void Mode Disabled'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVoidModeToggle}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    voidModeEnabled
                      ? 'border border-cyan-300 bg-cyan-300/15 text-cyan-200 hover:bg-cyan-300/25'
                      : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {voidModeEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {voidModeActive
                  ? `Active for ${Math.ceil(effectDuration / 1000)}s`
                  : cooldown > 0
                  ? `Cooldown for ${Math.ceil(cooldown / 1000)}s`
                  : voidModeEnabled
                  ? 'Hold the Gojo pose to activate.'
                  : 'Toggle Void Mode on to enable pose activation.'}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs text-slate-400">
                <div>Pose detected: {poseDetected ? 'Yes' : 'No'}</div>
                <div>Activation: {Math.round(activationProgress * 100)}%</div>
                <div>Duration: {voidModeActive ? `${Math.ceil(effectDuration / 1000)}s` : 'inactive'}</div>
                <div>Cooldown: {cooldown > 0 ? `${Math.ceil(cooldown / 1000)}s` : 'ready'}</div>
              </div>
            </div>
          </div>
        </div>
        <Toolbar
          disabled={!isCameraOn}
          brushColor={brushColor}
          brushSize={brushSize}
          brushStyle={brushStyle}
          onColorChange={handleColorChange}
          onSizeChange={handleSizeChange}
          onStyleChange={handleStyleChange}
          onUndo={handleUndo}
          onClear={handleClear}
          onCapture={captureImage}
          canUndo={strokes.length > 0}
        />
      </div>
    </div>
  );
}
