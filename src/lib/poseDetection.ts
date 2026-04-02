import type { NormalizedLandmark } from '@mediapipe/hands';
import { getFingerCurl, getFingerState, getFingerTip, FingerState } from './fingerUtils';

export interface GojoPoseDebugInfo {
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
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
  scoreThreshold: 0.55,
  thumbTuckMaxDistance: 0.28,
  indexAboveMiddleMinY: 0.02,
  middleNearIndexMaxX: 0.14,
  middleNearIndexMaxY: 0.18,
  pinkySpreadMin: 0.03,
  pinkySpreadMax: 0.28,
  extendedCurlMax: 65,
  bentCurlMin: 35,
  bentCurlMax: 110,
  foldedCurlMin: 80,
  thumbWeight: 1,
  indexWeight: 1,
  middleWeight: 1,
  ringWeight: 1,
  pinkyWeight: 1,
  indexAboveMiddleWeight: 0.7,
  middleNearIndexWeight: 0.7,
  pinkySpreadWeight: 0.5,
};

const distance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalize = (value: number, min: number, max: number) => clamp((value - min) / (max - min), 0, 1);

const getExtendedScore = (curl: number, threshold: number) => clamp((threshold - curl) / threshold, 0, 1);

const getBentScore = (curl: number, min: number, max: number) => clamp((curl - min) / (max - min), 0, 1);

const getFoldedScore = (curl: number, min: number) => clamp((curl - min) / (180 - min), 0, 1);

export const detectGojoPose = (
  landmarks: NormalizedLandmark[],
  config: GojoPoseConfig = DEFAULT_GOJO_POSE_CONFIG,
): GojoPoseResult => {
  const thumbState = getFingerState(landmarks, 'thumb');
  const indexState = getFingerState(landmarks, 'index');
  const middleState = getFingerState(landmarks, 'middle');
  const ringState = getFingerState(landmarks, 'ring');
  const pinkyState = getFingerState(landmarks, 'pinky');

  const indexTip = getFingerTip(landmarks, 'index');
  const middleTip = getFingerTip(landmarks, 'middle');
  const ringTip = getFingerTip(landmarks, 'ring');
  const pinkyTip = getFingerTip(landmarks, 'pinky');
  const thumbTip = getFingerTip(landmarks, 'thumb');
  const indexMcp = landmarks[5];

  const indexAboveMiddle = Boolean(
    indexTip && middleTip && indexTip.y < middleTip.y - config.indexAboveMiddleMinY,
  );

  const middleNearIndex = Boolean(
    indexTip &&
      middleTip &&
      Math.abs(indexTip.x - middleTip.x) < config.middleNearIndexMaxX &&
      Math.abs(indexTip.y - middleTip.y) < config.middleNearIndexMaxY,
  );

  const pinkySpread = pinkyTip && ringTip ? distance(pinkyTip, ringTip) : 0;
  const thumbTuckDistance = thumbTip && indexMcp ? distance(thumbTip, indexMcp) : 1;

  const indexCurl = getFingerCurl(landmarks, 'index');
  const middleCurl = getFingerCurl(landmarks, 'middle');
  const ringCurlAngle = getFingerCurl(landmarks, 'ring');
  const pinkyCurl = getFingerCurl(landmarks, 'pinky');

  const thumbTuckScore = clamp((config.thumbTuckMaxDistance - thumbTuckDistance) / config.thumbTuckMaxDistance, 0, 1);
  const thumbScore = thumbTuckScore;
  const indexScore = getExtendedScore(indexCurl, config.extendedCurlMax);
  const middleScore = getBentScore(middleCurl, config.bentCurlMin, config.bentCurlMax);
  const ringScore = getFoldedScore(ringCurlAngle, config.foldedCurlMin);
  const pinkyScore = getExtendedScore(pinkyCurl, config.extendedCurlMax);
  const indexAboveMiddleScore = indexTip && middleTip ? normalize(middleTip.y - indexTip.y, 0, config.indexAboveMiddleMinY) : 0;
  const middleNearIndexScore =
    indexTip && middleTip
      ?
          (clamp((config.middleNearIndexMaxX - Math.abs(indexTip.x - middleTip.x)) / config.middleNearIndexMaxX, 0, 1) +
            clamp((config.middleNearIndexMaxY - Math.abs(indexTip.y - middleTip.y)) / config.middleNearIndexMaxY, 0, 1)) /
          2
      :
        0;
  const pinkySpreadScore = normalize(pinkySpread, config.pinkySpreadMin, config.pinkySpreadMax);

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
    thumb: thumbState,
    index: indexState,
    middle: middleState,
    ring: ringState,
    pinky: pinkyState,
    indexAboveMiddle,
    middleNearIndex,
    pinkySpread,
    ringCurl: ringState === 'folded' ? 1 : ringState === 'bent' ? 0.5 : 0,
    thumbTuckDistance,
    thumbScore,
    indexScore,
    middleScore,
    ringScore,
    pinkyScore,
    indexAboveMiddleScore,
    middleNearIndexScore,
    pinkySpreadScore,
    thumbTuckScore,
    scoreThreshold: config.scoreThreshold,
    score: normalizedScore,
  };

  return { matched, score: normalizedScore, debug };
};
