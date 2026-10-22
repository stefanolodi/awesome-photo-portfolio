import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setImageFallback } from './setImageFallback';

describe('setImageFallback', () => {
  it('swaps a broken image for a placeholder that names it', () => {
    render(<img alt="Beach" src="https://broken.test/beach.jpg" onError={(e) => setImageFallback(e, 'Beach')} />);
    const img = screen.getByAltText<HTMLImageElement>('Beach');
    fireEvent.error(img);
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
