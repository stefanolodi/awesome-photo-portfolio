import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { mapPhoto } from '../lib/mappers';
import { queryClient } from '../lib/queryClient';
import { deleteCloudinaryAsset } from '../lib/cloudinary';
import type { Photo } from '../types';

const photosKey = (albumId: string) => ['photos', albumId] as const;
const albumKey = (id: string) => ['album', id] as const;

export function usePhotos(albumId: string) {
  return useQuery({
    queryKey: photosKey(albumId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data.map(mapPhoto);
    },
    enabled: !!albumId,
  });
}

export interface PhotoInput {
  albumId: string;
  title: string;
  note?: string;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export function useCreatePhoto() {
  return useMutation({
    mutationFn: async (input: PhotoInput): Promise<Photo> => {
      const nextOrder = await getNextPhotoOrder(input.albumId);
      const { data, error } = await supabase
        .from('photos')
        .insert({
          album_id: input.albumId,
          title: input.title,
          note: input.note ?? '',
          url: input.url,
          public_id: input.publicId,
          width: input.width ?? null,
          height: input.height ?? null,
          display_order: nextOrder,
        })
        .select()
        .single();
      if (error) throw error;
      return mapPhoto(data);
    },
    onSuccess: (_photo, variables) => {
      queryClient.invalidateQueries({ queryKey: photosKey(variables.albumId) });
      queryClient.invalidateQueries({ queryKey: albumKey(variables.albumId) });
    },
  });
}

export function useUpdatePhoto() {
  return useMutation({
    mutationFn: async ({ id, albumId, ...input }: Partial<Omit<PhotoInput, 'albumId'>> & { id: string; albumId: string }): Promise<Photo> => {
      const { data, error } = await supabase
        .from('photos')
        .update({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.note !== undefined && { note: input.note }),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const photo = mapPhoto(data);
      queryClient.setQueryData<Photo[]>(photosKey(albumId), (old) =>
        old ? old.map((p) => (p.id === id ? photo : p)) : old
      );
      return photo;
    },
  });
}

export function useDeletePhoto() {
  return useMutation({
    mutationFn: async ({ id, albumId, publicId }: { id: string; albumId: string; publicId: string }) => {
      const { error } = await supabase.from('photos').delete().eq('id', id);
      if (error) throw error;
      if (publicId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) deleteCloudinaryAsset(publicId, session.access_token).catch(() => {});
      }
      return { albumId };
    },
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: photosKey(albumId) });
      queryClient.invalidateQueries({ queryKey: albumKey(albumId) });
    },
  });
}

export function useReorderPhotos(albumId: string) {
  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const { error } = await supabase.rpc('reorder_photos', { updates });
      if (error) throw error;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: photosKey(albumId) });
      const previous = queryClient.getQueryData<Photo[]>(photosKey(albumId));
      queryClient.setQueryData<Photo[]>(photosKey(albumId), (old) => {
        if (!old) return old;
        const orderMap = new Map(updates.map((u) => [u.id, u.display_order]));
        return [...old]
          .map((p) => ({ ...p, displayOrder: orderMap.get(p.id) ?? p.displayOrder }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(photosKey(albumId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: photosKey(albumId) });
    },
  });
}

async function getNextPhotoOrder(albumId: string): Promise<number> {
  const { data } = await supabase
    .from('photos')
    .select('display_order')
    .eq('album_id', albumId)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();
  return (data?.display_order ?? -1) + 1;
}
