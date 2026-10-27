# CI applies Supabase migrations on merge, and agents never push to the live database

Until 2026-10-27 the schema lived only in the Supabase dashboard. No agent could read the tables, the row-level security policies that ADR 0002 depends on, or `reorder_albums`, and no change to them went through review. Now the schema lives in `supabase/migrations/`. The first file, `20261027024830_remote_schema.sql`, is the live schema as `supabase db pull` read it on 2026-10-27.

`.github/workflows/supabase-migrations.yml` runs when a change touches `supabase/migrations/`. On a pull request it runs `supabase db push --dry-run` against the live project, and on a push to `main` it runs `supabase db push`. It reads `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` and `SUPABASE_PROJECT_REF` from repo secrets. An agent writes migration files, runs them on a local stack and regenerates `src/lib/database.types.ts`, but it never runs `supabase db push` or `supabase migration repair` against the live project.

Vercel deploys the client and the Action applies the migration on their own schedules. For a short time the old client runs against the new schema, or the new client against the old one. So a migration only adds things, such as a column with a default or a new function. Removing or renaming something takes two changes: one that stops the client using it, then a migration that drops it.

We rejected agents running `supabase db push` from the owner's Mac. It changes live data before anyone reviews the migration, and the dashboard and the repo drift apart again as soon as one push skips a commit.

`src/lib/database.types.ts` is the output of `supabase gen types typescript --local`, so ESLint ignores it. Its generated helper types break `no-redundant-type-constituents`, and a hand fix would vanish on the next run. TypeScript still checks it in `npm run build`.
