export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export function parseCloudinaryUpload(data: unknown): CloudinaryUploadResult {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Cloudinary upload response is not an object');
  }
  const { secure_url, public_id, width, height } = data as Record<string, unknown>;
  if (typeof secure_url !== 'string') throw new Error('Cloudinary upload response has no secure_url');
  if (typeof public_id !== 'string') throw new Error('Cloudinary upload response has no public_id');
  if (typeof width !== 'number') throw new Error('Cloudinary upload response has no width');
  if (typeof height !== 'number') throw new Error('Cloudinary upload response has no height');
  return { url: secure_url, publicId: public_id, width, height };
}
