import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import { AlbumPage } from './AlbumPage';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';

const db = vi.hoisted((): FakeDatabase => ({}));
const writes = vi.hoisted(() => ({
  fail: true,
  updates: [] as Record<string, unknown>[],
  reorders: [] as { id: string; display_order: number }[][],
}));
const drag = vi.hoisted((): { end?: (event: DragEndEvent) => void } => ({}));

// Reads answer from db. Writes fail unless a test sets writes.fail to false, and
// writes.updates and writes.reorders record every photo update and reorder the page sends.
vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  type Result = { data: unknown; error: { message: string } | null };
  // A query chain that runs `result` when the page awaits it.
  type Chain = PromiseLike<Result> & { eq: (column: string, value: unknown) => Chain; select: () => Chain; single: () => Chain };
  const chain = (result: (id: unknown) => Result): Chain => {
    let id: unknown;
    const self: Chain = {
      eq: (_column, value) => { id = value; return self; },
      select: () => self,
      single: () => self,
      then: (onFulfilled, onRejected) => Promise.resolve().then(() => result(id)).then(onFulfilled, onRejected),
    };
    return self;
  };
  const failed = () => chain(() => ({ data: null, error: { message: 'offline' } }));
  const fake = fakeSupabase(db);
  const updatePhoto = (values: Record<string, unknown>) => chain((id) => {
    writes.updates.push({ id, ...values });
    if (writes.fail) return { data: null, error: { message: 'offline' } };
    const row = db.photos.find((p) => p.id === id);
    if (row) Object.assign(row, values);
    return { data: row, error: null };
  });
  return {
    supabase: {
      from: (table: string) => ({
        ...fake.from(table),
        update: table === 'photos' ? updatePhoto : failed,
        delete: failed,
      }),
      rpc: (_name: string, { updates }: { updates: { id: string; display_order: number }[] }) => chain(() => {
        writes.reorders.push(updates);
        if (writes.fail) return { data: null, error: { message: 'offline' } };
        updates.forEach(({ id, display_order }) => {
          const row = db.photos.find((p) => p.id === id);
          if (row) row.display_order = display_order;
        });
        return { data: null, error: null };
      }),
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
  writes.fail = true;
  writes.updates = [];
  writes.reorders = [];
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

function swipeLightbox(fromX: number, toX: number) {
  const area = screen.getByRole('dialog').querySelector('.lightbox-media') as Element;
  fireEvent.touchStart(area, { touches: [{ clientX: fromX, clientY: 200 }] });
  fireEvent.touchEnd(area, { touches: [], changedTouches: [{ clientX: toX, clientY: 200 }] });
}

describe('AlbumPage', () => {
  it('tells the owner the album is still private when making it public fails', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Private album' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The album could not be made public, so it is still private. Try again.');
  });

  it('tells the owner when a photo cannot be deleted', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete photo' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The photo could not be deleted. Try again.');
  });

  it('keeps the note the owner types, and saves it once after the pause', async () => {
    writes.fail = false;
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const note = await screen.findByRole('textbox', { name: 'Note' });
    for (const value of ['N', 'Ne', 'New', 'New note']) fireEvent.change(note, { target: { value } });

    expect(note).toHaveValue('New note');
    expect(writes.updates).toHaveLength(0);
    expect(await screen.findByText('Saved', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(writes.updates).toEqual([{ id: 'photo-1', note: 'New note' }]);
    expect(note).toHaveValue('New note');
  });

  it('shows the saved note when the owner comes back to the photo', async () => {
    writes.fail = false;
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const note = await screen.findByRole('textbox', { name: 'Note' });
    fireEvent.change(note, { target: { value: 'New note' } });
    fireEvent.blur(note);
    await screen.findByText('Saved');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));

    expect(await screen.findByRole('textbox', { name: 'Note' })).toHaveValue('New note');
  });

  it('saves a pending edit when the owner moves to the next photo', async () => {
    writes.fail = false;
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Note' }), { target: { value: 'New note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));

    expect(screen.getByRole('dialog', { name: 'Photo detail Dinner' })).toBeInTheDocument();
    await waitFor(() => expect(writes.updates).toEqual([{ id: 'photo-1', note: 'New note' }]));
  });

  it('saves a pending edit when the owner swipes to the next photo', async () => {
    writes.fail = false;
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Note' }), { target: { value: 'New note' } });
    swipeLightbox(300, 100);

    expect(screen.getByRole('dialog', { name: 'Photo detail Dinner' })).toBeInTheDocument();
    await waitFor(() => expect(writes.updates).toEqual([{ id: 'photo-1', note: 'New note' }]));
  });

  it('wraps from the last photo to the first and back, with the buttons and with a swipe', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Dinner' }));
    await screen.findByRole('dialog', { name: 'Photo detail Dinner' });

    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('dialog', { name: 'Photo detail Beach' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(screen.getByRole('dialog', { name: 'Photo detail Dinner' })).toBeInTheDocument();

    swipeLightbox(300, 100);
    expect(screen.getByRole('dialog', { name: 'Photo detail Beach' })).toBeInTheDocument();
    swipeLightbox(100, 300);
    expect(screen.getByRole('dialog', { name: 'Photo detail Dinner' })).toBeInTheDocument();
  });

  it('shows no step buttons when the album has one photo', async () => {
    db.photos = [photo('photo-1', 'Beach', 0)];
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    await screen.findByRole('dialog', { name: 'Photo detail Beach' });

    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
  });

  it('keeps the text and tells the owner when a note cannot be saved', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const note = await screen.findByRole('textbox', { name: 'Note' });
    fireEvent.change(note, { target: { value: 'New note' } });
    fireEvent.blur(note);

    expect(await screen.findByRole('alert')).toHaveTextContent('The note could not be saved. Try again.');
    expect(note).toHaveValue('New note');

    writes.fail = false;
    fireEvent.change(note, { target: { value: 'Newer note' } });
    fireEvent.blur(note);
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('puts a cleared title back to the saved one and sends no save', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const title = await screen.findByRole('textbox', { name: 'Title' });
    fireEvent.change(title, { target: { value: '' } });
    fireEvent.blur(title);
    await act(() => new Promise((resolve) => setTimeout(resolve, 900)));

    expect(title).toHaveValue('Beach');
    expect(writes.updates).toHaveLength(0);
  });

  it('keeps the same photo open when the owner presses an arrow key in the note field', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const note = await screen.findByRole('textbox', { name: 'Note' });
    note.focus();
    fireEvent.keyDown(note, { key: 'ArrowRight' });
    fireEvent.keyDown(note, { key: 'ArrowLeft' });

    expect(screen.getByRole('dialog', { name: 'Photo detail Beach' })).toBeInTheDocument();
  });

  it('leaves the field on the first Escape and closes the lightbox on the second', async () => {
    await renderAlbumPage();
    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const note = await screen.findByRole('textbox', { name: 'Note' });
    note.focus();
    fireEvent.keyDown(note, { key: 'Escape' });

    expect(note).not.toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('saves a dragged photo at the position of the tile it was dropped on', async () => {
    writes.fail = false;
    await renderAlbumPage();
    act(() => drag.end?.({ active: { id: 'photo-1' }, over: { id: 'photo-2' } } as DragEndEvent));

    await waitFor(() => expect(writes.reorders).toEqual([[{ id: 'photo-2', display_order: 0 }, { id: 'photo-1', display_order: 1 }]]));
  });

  it('tells the owner when the new photo order cannot be saved, and lets them dismiss it', async () => {
    await renderAlbumPage();
    act(() => drag.end?.({ active: { id: 'photo-1' }, over: { id: 'photo-2' } } as DragEndEvent));

    expect(await screen.findByRole('alert')).toHaveTextContent('The new photo order could not be saved. Try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
