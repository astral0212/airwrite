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

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const proximityScore = (dist: number, maxDist: number) => clamp(1 - dist / maxDist, 0, 1);

// Peace sign ✌️ — index + middle extended, ring + pinky folded
export const detectPeaceSign = (landmarks: NormalizedLandmark[]): boolean => {
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];

  if (!indexTip || !middleTip || !ringTip || !pinkyTip || !indexMcp || !middleMcp || !ringMcp || !pinkyMcp) {
    return false;
  }

  const dist = (a: NormalizedLandmark, b: NormalizedLandmark) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  const indexExtended = dist(indexTip, indexMcp) > 0.20;
  const middleExtended = dist(middleTip, middleMcp) > 0.20;
  const ringFolded = dist(ringTip, ringMcp) < 0.14;
  const pinkyFolded = dist(pinkyTip, pinkyMcp) < 0.14;

  return indexExtended && middleExtended && ringFolded && pinkyFolded;
};

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

// Open palm 🖐 gesture — all fingers extended (hi-five)
export const detectGojoPose = (
  allHands: NormalizedLandmark[][],
  config: GojoPoseConfig = DEFAULT_GOJO_POSE_CONFIG,
): GojoPoseResult => {
  const landmarks = allHands[0];
  if (!landmarks) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  // For open palm, all fingertips should be far from their MCP knuckles
  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];
  const thumbMcp = landmarks[2];

  if (!wrist || !indexTip || !middleTip || !ringTip || !pinkyTip || !thumbTip || !indexMcp || !middleMcp || !ringMcp || !pinkyMcp || !thumbMcp) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  // Reject if thumb and index are pinching (= draw gesture, not open palm)
  const thumbIndexDist = distance(thumbTip, indexTip);
  if (thumbIndexDist < 0.08) {
    return { matched: false, score: 0, debug: emptyDebug(config.scoreThreshold) };
  }

  // In an open palm, fingertips are far from their MCP knuckles
  // Score = how extended each finger is (distance from tip to MCP)
  const minExtDist = 0.16;
  const maxExtDist = 0.30;
  const extScore = (tip: NormalizedLandmark, mcp: NormalizedLandmark) =>
    clamp((distance(tip, mcp) - minExtDist) / (maxExtDist - minExtDist), 0, 1);

  const indexScore = extScore(indexTip, indexMcp);
  const middleScore = extScore(middleTip, middleMcp);
  const ringScore = extScore(ringTip, ringMcp);
  const pinkyScore = extScore(pinkyTip, pinkyMcp);
  const thumbScore = clamp((distance(thumbTip, thumbMcp) - 0.10) / 0.18, 0, 1);

  const score = clamp((indexScore + middleScore + ringScore + pinkyScore + thumbScore * 0.5) / 4.5, 0, 1);
  const matched = score >= config.scoreThreshold;

  const debug: GojoPoseDebugInfo = {
    thumb: thumbScore > 0.5 ? 'extended' : 'folded',
    index: indexScore > 0.5 ? 'extended' : 'folded',
    middle: middleScore > 0.5 ? 'extended' : 'folded',
    ring: ringScore > 0.5 ? 'extended' : 'folded',
    pinky: pinkyScore > 0.5 ? 'extended' : 'folded',
    indexAboveMiddle: false,
    middleNearIndex: false,
    pinkySpread: pinkyScore,
    ringCurl: ringScore,
    thumbTuckDistance: distance(thumbTip, thumbMcp),
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
