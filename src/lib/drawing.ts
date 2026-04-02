export type Point = { x: number; y: number };
export type BrushStyle = 'pen' | 'marker' | 'neon' | 'chalk';
export type Stroke = {
  points: Point[];
  color: string;
  width: number;
  style: BrushStyle;
};

const MIN_POINT_DISTANCE = 2;
const SMOOTHING_FACTOR = 0.4;

export const shouldAddPoint = (lastPoint: Point | null, point: Point) => {
  if (!lastPoint) return true;
  const dx = point.x - lastPoint.x;
  const dy = point.y - lastPoint.y;
  return Math.sqrt(dx * dx + dy * dy) > MIN_POINT_DISTANCE;
};

export const smoothPoint = (lastPoint: Point, point: Point): Point => ({
  x: lastPoint.x + (point.x - lastPoint.x) * SMOOTHING_FACTOR,
  y: lastPoint.y + (point.y - lastPoint.y) * SMOOTHING_FACTOR,
});

export const setStrokeStyle = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  ctx.lineWidth = stroke.width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);

  switch (stroke.style) {
    case 'neon':
      ctx.strokeStyle = stroke.color;
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.92;
      break;
    case 'marker':
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = 0.86;
      break;
    case 'chalk':
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.setLineDash([stroke.width * 1.6, stroke.width * 0.8]);
      ctx.globalAlpha = 0.84;
      break;
    default:
      ctx.strokeStyle = stroke.color;
      break;
  }
};

export const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  if (stroke.points.length === 0) return;

  ctx.save();
  setStrokeStyle(ctx, stroke);
  ctx.beginPath();

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    const radius = Math.max(1, stroke.width / 2);
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  const points = stroke.points;
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev.x + current.x) / 2;
    const midY = (prev.y + current.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }

  ctx.stroke();
  ctx.restore();
};

export const renderCanvas = (ctx: CanvasRenderingContext2D, strokes: Stroke[], currentStroke: Stroke | null) => {
  strokes.forEach((stroke) => drawStroke(ctx, stroke));
  if (currentStroke) {
    drawStroke(ctx, currentStroke);
  }
};
