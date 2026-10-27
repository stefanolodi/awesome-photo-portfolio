import { transformCloudinaryUpload } from './transformCloudinaryUpload';

// c_limit only shrinks, so a photo narrower than the width keeps its own size instead of being upscaled.
export function photoSrc(src: string, width: number): string {
  return transformCloudinaryUpload(src, `c_limit,f_auto,q_auto,w_${width}`);
}

export function photoSrcSet(src: string, widths: readonly number[]): string | undefined {
  // A file outside Cloudinary comes in one size only.
  if (photoSrc(src, widths[0]) === src) return undefined;
  return widths.map((width) => `${photoSrc(src, width)} ${width}w`).join(', ');
}
