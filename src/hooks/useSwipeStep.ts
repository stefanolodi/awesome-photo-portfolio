import { useRef, type TouchEvent } from 'react';
import { swipeStep } from '../lib/swipeStep';

export function useSwipeStep(onNext: () => void, onPrev: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: TouchEvent) => {
      // A second finger ends the swipe for good, so a pinch never steps when its last finger lifts.
      const touch = event.touches[0];
      start.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchEnd: (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!start.current || event.touches.length > 0) return;
      const step = swipeStep(start.current, { x: touch.clientX, y: touch.clientY });
      start.current = null;
      if (step === 'next') onNext();
      if (step === 'prev') onPrev();
    },
    onTouchCancel: () => {
      start.current = null;
    },
  };
}
