import type { Stroke } from './drawing';
import { renderCanvas } from './drawing';

export const exportAirWriteImage = (video: HTMLVideoElement, strokes: Stroke[], currentStroke: Stroke | null) => {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create export canvas context');
  }

  ctx.drawImage(video, 0, 0, width, height);
  renderCanvas(ctx, strokes, currentStroke);

  return canvas.toDataURL('image/png');
};
