import type { NormalizedLandmark } from '@mediapipe/hands';

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
  scoreThreshold: 0.35,
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

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const proximityScore = (dist: number, maxDist: number) => clamp(1 - dist / maxDist, 0, 1);

const emptyDebug = (scoreThreshold: number): GojoPoseDebugInfo => ({
  thumb: 'none',
  index: 'none',
  middle: 'none',
  ring: 'none',
  pinky: 'none',
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
  scoreThreshold,
  score: 0,
});

// Fist ✊ gesture — all fingers curled (small curl angles)
export const detectGojoPose = (
  allHands: NormalizedLandmark[][],
  config: GojoPoseConfig = DEFAULT_GOJO_POSE_CONFIG,
): GojoPoseResult => {
  const landmarks = allHands[0];
  if (!landmarks) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  // For a fist, all finger joints are bent — curl angles are small (30-80°)
  // We measure tip-to-wrist distance: in a fist, tips are close to the wrist
  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];

  if (!wrist || !indexTip || !middleTip || !ringTip || !pinkyTip || !thumbTip || !indexMcp) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  // In a fist, fingertips are close to the palm (wrist or MCP area)
  const maxCurlDist = 0.22;
  const indexScore = proximityScore(distance(indexTip, indexMcp), maxCurlDist);
  const middleScore = proximityScore(distance(middleTip, landmarks[9]!), maxCurlDist);
  const ringScore = proximityScore(distance(ringTip, landmarks[13]!), maxCurlDist);
  const pinkyScore = proximityScore(distance(pinkyTip, landmarks[17]!), maxCurlDist);
  const thumbScore = proximityScore(distance(thumbTip, indexMcp), 0.28);

  const score = clamp((indexScore + middleScore + ringScore + pinkyScore + thumbScore * 0.5) / 4.5, 0, 1);
  const matched = score >= config.scoreThreshold;

  const debug: GojoPoseDebugInfo = {
    thumb: thumbScore > 0.5 ? 'curled' : 'open',
    index: indexScore > 0.5 ? 'curled' : 'open',
    middle: middleScore > 0.5 ? 'curled' : 'open',
    ring: ringScore > 0.5 ? 'curled' : 'open',
    pinky: pinkyScore > 0.5 ? 'curled' : 'open',
    indexAboveMiddle: false,
    middleNearIndex: false,
    pinkySpread: pinkyScore,
    ringCurl: ringScore,
    thumbTuckDistance: distance(thumbTip, indexMcp),
    thumbScore,
    indexScore,
    middleScore,
    ringScore,
    pinkyScore,
    indexAboveMiddleScore: 0,
    middleNearIndexScore: 0,
    pinkySpreadScore: 0,
    thumbTuckScore: thumbScore,
    scoreThreshold: config.scoreThreshold,
    score,
  };

  return { matched, score, debug };
};
