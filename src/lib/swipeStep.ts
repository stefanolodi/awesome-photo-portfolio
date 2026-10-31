type Point = { x: number; y: number };

const MIN_SWIPE_PX = 50;

export function swipeStep(start: Point, end: Point): 'next' | 'prev' | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? 'next' : 'prev';
}
