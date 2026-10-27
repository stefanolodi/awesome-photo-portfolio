import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { setImageFallback } from './setImageFallback';

vi.mock('./supabase', () => ({ supabase: {} }));

describe('setImageFallback', () => {
  it('swaps a broken image for a placeholder that names it', () => {
    render(<img alt="Beach" src="https://broken.test/beach.jpg" onError={(e) => setImageFallback(e, 'Beach')} />);
    const img = screen.getByAltText<HTMLImageElement>('Beach');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe('https://placehold.co/1200x900/D4A373/1F1E1C?text=Beach');
  });

  it('drops the srcset of a broken image, which the browser would otherwise pick over the placeholder', () => {
    render(
      <img
        alt="Beach"
        src="https://broken.test/beach-600.jpg"
        srcSet="https://broken.test/beach-600.jpg 600w, https://broken.test/beach-1200.jpg 1200w"
        onError={(e) => setImageFallback(e, 'Beach')}
      />,
    );
    const img = screen.getByAltText<HTMLImageElement>('Beach');
    fireEvent.error(img);
    expect(img.hasAttribute('srcset')).toBe(false);
    expect(img.getAttribute('src')).toBe('https://placehold.co/1200x900/D4A373/1F1E1C?text=Beach');
  });

  it('drops the sources of a picture, which the browser would otherwise pick over the placeholder', () => {
    const { container } = render(
      <picture>
        <source media="(min-aspect-ratio: 3/2)" srcSet="https://broken.test/wide.jpg" />
        <img alt="Beach" src="https://broken.test/tall.jpg" onError={(e) => setImageFallback(e, 'Beach')} />
      </picture>,
    );
    fireEvent.error(screen.getByAltText('Beach'));
    expect(container.querySelector('source')?.hasAttribute('srcset')).toBe(false);
  });
});
