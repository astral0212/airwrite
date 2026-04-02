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

// Pray 🙏 gesture — both hands pressed together
export const detectGojoPose = (
  allHands: NormalizedLandmark[][],
  config: GojoPoseConfig = DEFAULT_GOJO_POSE_CONFIG,
): GojoPoseResult => {
  if (allHands.length < 2) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  const h1 = allHands[0];
  const h2 = allHands[1];

  if (!h1 || !h2) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  // Wrist proximity (landmark 0)
  const wristScore = h1[0] && h2[0] ? proximityScore(distance(h1[0], h2[0]), 0.7) : 0;

  // Palm center proximity (landmark 9 = middle MCP)
  const palmScore = h1[9] && h2[9] ? proximityScore(distance(h1[9], h2[9]), 0.65) : 0;

  // Index tip proximity (landmark 8)
  const indexScore = h1[8] && h2[8] ? proximityScore(distance(h1[8], h2[8]), 0.6) : 0;

  // Pinky tip proximity (landmark 20)
  const pinkyScore = h1[20] && h2[20] ? proximityScore(distance(h1[20], h2[20]), 0.6) : 0;

  // Middle tip proximity (landmark 12)
  const middleScore = h1[12] && h2[12] ? proximityScore(distance(h1[12], h2[12]), 0.6) : 0;

  const score = clamp((wristScore * 1.5 + palmScore * 1.5 + indexScore + middleScore + pinkyScore) / 6.5, 0, 1);
  const matched = score >= config.scoreThreshold;

  const wristDist = h1[0] && h2[0] ? distance(h1[0], h2[0]) : 1;

  const debug: GojoPoseDebugInfo = {
    thumb: allHands.length >= 2 ? 'detected' : 'none',
    index: `hands: ${allHands.length}`,
    middle: `wrist dist: ${wristDist.toFixed(2)}`,
    ring: `palm score: ${palmScore.toFixed(2)}`,
    pinky: `tip score: ${indexScore.toFixed(2)}`,
    indexAboveMiddle: allHands.length >= 2,
    middleNearIndex: palmScore > 0.5,
    pinkySpread: pinkyScore,
    ringCurl: palmScore,
    thumbTuckDistance: wristDist,
    thumbScore: wristScore,
    indexScore,
    middleScore,
    ringScore: palmScore,
    pinkyScore,
    indexAboveMiddleScore: wristScore,
    middleNearIndexScore: palmScore,
    pinkySpreadScore: pinkyScore,
    thumbTuckScore: wristScore,
    scoreThreshold: config.scoreThreshold,
    score,
  };

  return { matched, score, debug };
};
