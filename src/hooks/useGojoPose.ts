import { useCallback, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/hands';
import { DEFAULT_GOJO_POSE_CONFIG, detectGojoPose, GojoPoseDebugInfo } from '@/lib/poseDetection';

const HOLD_DURATION_MS = 1000;
const COOLDOWN_DURATION_MS = 2500;
const SCORE_THRESHOLD = DEFAULT_GOJO_POSE_CONFIG.scoreThreshold;

export interface UseGojoPoseState {
  debugInfo: GojoPoseDebugInfo;
  isPoseMatched: boolean;
  isPoseTriggered: boolean;
  holdProgress: number;
  cooldownTime: number;
  updateLandmarks: (landmarks?: NormalizedLandmark[]) => void;
}

const initialDebugInfo: GojoPoseDebugInfo = {
  thumb: 'unknown',
  index: 'unknown',
  middle: 'unknown',
  ring: 'unknown',
  pinky: 'unknown',
  indexAboveMiddle: false,
  middleNearIndex: false,
  pinkySpread: 0,
  ringCurl: 0,
  thumbTuckDistance: 1,
  thumbScore: 0,
  indexScore: 0,
  middleScore: 0,
  ringScore: 0,
  pinkyScore: 0,
  indexAboveMiddleScore: 0,
  middleNearIndexScore: 0,
  pinkySpreadScore: 0,
  thumbTuckScore: 0,
  scoreThreshold: DEFAULT_GOJO_POSE_CONFIG.scoreThreshold,
  score: 0,
};

export const useGojoPose = (): UseGojoPoseState => {
  const [debugInfo, setDebugInfo] = useState<GojoPoseDebugInfo>(initialDebugInfo);
  const [isPoseMatched, setIsPoseMatched] = useState(false);
  const [isPoseTriggered, setIsPoseTriggered] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  const holdTimeRef = useRef(0);
  const cooldownRef = useRef(0);
  const lastTimestampRef = useRef(Date.now());
  const triggeredRef = useRef(false);
  const graceRef = useRef(0);
  const GRACE_MS = 350;

  const updateLandmarks = useCallback((landmarks?: NormalizedLandmark[]) => {
    const now = Date.now();
    const delta = Math.min(now - lastTimestampRef.current, 120);
    lastTimestampRef.current = now;

    if (cooldownRef.current > 0) {
      cooldownRef.current = Math.max(0, cooldownRef.current - delta);
      setCooldownTime(cooldownRef.current);
      if (cooldownRef.current === 0) {
        triggeredRef.current = false;
        setIsPoseTriggered(false);
      }
    }

    if (!landmarks || cooldownRef.current > 0) {
      holdTimeRef.current = 0;
      setHoldProgress(0);
      setIsPoseMatched(false);
      return;
    }

    const result = detectGojoPose(landmarks);
    setDebugInfo(result.debug);

    if (result.score >= SCORE_THRESHOLD) {
      graceRef.current = 0;
      holdTimeRef.current += delta;
      const progress = Math.min(holdTimeRef.current / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);
      setIsPoseMatched(true);

      if (progress >= 1 && !triggeredRef.current) {
        triggeredRef.current = true;
        setIsPoseTriggered(true);
        cooldownRef.current = COOLDOWN_DURATION_MS;
        setCooldownTime(cooldownRef.current);
        holdTimeRef.current = 0;
        setHoldProgress(0);
      }
    } else {
      graceRef.current += delta;
      if (graceRef.current > GRACE_MS) {
        holdTimeRef.current = 0;
        setHoldProgress(0);
        setIsPoseMatched(false);
      }
    }
  }, []);

  return {
    debugInfo,
    isPoseMatched,
    isPoseTriggered,
    holdProgress,
    cooldownTime,
    updateLandmarks,
  };
};
