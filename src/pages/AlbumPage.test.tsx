import { act, fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import { AlbumPage } from './AlbumPage';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';

const db = vi.hoisted((): FakeDatabase => ({}));
const drag = vi.hoisted((): { end?: (event: DragEndEvent) => void } => ({}));

// Every write fails, while reads answer from db, so the page loads and each change errors.
vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  type Failed = Promise<{ data: null; error: { message: string } }> & { eq: () => Failed; select: () => Failed; single: () => Failed };
  const failed = (): Failed =>
    Object.assign(Promise.resolve({ data: null, error: { message: 'offline' } }), { eq: failed, select: failed, single: failed });
  const fake = fakeSupabase(db);
  return {
    supabase: {
      from: (table: string) => ({ ...fake.from(table), update: failed, delete: failed }),
      rpc: failed,
    },
  };
});

// jsdom cannot run a pointer drag, so the test calls the page's drag handler itself.
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: (props: Parameters<typeof actual.DndContext>[0]) => {
      drag.end = (event) => props.onDragEnd?.(event);
      return <actual.DndContext {...props} />;
    },
  };
});

function photo(id: string, title: string, order: number) {
  return {
    id,
    album_id: 'album-1',
    title,
    note: `${title} note`,
    url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
    public_id: id,
    width: null,
    height: null,
    display_order: order,
  };
}

beforeEach(() => {
  db.albums = [{
    id: 'album-1',
    title: 'Secret party',
    description: 'Secret party description',
    event_date: '2019-06-01',
    year: 2019,
    cover_url: 'https://res.cloudinary.com/demo/image/upload/cover.jpg',
    cover_public_id: 'cover',
    is_private: true,
    display_order: 0,
  }];
  db.photos = [photo('photo-1', 'Beach', 0), photo('photo-2', 'Dinner', 1)];
});

async function renderAlbumPage() {
  renderWithProviders(
    <Routes>
      <Route path="/album/:albumId" element={<AlbumPage theme="light" onToggleTheme={() => {}} />} />
    </Routes>,
    { path: '/album/album-1', isOwner: true }
  );
  await screen.findByRole('heading', { name: 'Secret party' });
}

describe('AlbumPage', () => {
  it('tells the owner the album is still private when making it public fails', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Private gallery' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The album could not be made public, so it is still private. Try again.');
  });

  it('tells the owner when a photo cannot be deleted', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete photo' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The photo could not be deleted. Try again.');
  });

  it('tells the owner when a note cannot be saved', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    fireEvent.change(await screen.findByPlaceholderText(/write a note/i), { target: { value: 'New note' } });

    expect(await screen.findByRole('alert')).toHaveTextContent('The note could not be saved. Try again.');
  });

  it('tells the owner when the new photo order cannot be saved, and lets them dismiss it', async () => {
    await renderAlbumPage();
    act(() => drag.end?.({ active: { id: 'photo-1' }, over: { id: 'photo-2' } } as DragEndEvent));

    expect(await screen.findByRole('alert')).toHaveTextContent('The new photo order could not be saved. Try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
