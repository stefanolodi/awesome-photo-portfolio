import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { mapPhoto } from '../lib/mappers';
import type { AlbumPhoto } from '../types';

export const ALL_PHOTOS_KEY = ['all-photos'] as const;

// enabled stays false until the viewer opens All Photos, so the home page loads no photo rows before then.
export function useAllPhotos(enabled: boolean) {
  return useQuery({
    queryKey: ALL_PHOTOS_KEY,
    queryFn: async (): Promise<AlbumPhoto[]> => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        // The same photo order as useAlbum, so each album reads here as it does on its own page.
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return data.map((row) => ({ albumId: row.album_id, photo: mapPhoto(row) }));
    },
    enabled,
  });
}
