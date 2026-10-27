import { useEffect } from 'react';
import Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      syncTouch: false
    });
    window.__lenis = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
}

let openOverlays = 0;
let pageOverflow = '';

// A stopped Lenis still cancels the wheel, so each overlay's scroll area also needs data-lenis-prevent.
// The <html> lock covers reduced motion, where Lenis never starts and the browser scrolls the page.
export function useOverlayScrollLock() {
  useEffect(() => {
    openOverlays += 1;
    if (openOverlays === 1) {
      window.__lenis?.stop();
      pageOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      openOverlays -= 1;
      if (openOverlays === 0) {
        window.__lenis?.start();
        document.documentElement.style.overflow = pageOverflow;
      }
    };
  }, []);
}
