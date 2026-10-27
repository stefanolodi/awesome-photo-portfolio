import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import { authorizeOwner } from './_lib/authorizeOwner.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary's Admin API takes at most 100 public ids per delete_resources call.
const DELETE_BATCH_SIZE = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const denied = await authorizeOwner(req.headers.authorization);
  if (denied) {
    return res.status(denied.status).json({ error: denied.error });
  }

  const { publicIds } = req.body as { publicIds?: unknown };
  if (!Array.isArray(publicIds) || publicIds.length === 0 || !publicIds.every((id) => typeof id === 'string')) {
    return res.status(400).json({ error: 'publicIds must be a non-empty array of strings' });
  }

  try {
    for (let start = 0; start < publicIds.length; start += DELETE_BATCH_SIZE) {
      await cloudinary.api.delete_resources(publicIds.slice(start, start + DELETE_BATCH_SIZE));
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
}
