export type CoverCrop = { aspectRatio: `${number}:${number}`; width: number };

const cloudinaryUpload = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

// The crop must match the frame's shape. Otherwise `object-fit: cover` crops again around the center and loses what g_auto kept.
export function coverSrc(cover: string, crop: CoverCrop): string {
  const prefix = cloudinaryUpload.exec(cover)?.[0];
  if (!prefix) return cover;
  return `${prefix}c_fill,g_auto,ar_${crop.aspectRatio},w_${crop.width}/${cover.slice(prefix.length)}`;
}
