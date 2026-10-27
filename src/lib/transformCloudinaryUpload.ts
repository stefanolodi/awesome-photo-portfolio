const cloudinaryUpload = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

// Cloudinary reads a transformation from the path segment right after /upload/, so an existing file needs no re-upload.
export function transformCloudinaryUpload(url: string, transformation: string): string {
  const prefix = cloudinaryUpload.exec(url)?.[0];
  if (!prefix) return url;
  return `${prefix}${transformation}/${url.slice(prefix.length)}`;
}
