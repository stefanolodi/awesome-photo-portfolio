import { render, screen } from '@testing-library/react';
import { PhotoGridImage } from './PhotoGridImage';
import type { Photo } from '../types';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

const photo: Photo = {
  id: 'beach',
  title: 'Beach',
  note: '',
  src: 'https://res.cloudinary.com/penny/image/upload/v1/penny/photos/beach.jpg',
  publicId: 'penny/photos/beach',
  width: 3024,
  height: 4032,
  displayOrder: 0,
};
const grid = { widths: [600, 1200], sizes: '25vw' };

describe('PhotoGridImage', () => {
  it('loads a resized copy and reserves the space of a photo with stored dimensions', () => {
    render(<PhotoGridImage photo={photo} grid={grid} />);
    const img = screen.getByAltText('Beach');

    expect(img.getAttribute('src')).toBe('https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_600/v1/penny/photos/beach.jpg');
    expect(img.getAttribute('srcset')).toBe(
      'https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_600/v1/penny/photos/beach.jpg 600w, ' +
        'https://res.cloudinary.com/penny/image/upload/c_limit,f_auto,q_auto,w_1200/v1/penny/photos/beach.jpg 1200w',
    );
    expect(img.getAttribute('sizes')).toBe('25vw');
    expect(img.getAttribute('width')).toBe('3024');
    expect(img.getAttribute('height')).toBe('4032');
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('sets no width or height for a photo without stored dimensions', () => {
    render(<PhotoGridImage photo={{ ...photo, width: undefined, height: undefined }} grid={grid} />);
    const img = screen.getByAltText('Beach');

    expect(img.hasAttribute('width')).toBe(false);
    expect(img.hasAttribute('height')).toBe(false);
  });
});
