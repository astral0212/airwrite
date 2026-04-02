import type { NormalizedLandmark } from '@mediapipe/hands';
import { getFingerCurl, getFingerTip } from './fingerUtils';

export interface GojoPoseDebugInfo {
  thumb: string;
  index: string;
  middle: string;
  ring: string;
  pinky: string;
  indexAboveMiddle: boolean;
  middleNearIndex: boolean;
  pinkySpread: number;
  ringCurl: number;
  thumbTuckDistance: number;
  thumbScore: number;
  indexScore: number;
  middleScore: number;
  ringScore: number;
  pinkyScore: number;
  indexAboveMiddleScore: number;
  middleNearIndexScore: number;
  pinkySpreadScore: number;
  thumbTuckScore: number;
  scoreThreshold: number;
  score: number;
}

export interface GojoPoseResult {
  matched: boolean;
  score: number;
  debug: GojoPoseDebugInfo;
}

export interface GojoPoseConfig {
  scoreThreshold: number;
  thumbTuckMaxDistance: number;
  indexAboveMiddleMinY: number;
  middleNearIndexMaxX: number;
  middleNearIndexMaxY: number;
  pinkySpreadMin: number;
  pinkySpreadMax: number;
  extendedCurlMax: number;
  bentCurlMin: number;
  bentCurlMax: number;
  foldedCurlMin: number;
  thumbWeight: number;
  indexWeight: number;
  middleWeight: number;
  ringWeight: number;
  pinkyWeight: number;
  indexAboveMiddleWeight: number;
  middleNearIndexWeight: number;
  pinkySpreadWeight: number;
}

export const DEFAULT_GOJO_POSE_CONFIG: GojoPoseConfig = {
  scoreThreshold: 0.42,
  thumbTuckMaxDistance: 0.35,
  indexAboveMiddleMinY: 0.01,
  middleNearIndexMaxX: 0.20,
  middleNearIndexMaxY: 0.25,
  pinkySpreadMin: 0.02,
  pinkySpreadMax: 0.35,
  extendedCurlMax: 100,
  bentCurlMin: 60,
  bentCurlMax: 160,
  foldedCurlMin: 110,
  thumbWeight: 1.5,
  indexWeight: 1.0,
  middleWeight: 1.0,
  ringWeight: 0.5,
  pinkyWeight: 1.5,
  indexAboveMiddleWeight: 0.2,
  middleNearIndexWeight: 0.2,
  pinkySpreadWeight: 0.5,
};

const distance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Extended = large curl angle (straight finger ~180°)
const getExtendedScore = (curl: number, min: number) => clamp((curl - min) / (180 - min), 0, 1);

// Folded = small curl angle (curled finger ~30-80°)
const getFoldedScore = (curl: number, max: number) => clamp(1 - curl / max, 0, 1);

export const detectGojoPose = (
  landmarks: NormalizedLandmark[],
  config: GojoPoseConfig = DEFAULT_GOJO_POSE_CONFIG,
): GojoPoseResult => {
  const indexTip = getFingerTip(landmarks, 'index');
  const middleTip = getFingerTip(landmarks, 'middle');
  const ringTip = getFingerTip(landmarks, 'ring');
  const pinkyTip = getFingerTip(landmarks, 'pinky');
  const thumbTip = getFingerTip(landmarks, 'thumb');
  const indexMcp = landmarks[5];

  const indexCurl = getFingerCurl(landmarks, 'index');
  const middleCurl = getFingerCurl(landmarks, 'middle');
  const ringCurl = getFingerCurl(landmarks, 'ring');
  const pinkyCurl = getFingerCurl(landmarks, 'pinky');

  // Thumb pinched against index — close distance between thumb tip and index tip/mcp
  const thumbToIndex = thumbTip && indexTip ? distance(thumbTip, indexTip) : 1;
  const thumbToMcp = thumbTip && indexMcp ? distance(thumbTip, indexMcp) : 1;
  const thumbPinchDist = Math.min(thumbToIndex, thumbToMcp);
  const thumbScore = clamp(1 - thumbPinchDist / config.thumbTuckMaxDistance, 0, 1);

  // Index: extended or slightly bent upward
  const indexScore = getExtendedScore(indexCurl, config.extendedCurlMax);

  // Middle: folded/bent downward (small curl angle)
  const middleScore = getFoldedScore(middleCurl, config.foldedCurlMin);

  // Ring: folded inward (small curl angle) — lenient
  const ringScore = getFoldedScore(ringCurl, config.foldedCurlMin * 1.2);

  // Pinky: extended outward
  const pinkyScore = getExtendedScore(pinkyCurl, config.extendedCurlMax);

  // Index above middle (index tip higher in frame = smaller y)
  const indexAboveMiddle = Boolean(indexTip && middleTip && indexTip.y < middleTip.y - config.indexAboveMiddleMinY);
  const indexAboveMiddleScore = indexTip && middleTip
    ? clamp((middleTip.y - indexTip.y) / 0.15, 0, 1)
    : 0;

  // Middle near index base
  const middleNearIndex = Boolean(
    indexTip && middleTip &&
    Math.abs(indexTip.x - middleTip.x) < config.middleNearIndexMaxX &&
    Math.abs(indexTip.y - middleTip.y) < config.middleNearIndexMaxY,
  );
  const middleNearIndexScore = indexTip && middleTip
    ? clamp(1 - distance(indexTip, middleTip) / 0.25, 0, 1)
    : 0;

  // Pinky spread away from ring
  const pinkySpread = pinkyTip && ringTip ? distance(pinkyTip, ringTip) : 0;
  const pinkySpreadScore = clamp((pinkySpread - config.pinkySpreadMin) / (config.pinkySpreadMax - config.pinkySpreadMin), 0, 1);

  const totalScore =
    thumbScore * config.thumbWeight +
    indexScore * config.indexWeight +
    middleScore * config.middleWeight +
    ringScore * config.ringWeight +
    pinkyScore * config.pinkyWeight +
    indexAboveMiddleScore * config.indexAboveMiddleWeight +
    middleNearIndexScore * config.middleNearIndexWeight +
    pinkySpreadScore * config.pinkySpreadWeight;

  const maxScore =
    config.thumbWeight +
    config.indexWeight +
    config.middleWeight +
    config.ringWeight +
    config.pinkyWeight +
    config.indexAboveMiddleWeight +
    config.middleNearIndexWeight +
    config.pinkySpreadWeight;

  const normalizedScore = clamp(totalScore / maxScore, 0, 1);
  const matched = normalizedScore >= config.scoreThreshold;

  const debug: GojoPoseDebugInfo = {
    thumb: thumbScore > 0.5 ? 'pinched' : 'open',
    index: indexScore > 0.5 ? 'extended' : 'folded',
    middle: middleScore > 0.5 ? 'folded' : 'extended',
    ring: ringScore > 0.5 ? 'folded' : 'extended',
    pinky: pinkyScore > 0.5 ? 'extended' : 'folded',
    indexAboveMiddle,
    middleNearIndex,
    pinkySpread,
    ringCurl: ringScore,
    thumbTuckDistance: thumbPinchDist,
    thumbScore,
    indexScore,
    middleScore,
    ringScore,
    pinkyScore,
    indexAboveMiddleScore,
    middleNearIndexScore,
    pinkySpreadScore,
    thumbTuckScore: thumbScore,
    scoreThreshold: config.scoreThreshold,
    score: normalizedScore,
  };

  return { matched, score: normalizedScore, debug };
};
