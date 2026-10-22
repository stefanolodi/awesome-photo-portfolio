import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAlbum } from './useAlbums';
import type { FakeDatabase } from '../test/fakeSupabase';

const db = vi.hoisted((): FakeDatabase => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: fakeSupabase(db) };
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const photo = (id: string, displayOrder: number, createdAt: string) => ({
  id,
  album_id: 'album-1',
  title: id,
  note: '',
  url: `https://example.test/${id}.jpg`,
  public_id: id,
  display_order: displayOrder,
  created_at: createdAt,
});

describe('useAlbum', () => {
  it('returns photos that share a display order in the order they were created', async () => {
    db.albums = [{ id: 'album-1', title: 'Beach', display_order: 0 }];
    db.photos = [
      photo('late', 1, '2026-05-01T10:00:03Z'),
      photo('first', 0, '2026-05-01T10:00:09Z'),
      photo('early', 1, '2026-05-01T10:00:01Z'),
      photo('middle', 1, '2026-05-01T10:00:02Z'),
    ];

    const { result } = renderHook(() => useAlbum('album-1'), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.photos.map((p) => p.id)).toEqual(['first', 'early', 'middle', 'late']);
  });
});
