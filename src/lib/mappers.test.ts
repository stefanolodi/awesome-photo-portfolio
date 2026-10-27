import { describe, expect, it } from 'vitest';
import type { Database } from './database.types';
import { mapAlbum } from './mappers';

type AlbumRow = Database['public']['Tables']['albums']['Row'];

const row = (fields: Partial<AlbumRow>): AlbumRow => ({
  id: 'a',
  title: 'Lake trip',
  description: '',
  event_date: '2024-07-14',
  year: 2024,
  cover_url: '',
  cover_public_id: '',
  is_private: true,
  display_order: 0,
  created_at: '',
  updated_at: '',
  ...fields,
});

describe('mapAlbum', () => {
  it('uses the year the database computed', () => {
    expect(mapAlbum(row({ year: 2024 })).year).toBe(2024);
  });

  it('takes the year from the event date when the row has none', () => {
    expect(mapAlbum(row({ year: null, event_date: '2019-03-02' })).year).toBe(2019);
  });
});
