import { describe, expect, it, vi } from 'vitest';
import { coverSrc, type CoverCrop } from './coverSrc';

vi.mock('./supabase', () => ({ supabase: {} }));

const square: CoverCrop = { aspectRatio: '1:1', width: 800 };

describe('coverSrc', () => {
  it('asks Cloudinary for a subject-aware crop of a cover with a version segment', () => {
    expect(coverSrc('https://res.cloudinary.com/penny/image/upload/v1712345678/penny/albums/beach.jpg', square)).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_fill,g_auto,ar_1:1,w_800/v1712345678/penny/albums/beach.jpg',
    );
  });

  it('asks for the same crop of a cover without a version segment', () => {
    expect(coverSrc('https://res.cloudinary.com/penny/image/upload/penny/albums/beach.jpg', { aspectRatio: '16:9', width: 1920 })).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_fill,g_auto,ar_16:9,w_1920/penny/albums/beach.jpg',
    );
  });

  it('leaves a cover with no public id as it is, since it is not a Cloudinary upload', () => {
    expect(coverSrc('https://images.example.test/beach.jpg', square)).toBe('https://images.example.test/beach.jpg');
    expect(coverSrc('', square)).toBe('');
  });
});
