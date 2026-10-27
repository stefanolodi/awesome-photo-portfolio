import type { SyntheticEvent } from 'react';

export const setImageFallback = (event: SyntheticEvent<HTMLImageElement>, label: string) => {
  const target = event.currentTarget;
  target.onerror = null;
  // The browser picks from srcset over src, so a broken srcset would hide the placeholder.
  target.removeAttribute('srcset');
  // Clearing srcset, not removing the <source>, leaves the nodes React owns in place.
  if (target.parentElement instanceof HTMLPictureElement) {
    target.parentElement.querySelectorAll('source').forEach((source) => source.removeAttribute('srcset'));
  }
  target.src = `https://placehold.co/1200x900/D4A373/1F1E1C?text=${encodeURIComponent(label)}`;
};
