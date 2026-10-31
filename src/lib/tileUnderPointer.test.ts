import type { ClientRect, CollisionDetection } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import { tileUnderPointer } from './tileUnderPointer';

function rect(left: number, top: number, width: number, height: number): ClientRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// A tall tile on the left and a short tile on the right, 20px apart.
const tall = rect(0, 0, 100, 400);
const short = rect(120, 0, 100, 50);

function detect(pointerCoordinates: { x: number; y: number }, collisionRect: ClientRect) {
  const args = {
    active: { id: 'dragged' },
    collisionRect,
    droppableRects: new Map([['tall', tall], ['short', short]]),
    droppableContainers: [{ id: 'tall' }, { id: 'short' }],
    pointerCoordinates,
  } as unknown as Parameters<CollisionDetection>[0];
  return tileUnderPointer(args).map((collision) => collision.id);
}

describe('tileUnderPointer', () => {
  it('picks the tile under the cursor, even when the dragged tile sits closer to another', () => {
    expect(detect({ x: 95, y: 390 }, rect(120, 0, 100, 50))[0]).toBe('tall');
  });

  it('falls back to the nearest tile when the cursor is in a gap', () => {
    expect(detect({ x: 110, y: 20 }, rect(115, 0, 100, 50))[0]).toBe('short');
  });
});
