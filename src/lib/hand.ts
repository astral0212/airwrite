import { NormalizedLandmark } from '@mediapipe/hands';

export const PINCH_ENTER_DISTANCE = 0.038;
export const PINCH_EXIT_DISTANCE = 0.055;
export const THUMB_TIP = 4;
export const INDEX_FINGER_TIP = 8;

export const getNormalizedDistance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isPinchBegin = (indexTip: NormalizedLandmark, thumbTip: NormalizedLandmark) =>
  getNormalizedDistance(indexTip, thumbTip) < PINCH_ENTER_DISTANCE;

export const isPinchContinue = (indexTip: NormalizedLandmark, thumbTip: NormalizedLandmark) =>
  getNormalizedDistance(indexTip, thumbTip) < PINCH_EXIT_DISTANCE;
