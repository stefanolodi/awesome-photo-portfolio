import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAlbum, useDeleteAlbum } from './useAlbums';
import { deleteCloudinaryAssets } from '../lib/cloudinary';
import { supabase } from '../lib/supabase';
import type { FakeDatabase } from '../test/fakeSupabase';

const db = vi.hoisted((): FakeDatabase => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: fakeSupabase(db) };
});

vi.mock('../lib/cloudinary', () => ({ deleteCloudinaryAssets: vi.fn(() => Promise.resolve()) }));

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
    db.albums = [{ id: 'album-1', title: 'Beach', event_date: '2026-05-01', year: 2026, display_order: 0 }];
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

describe('useDeleteAlbum', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(deleteCloudinaryAssets).mockReset().mockResolvedValue(undefined);
    db.albums = [{ id: 'album-1', title: 'Beach', cover_public_id: 'cover-1', display_order: 0 }];
    db.photos = [photo('a', 0, '2026-05-01T10:00:00Z'), photo('b', 1, '2026-05-01T10:00:01Z')];
  });

  const deleteAlbum = async () => {
    const { result } = renderHook(() => useDeleteAlbum(), { wrapper });
    await act(() => result.current.mutateAsync('album-1'));
  };

  it('deletes the album through delete_album, then its files in one Cloudinary call', async () => {
    const rpc = vi.spyOn(supabase, 'rpc');
    await deleteAlbum();

    expect(rpc).toHaveBeenCalledWith('delete_album', { album_id: 'album-1' });
    expect(db.albums).toEqual([]);
    expect(db.photos).toEqual([]);
    expect(deleteCloudinaryAssets).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAssets).toHaveBeenCalledWith(['a', 'b', 'cover-1'], 'owner-token');
  });

  it('succeeds when the Cloudinary delete fails', async () => {
    vi.mocked(deleteCloudinaryAssets).mockRejectedValue(new Error('Failed to delete assets'));
    await expect(deleteAlbum()).resolves.toBeUndefined();
    expect(db.albums).toEqual([]);
  });

  it('fails and leaves the files alone when delete_album fails', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({ data: null, error: { message: 'denied' } });
    await expect(deleteAlbum()).rejects.toMatchObject({ message: 'denied' });
    expect(deleteCloudinaryAssets).not.toHaveBeenCalled();
    expect(db.albums).toHaveLength(1);
  });
});
