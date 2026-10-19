import type { Photo } from '../types';

export function stepPhotoId(photos: Photo[], currentId: string | null, direction: 'next' | 'prev'): string | null {
  const currentIndex = photos.findIndex((p) => p.id === currentId);
  if (currentIndex < 0) return currentId;
  const step = direction === 'next' ? 1 : -1;
  const nextIndex = (currentIndex + step + photos.length) % photos.length;
  return photos[nextIndex]?.id ?? null;
}
