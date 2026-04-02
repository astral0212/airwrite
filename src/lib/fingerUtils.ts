import type { NormalizedLandmark } from '@mediapipe/hands';

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
export type FingerState = 'extended' | 'bent' | 'folded' | 'tucked' | 'unknown';

const fingerLandmarks: Record<FingerName, number[]> = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};

const distance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const angleBetween = (a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark) => {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAB === 0 || magCB === 0) return 180;
  const cosine = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return Math.acos(cosine) * (180 / Math.PI);
};

export const getFingerCurl = (landmarks: NormalizedLandmark[], finger: FingerName) => {
  const indices = fingerLandmarks[finger];
  const [first, second, third, fourth] = indices.map((index) => landmarks[index]);

  if (!first || !second || !third || !fourth) {
    return 180;
  }

  if (finger === 'thumb') {
    const thumbBaseAngle = angleBetween(first, second, third);
    const thumbTipAngle = angleBetween(second, third, fourth);
    return (thumbBaseAngle + thumbTipAngle) / 2;
  }

  const pipAngle = angleBetween(first, second, third);
  const dipAngle = angleBetween(second, third, fourth);
  return (pipAngle + dipAngle) / 2;
};

export const getFingerTip = (landmarks: NormalizedLandmark[], finger: FingerName) => {
  const indices = fingerLandmarks[finger];
  return landmarks[indices[indices.length - 1]];
};

export const isThumbTucked = (landmarks: NormalizedLandmark[]) => {
  const thumbTip = getFingerTip(landmarks, 'thumb');
  const indexMcp = landmarks[5];
  const wrist = landmarks[0];

  if (!thumbTip || !indexMcp || !wrist) return false;

  const thumbToPalm = distance(thumbTip, wrist);
  const indexToPalm = distance(indexMcp, wrist);
  const thumbToIndex = distance(thumbTip, indexMcp);

  return thumbToIndex < 0.12 && thumbToPalm < indexToPalm * 0.8;
};

export const getFingerState = (landmarks: NormalizedLandmark[], finger: FingerName): FingerState => {
  const curl = getFingerCurl(landmarks, finger);

  if (finger === 'thumb') {
    if (isThumbTucked(landmarks)) {
      return 'tucked';
    }
    if (curl > 140) {
      return 'extended';
    }
    if (curl > 90) {
      return 'bent';
    }
    return 'folded';
  }

  if (curl > 150) {
    return 'extended';
  }
  if (curl > 100) {
    return 'bent';
  }
  return 'folded';
};

export const getFingerSpread = (landmarks: NormalizedLandmark[], finger: FingerName) => {
  const tip = getFingerTip(landmarks, finger);
  const mcp = landmarks[fingerLandmarks[finger][0]];

  if (!tip || !mcp) return 0;
  return distance(tip, mcp);
};
