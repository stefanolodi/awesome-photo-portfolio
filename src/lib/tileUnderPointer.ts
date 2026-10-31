import { closestCenter, pointerWithin, type CollisionDetection } from '@dnd-kit/core';

// Tiles differ in height, so the tile nearest the dragged tile's centre can be one the cursor is not on.
// The gaps between tiles belong to no tile, and there the nearest one takes the drop.
export const tileUnderPointer: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : closestCenter(args);
};
