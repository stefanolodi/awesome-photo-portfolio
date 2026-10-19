import { act, screen } from '@testing-library/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { HomePage } from './HomePage';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';

const db = vi.hoisted((): FakeDatabase => ({}));
const drag = vi.hoisted((): { end?: (event: DragEndEvent) => void } => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: {
      ...fakeSupabase(db),
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

function album(id: string, title: string, order: number) {
  return {
    id,
    title,
    description: `${title} description`,
    event_date: '2024-06-01',
    year: 2024,
    cover_url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
    cover_public_id: id,
    is_private: false,
    display_order: order,
  };
}

beforeEach(() => {
  db.albums = [album('album-1', 'Beach trip', 0), album('album-2', 'Mountain trip', 1)];
  db.photos = [];
});

describe('HomePage', () => {
  it('tells the owner when the new album order cannot be saved', async () => {
    renderWithProviders(<HomePage theme="light" onToggleTheme={() => {}} />, { isOwner: true });
    await screen.findAllByText('Beach trip');
    act(() => drag.end?.({ active: { id: 'album-1' }, over: { id: 'album-2' } } as DragEndEvent));

    expect(await screen.findByRole('alert')).toHaveTextContent('The new album order could not be saved. Try again.');
  });
});
