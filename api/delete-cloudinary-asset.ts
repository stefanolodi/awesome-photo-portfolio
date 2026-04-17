import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME,
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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthedUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
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
