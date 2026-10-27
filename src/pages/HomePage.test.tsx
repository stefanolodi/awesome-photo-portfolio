import { act, fireEvent, screen } from '@testing-library/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { HomePage } from './HomePage';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';

const db = vi.hoisted((): FakeDatabase => ({}));
const reads = vi.hoisted((): string[] => []);
const drag = vi.hoisted((): { end?: (event: DragEndEvent) => void } => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  const base = fakeSupabase(db);
  return {
    supabase: {
      from: (table: string) => {
        reads.push(table);
        return base.from(table);
      },
      rpc: () => Promise.resolve({ data: null, error: { message: 'offline' } }),
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

function album(id: string, title: string, order: number, { eventDate = '2024-06-01', isPrivate = false } = {}) {
  return {
    id,
    title,
    description: `${title} description`,
    event_date: eventDate,
    year: Number(eventDate.slice(0, 4)),
    cover_url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
    cover_public_id: id,
    is_private: isPrivate,
    display_order: order,
  };
}

function photo(id: string, albumId: string, order: number, createdAt = '2024-06-02T10:00:00Z') {
  return {
    id,
    album_id: albumId,
    title: `Photo ${id}`,
    note: '',
    url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
    public_id: id,
    width: 1200,
    height: 800,
    display_order: order,
    created_at: createdAt,
  };
}

function feedTitles() {
  return screen
    .getAllByRole('img')
    .map((img) => img.getAttribute('alt'))
    .filter((alt) => alt?.startsWith('Photo '));
}

async function openAllPhotos() {
  await screen.findByRole('button', { name: 'All Photos' });
  fireEvent.click(screen.getByRole('button', { name: 'All Photos' }));
}

beforeEach(() => {
  db.albums = [album('album-1', 'Beach trip', 0), album('album-2', 'Mountain trip', 1)];
  db.photos = [];
  reads.length = 0;
});

describe('HomePage', () => {
  it('tells the owner when the new album order cannot be saved', async () => {
    renderWithProviders(<HomePage theme="light" onToggleTheme={() => {}} />, { isOwner: true });
    await screen.findAllByText('Beach trip');
    act(() => drag.end?.({ active: { id: 'album-1' }, over: { id: 'album-2' } } as DragEndEvent));

    expect(await screen.findByRole('alert')).toHaveTextContent('The new album order could not be saved. Try again.');
  });

  describe('All Photos', () => {
    beforeEach(() => {
      db.albums = [
        album('beach', 'Beach trip', 0),
        album('mountain', 'Mountain trip', 1),
        album('city', 'City trip', 2, { eventDate: '2025-03-10' }),
        album('secret', 'Secret trip', 3, { eventDate: '2025-08-01', isPrivate: true }),
      ];
      db.photos = [
        photo('m1', 'mountain', 0),
        photo('b2', 'beach', 1),
        photo('c2', 'city', 1),
        photo('s1', 'secret', 0),
        photo('b1', 'beach', 0),
        photo('c1b', 'city', 0, '2025-03-11T10:00:00Z'),
        photo('c1a', 'city', 0, '2025-03-10T10:00:00Z'),
        photo('m2', 'mountain', 1),
      ];
    });

    it('shows the newest album first, keeps albums that share a date whole in album order, and keeps each album in its photo order', async () => {
      renderWithProviders(<HomePage theme="light" onToggleTheme={() => {}} />, { isOwner: true });
      await openAllPhotos();
      await screen.findByRole('img', { name: 'Photo b1' });

      expect(feedTitles()).toEqual([
        'Photo s1',
        'Photo c1a',
        'Photo c1b',
        'Photo c2',
        'Photo b1',
        'Photo b2',
        'Photo m1',
        'Photo m2',
      ]);
    });

    it('shows a guest no photo from a private album', async () => {
      renderWithProviders(<HomePage theme="light" onToggleTheme={() => {}} />);
      await openAllPhotos();
      await screen.findByRole('img', { name: 'Photo b1' });

      expect(feedTitles()).not.toContain('Photo s1');
      expect(feedTitles()).toHaveLength(7);
    });

    it('says there are no photos yet when no visible album has any', async () => {
      db.photos = [photo('s1', 'secret', 0)];
      renderWithProviders(<HomePage theme="light" onToggleTheme={() => {}} />);
      await openAllPhotos();

      expect(await screen.findByText('No photos yet.')).toBeInTheDocument();
    });

    it('reads no photos until the viewer opens All Photos', async () => {
      renderWithProviders(<HomePage theme="light" onToggleTheme={() => {}} />);
      await screen.findAllByText('Beach trip');
      expect(reads).not.toContain('photos');

      await openAllPhotos();
      await screen.findByRole('img', { name: 'Photo b1' });
      expect(reads).toContain('photos');
    });
  });
});
