import { describe, expect, it } from 'vitest';
import type { Photo } from '../types';
import { stepPhotoId } from './stepPhotoId';

const photos = ['a', 'b', 'c'].map((id) => ({ id }) as Photo);

describe('stepPhotoId', () => {
  it('moves to the next and previous photo', () => {
    expect(stepPhotoId(photos, 'b', 'next')).toBe('c');
    expect(stepPhotoId(photos, 'b', 'prev')).toBe('a');
  });

  it('wraps around at both ends', () => {
    expect(stepPhotoId(photos, 'c', 'next')).toBe('a');
    expect(stepPhotoId(photos, 'a', 'prev')).toBe('c');
  });

  it('keeps the current id when it is not in the list', () => {
    expect(stepPhotoId(photos, 'gone', 'next')).toBe('gone');
    expect(stepPhotoId(photos, null, 'next')).toBeNull();
  });
});
