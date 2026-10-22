import type { Photo } from '../types';

export type Size = { width?: number; height?: number };

function ratioOf({ width, height }: Size): number | undefined {
  if (!width || !height || width <= 0 || height <= 0) return undefined;
  const ratio = width / height;
  return Number.isFinite(ratio) ? ratio : undefined;
}

export function photoAspectRatio(photo: Photo, naturalSize?: Size): number | undefined {
  return ratioOf(photo) ?? (naturalSize ? ratioOf(naturalSize) : undefined);
}
