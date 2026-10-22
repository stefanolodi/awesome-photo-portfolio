import { render, screen } from '@testing-library/react';
import { HeroCover } from './HeroCover';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

const cover = 'https://res.cloudinary.com/penny/image/upload/v1/penny/albums/tower.jpg';

describe('HeroCover', () => {
  it('serves a subject-aware crop for each viewport shape, widest first', () => {
    const { container } = render(<HeroCover cover={cover} title="Tower" />);
    const sources = [...container.querySelectorAll('source')].map((s) => [s.getAttribute('media'), s.getAttribute('srcset')]);
    expect(sources).toEqual([
      ['(min-aspect-ratio: 3/2)', 'https://res.cloudinary.com/penny/image/upload/c_fill,g_auto,ar_16:9,w_1920/v1/penny/albums/tower.jpg'],
      ['(min-aspect-ratio: 1/1)', 'https://res.cloudinary.com/penny/image/upload/c_fill,g_auto,ar_4:3,w_1600/v1/penny/albums/tower.jpg'],
    ]);
    expect(screen.getByAltText('Tower').getAttribute('src')).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_fill,g_auto,ar_9:16,w_1080/v1/penny/albums/tower.jpg',
    );
  });
});
