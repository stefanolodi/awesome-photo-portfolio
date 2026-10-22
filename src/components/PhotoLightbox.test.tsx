import { fireEvent, render, screen } from '@testing-library/react';
import { PhotoLightbox } from './PhotoLightbox';
import { draftOf } from '../hooks/usePhotoAutosave';
import type { Photo } from '../types';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

const portrait: Photo = {
  id: 'portrait',
  title: 'Tower',
  note: '',
  src: 'https://example.test/tower.jpg',
  publicId: 'tower',
  width: 2000,
  height: 3000,
  displayOrder: 0,
};

function renderLightbox(photo: Photo) {
  return render(
    <PhotoLightbox
      photo={photo}
      onClose={() => {}}
      onNext={() => {}}
      onPrev={() => {}}
      canEdit={false}
      draftFor={draftOf}
      onSave={() => Promise.resolve(true)}
    />,
  );
}

function photoArea() {
  return screen.getByRole('img', { name: /Tower/ }).closest('.lightbox-media') as HTMLElement;
}

describe('PhotoLightbox', () => {
  it("passes a portrait photo's stored ratio to the photo area", () => {
    renderLightbox(portrait);

    expect(Number(photoArea().style.getPropertyValue('--photo-ratio'))).toBeCloseTo(2 / 3);
  });

  it('passes the natural ratio of the loaded image when the photo has no stored size', () => {
    renderLightbox({ ...portrait, width: undefined, height: undefined });
    const image = screen.getByRole('img', { name: /Tower/ });
    expect(photoArea().style.getPropertyValue('--photo-ratio')).toBe('');

    Object.defineProperty(image, 'naturalWidth', { value: 600 });
    Object.defineProperty(image, 'naturalHeight', { value: 900 });
    fireEvent.load(image);

    expect(Number(photoArea().style.getPropertyValue('--photo-ratio'))).toBeCloseTo(2 / 3);
  });
});
