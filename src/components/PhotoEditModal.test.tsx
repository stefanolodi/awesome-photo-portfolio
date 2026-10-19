import { fireEvent, screen } from '@testing-library/react';
import { PhotoEditModal } from './PhotoEditModal';
import { renderWithProviders } from '../test/renderWithProviders';
import type { Photo } from '../types';

vi.mock('../lib/supabase', () => {
  const failed = Promise.resolve({ data: null, error: { message: 'offline' } });
  const query = { update: () => query, eq: () => query, select: () => query, single: () => failed };
  return { supabase: { from: () => query } };
});

const photo: Photo = {
  id: 'photo-1',
  title: 'Beach',
  note: 'Morning swim',
  src: 'https://res.cloudinary.com/demo/image/upload/beach.jpg',
  publicId: 'beach',
  displayOrder: 0,
};

describe('PhotoEditModal', () => {
  it('keeps the modal open and tells the owner when the save fails', async () => {
    const onClose = vi.fn();
    renderWithProviders(<PhotoEditModal photo={photo} albumId="album-1" onClose={onClose} />, { isOwner: true });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('The photo could not be saved. Try again.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
