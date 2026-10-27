import { renderHook } from '@testing-library/react';
import type Lenis from 'lenis';
import { useOverlayScrollLock } from './useSmoothScroll';

vi.mock('./lib/supabase', () => ({ supabase: {} }));

const lenis = { stop: vi.fn(), start: vi.fn() };

beforeEach(() => {
  lenis.stop.mockReset();
  lenis.start.mockReset();
  window.__lenis = lenis as unknown as Lenis;
  document.documentElement.style.overflow = '';
});

afterEach(() => {
  delete window.__lenis;
});

describe('useOverlayScrollLock', () => {
  it('stops Lenis and locks the page while an overlay is open', () => {
    const overlay = renderHook(() => useOverlayScrollLock());

    expect(lenis.stop).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe('hidden');

    overlay.unmount();

    expect(lenis.start).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('keeps the page locked until the last of two overlays closes', () => {
    const first = renderHook(() => useOverlayScrollLock());
    const second = renderHook(() => useOverlayScrollLock());

    first.unmount();

    expect(lenis.start).not.toHaveBeenCalled();
    expect(document.documentElement.style.overflow).toBe('hidden');

    second.unmount();

    expect(lenis.start).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('locks the page when Lenis is off for reduced motion', () => {
    delete window.__lenis;
    const overlay = renderHook(() => useOverlayScrollLock());

    expect(document.documentElement.style.overflow).toBe('hidden');

    overlay.unmount();

    expect(document.documentElement.style.overflow).toBe('');
  });
});
