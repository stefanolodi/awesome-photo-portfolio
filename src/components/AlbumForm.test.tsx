import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AlbumForm } from './AlbumForm';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';

const db = vi.hoisted((): FakeDatabase => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: fakeSupabase(db) };
});

beforeEach(() => {
  db.albums = [];
});

describe('Rule 2: a new album is private until the owner makes it public', () => {
  it('starts with the private switch on', () => {
    renderWithProviders(<AlbumForm onClose={() => {}} />, { isOwner: true });
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('saves the album as private when the owner leaves the switch alone', async () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(<AlbumForm onClose={onClose} />, { isOwner: true });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Summer' } });
    fireEvent.change(screen.getByLabelText('Event date'), { target: { value: '2026-07-01' } });
    fireEvent.submit(container.querySelector('#album-form')!);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(db.albums).toEqual([expect.objectContaining({ title: 'Summer', is_private: true })]);
  });
});
