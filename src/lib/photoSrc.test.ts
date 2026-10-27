import { describe, expect, it, vi } from 'vitest';
import { photoSrc, photoSrcSet } from './photoSrc';

vi.mock('./supabase', () => ({ supabase: {} }));

describe('photoSrc', () => {
  it('asks Cloudinary for a resized copy of a photo with a version segment', () => {
    expect(photoSrc('https://res.cloudinary.com/penny/image/upload/v1712345678/penny/photos/beach.jpg', 600)).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_600/v1712345678/penny/photos/beach.jpg',
    );
  });

  it('asks for the same copy of a photo without a version segment', () => {
    expect(photoSrc('https://res.cloudinary.com/penny/image/upload/penny/photos/beach.jpg', 2400)).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_2400/penny/photos/beach.jpg',
    );
  });

  it('leaves a photo outside Cloudinary as it is', () => {
    expect(photoSrc('https://images.example.test/beach.jpg', 600)).toBe('https://images.example.test/beach.jpg');
    expect(photoSrc('', 600)).toBe('');
  });
});

describe('photoSrcSet', () => {
  it('lists one resized copy per width', () => {
    expect(photoSrcSet('https://res.cloudinary.com/penny/image/upload/v1/beach.jpg', [600, 1200])).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_600/v1/beach.jpg 600w, ' +
        'https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_1200/v1/beach.jpg 1200w',
    );
  });

  it('gives no srcset for a photo outside Cloudinary, which has only one size', () => {
    expect(photoSrcSet('https://images.example.test/beach.jpg', [600, 1200])).toBeUndefined();
  });
});
