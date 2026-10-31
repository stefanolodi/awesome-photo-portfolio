import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useColumnCount } from './useColumnCount';

let listeners: (() => void)[] = [];

function setWindowWidth(width: number) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: width <= Number(/max-width: (\d+)px/.exec(query)?.[1]),
    addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
    removeEventListener: () => {},
  }) as unknown as MediaQueryList);
}

afterEach(() => {
  vi.restoreAllMocks();
  listeners = [];
});

describe('useColumnCount', () => {
  it.each([
    [1280, 4],
    [1025, 4],
    [1024, 3],
    [761, 3],
    [760, 2],
    [390, 2],
  ])('gives the album page at %ipx %i columns', (width, columns) => {
    setWindowWidth(width);

    expect(renderHook(() => useColumnCount(4)).result.current).toBe(columns);
  });

  it('gives All Photos 5 columns on a desktop window', () => {
    setWindowWidth(1280);

    expect(renderHook(() => useColumnCount(5)).result.current).toBe(5);
  });

  it('updates when the window resizes across a breakpoint', () => {
    setWindowWidth(1280);
    const { result } = renderHook(() => useColumnCount(4));

    setWindowWidth(800);
    act(() => listeners.forEach((listener) => listener()));

    expect(result.current).toBe(3);
  });
});
