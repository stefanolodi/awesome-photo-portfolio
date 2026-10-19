import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import { authorizeOwner } from './_lib/authorizeOwner.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const denied = await authorizeOwner(req.headers.authorization);
  if (denied) {
    return res.status(denied.status).json({ error: denied.error });
  }

  const { publicId } = req.body as { publicId?: string };
  if (!publicId) {
    return res.status(400).json({ error: 'publicId is required' });
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
}
