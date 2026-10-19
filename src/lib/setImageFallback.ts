import type { SyntheticEvent } from 'react';

export const setImageFallback = (event: SyntheticEvent<HTMLImageElement>, label: string) => {
  const target = event.currentTarget;
  target.onerror = null;
  target.src = `https://placehold.co/1200x900/D4A373/1F1E1C?text=${encodeURIComponent(label)}`;
};
