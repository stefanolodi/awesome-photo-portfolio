import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getAuthedUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthedUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
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
