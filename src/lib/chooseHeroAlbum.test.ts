import { describe, expect, it } from 'vitest';
import type { Album } from '../types';
import { chooseHeroAlbum } from './chooseHeroAlbum';

const album = (id: string, fields: Partial<Album> = {}): Album => ({
  id,
  isPrivate: false,
  isFeatured: false,
  year: 2026,
  title: id,
  eventDate: '2026-01-01',
  cover: '',
  coverPublicId: '',
  description: '',
  photos: [],
  displayOrder: 0,
  ...fields,
});

describe('chooseHeroAlbum', () => {
  const featuredPublic = [album('first'), album('featured', { isFeatured: true })];

  it('picks a featured public album for a guest', () => {
    expect(chooseHeroAlbum(featuredPublic, false)?.id).toBe('featured');
  });

  it('picks a featured public album for the owner', () => {
    expect(chooseHeroAlbum(featuredPublic, true)?.id).toBe('featured');
  });

  const featuredPrivate = [
    album('secret-first', { isPrivate: true }),
    album('first-public'),
    album('featured', { isPrivate: true, isFeatured: true }),
  ];

  it('shows the owner a featured private album', () => {
    expect(chooseHeroAlbum(featuredPrivate, true)?.id).toBe('featured');
  });

  it('gives a guest the first public album when the featured album is private', () => {
    expect(chooseHeroAlbum(featuredPrivate, false)?.id).toBe('first-public');
  });

  it('falls back to the first visible album when none is featured', () => {
    const albums = [album('secret', { isPrivate: true }), album('public')];
    expect(chooseHeroAlbum(albums, true)?.id).toBe('secret');
    expect(chooseHeroAlbum(albums, false)?.id).toBe('public');
  });

  it('returns nothing when the viewer can see no album', () => {
    expect(chooseHeroAlbum([], true)).toBeUndefined();
    expect(chooseHeroAlbum([album('secret', { isPrivate: true })], false)).toBeUndefined();
  });
});
