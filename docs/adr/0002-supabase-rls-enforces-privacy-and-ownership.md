# Supabase row-level security enforces privacy and ownership

The browser talks to Supabase directly with the public anon key, so anything the client filters out is still one request away. Row-level security on `albums` and `photos` hides private albums and their photos from everyone but the owner, and it allows writes only for the owner's user id. The filter in `src/App.tsx` only shapes the UI. The functions in `api/` run outside Supabase, so each one checks the owner's user id itself.

On 2026-10-19 an anonymous read returned only public albums and only photos in public albums. Writes were not tested against production.
