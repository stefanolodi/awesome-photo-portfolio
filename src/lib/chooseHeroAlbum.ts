import type { Album } from '../types';

// albums arrive in album order. See "Featured album" in GLOSSARY.md.
export function chooseHeroAlbum(albums: Album[], isOwner: boolean): Album | undefined {
  const visible = isOwner ? albums : albums.filter((a) => !a.isPrivate);
  return visible.find((a) => a.isFeatured) ?? visible[0];
}
