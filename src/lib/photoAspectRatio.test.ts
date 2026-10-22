import { describe, expect, it } from 'vitest';
import type { Photo } from '../types';
import { photoAspectRatio } from './photoAspectRatio';

const photo = (size: Partial<Pick<Photo, 'width' | 'height'>>) => ({ id: 'p', ...size }) as Photo;

describe('photoAspectRatio', () => {
  it('uses the stored width and height', () => {
    expect(photoAspectRatio(photo({ width: 2000, height: 3000 }))).toBeCloseTo(2 / 3);
    expect(photoAspectRatio(photo({ width: 3000, height: 2000 }), { width: 100, height: 100 })).toBeCloseTo(1.5);
  });

  it('falls back to the natural size of the loaded image when the photo has no stored size', () => {
    expect(photoAspectRatio(photo({}), { width: 600, height: 900 })).toBeCloseTo(2 / 3);
  });

  it('falls back to the natural size when the stored size is not usable', () => {
    expect(photoAspectRatio(photo({ width: 0, height: 900 }), { width: 900, height: 900 })).toBe(1);
  });

  it('returns undefined when neither size is known', () => {
    expect(photoAspectRatio(photo({}))).toBeUndefined();
    expect(photoAspectRatio(photo({}), { width: 0, height: 0 })).toBeUndefined();
  });
});
