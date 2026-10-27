import type { Database } from './database.types';
import type { Album, Photo } from '../types';

type AlbumRow = Database['public']['Tables']['albums']['Row'];
type PhotoRow = Database['public']['Tables']['photos']['Row'];

export function mapPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    src: row.url,
    title: row.title,
    note: row.note,
    publicId: row.public_id,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    displayOrder: row.display_order,
  };
}

export function mapAlbum(row: AlbumRow, photos: Photo[] = []): Album {
  return {
    id: row.id,
    isPrivate: row.is_private,
    // year is a generated column with no NOT NULL, so its type allows null even though event_date never is.
    year: row.year ?? Number(row.event_date.slice(0, 4)),
    title: row.title,
    eventDate: row.event_date,
    cover: row.cover_url,
    coverPublicId: row.cover_public_id,
    description: row.description,
    photos,
    displayOrder: row.display_order,
  };
}
