import { transformCloudinaryUpload } from './transformCloudinaryUpload';

export type CoverCrop = { aspectRatio: `${number}:${number}`; width: number };

// The crop must match the frame's shape. Otherwise `object-fit: cover` crops again around the center and loses what g_auto kept.
export function coverSrc(cover: string, crop: CoverCrop): string {
  return transformCloudinaryUpload(cover, `c_fill,g_auto,ar_${crop.aspectRatio},w_${crop.width}`);
}
