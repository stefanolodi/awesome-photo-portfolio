import { createClient } from '@supabase/supabase-js';

type Denial = { status: 401 | 403; error: string };

// Returns null for the owner. Rule 3 in docs/agents/coding-standards.md and ADR 0002.
export async function authorizeOwner(authHeader: string | undefined): Promise<Denial | null> {
  if (!authHeader?.startsWith('Bearer ')) return { status: 401, error: 'Unauthorized' };
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { status: 401, error: 'Unauthorized' };

  const ownerId = process.env.OWNER_USER_ID;
  // An unset OWNER_USER_ID denies everyone rather than letting any signed-in user through.
  if (!ownerId || user.id !== ownerId) return { status: 403, error: 'Forbidden' };
  return null;
}
