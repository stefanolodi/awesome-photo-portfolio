import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AlbumForm } from './AlbumForm';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';
import { supabase } from '../lib/supabase';
import { mapAlbum } from '../lib/mappers';

const db = vi.hoisted((): FakeDatabase => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: fakeSupabase(db) };
});

beforeEach(() => {
  db.albums = [];
  vi.restoreAllMocks();
});

const albumRow = (id: string, isFeatured: boolean) => ({
  id,
  title: id,
  description: '',
  event_date: '2026-07-01',
  year: 2026,
  cover_url: '',
  cover_public_id: '',
  is_private: true,
  is_featured: isFeatured,
  display_order: 0,
  created_at: '',
  updated_at: '',
});

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector('#album-form')!);
}

describe('Rule 2: a new album is private until the owner makes it public', () => {
  it('starts with the private switch on', () => {
    renderWithProviders(<AlbumForm onClose={() => {}} />, { isOwner: true });
    expect(screen.getByRole('checkbox', { name: 'Private album' })).toBeChecked();
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

describe('the featured album toggle', () => {
  const editForm = (row: ReturnType<typeof albumRow>, onClose = vi.fn()) => {
    db.albums = [row];
    const rpc = vi.spyOn(supabase, 'rpc');
    const { container } = renderWithProviders(<AlbumForm album={mapAlbum(row)} onClose={onClose} />, { isOwner: true });
    return { rpc, container, onClose, toggle: screen.getByRole('checkbox', { name: 'Featured album' }) };
  };

  it('starts off for a new album', () => {
    renderWithProviders(<AlbumForm onClose={() => {}} />, { isOwner: true });
    expect(screen.getByRole('checkbox', { name: 'Featured album' })).not.toBeChecked();
  });

  it('starts from the album when the owner edits it', () => {
    const { toggle } = editForm(albumRow('a', true));
    expect(toggle).toBeChecked();
  });

  it('features the album with its id when the owner turns the toggle on', async () => {
    const { rpc, container, onClose, toggle } = editForm(albumRow('a', false));
    fireEvent.click(toggle);
    submit(container);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith('set_featured_album', { album_id: 'a' });
  });

  it('features nothing when the owner turns the toggle off', async () => {
    const { rpc, container, onClose, toggle } = editForm(albumRow('a', true));
    fireEvent.click(toggle);
    submit(container);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith('set_featured_album', { album_id: undefined });
    expect(db.albums[0]).toMatchObject({ is_featured: false });
  });

  it('leaves the featured album alone when the toggle did not change', async () => {
    const { rpc, container, onClose } = editForm(albumRow('a', true));
    submit(container);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(rpc).not.toHaveBeenCalled();
  });

  it('features a new album once it has an id', async () => {
    const rpc = vi.spyOn(supabase, 'rpc');
    const onClose = vi.fn();
    const { container } = renderWithProviders(<AlbumForm onClose={onClose} />, { isOwner: true });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Summer' } });
    fireEvent.change(screen.getByLabelText('Event date'), { target: { value: '2026-07-01' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Featured album' }));
    submit(container);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [created] = db.albums;
    expect(rpc).toHaveBeenCalledWith('set_featured_album', { album_id: created.id });
    expect(created).toMatchObject({ is_featured: true });
  });

  it('takes the flag from the album that had it', async () => {
    const featuredA = albumRow('a', true);
    const { container, onClose, toggle } = editForm(albumRow('b', false));
    db.albums.unshift(featuredA);
    fireEvent.click(toggle);
    submit(container);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(db.albums.filter((row) => row.is_featured).map((row) => row.id)).toEqual(['b']);
  });
});
