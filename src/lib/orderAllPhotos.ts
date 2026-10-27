import type { Album, AlbumPhoto, Photo } from '../types';

// Newest album first, with albums that share an eventDate kept whole in album order. Each album's
// photos keep the order they arrive in, and photos of albums not in the list are dropped.
export function orderAllPhotos(albums: Album[], photos: AlbumPhoto[]): { album: Album; photo: Photo }[] {
  const byAlbum = new Map<string, Photo[]>();
  for (const { albumId, photo } of photos) {
    const list = byAlbum.get(albumId);
    if (list) list.push(photo);
    else byAlbum.set(albumId, [photo]);
  }
  return [...albums]
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.displayOrder - b.displayOrder)
    .flatMap((album) => (byAlbum.get(album.id) ?? []).map((photo) => ({ album, photo })));
}
