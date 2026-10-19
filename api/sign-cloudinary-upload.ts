import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import { authorizeOwner } from './_lib/authorizeOwner.js';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const denied = await authorizeOwner(req.headers.authorization);
  if (denied) {
    return res.status(denied.status).json({ error: denied.error });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'penny-portfolio/albums';

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string
  );

  const payload = {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: CLOUD_NAME,
    folder,
  };
  console.log('[sign-cloudinary-upload] payload:', {
    ...payload,
    apiKey: payload.apiKey ? `${payload.apiKey.slice(0, 6)}…` : 'MISSING',
    cloudName: payload.cloudName ?? 'MISSING',
    VITE_CLOUDINARY_CLOUD_NAME: process.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'MISSING',
    hasSecret: !!process.env.CLOUDINARY_API_SECRET,
  });
  return res.status(200).json(payload);
}
