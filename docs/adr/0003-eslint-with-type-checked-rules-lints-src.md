# ESLint with type-checked rules lints `src`

The data hooks call Supabase and Cloudinary through promises, and nothing stopped a rejected promise from failing silently or an `any` response from reaching the UI unchecked. `tsc` accepts both. ESLint with `typescript-eslint`'s `recommendedTypeChecked` config reads the type checker and reports them (`no-floating-promises`, `no-misused-promises`, `no-unsafe-*`). `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` add the React rules. `npm run lint` runs first in `npm run verify` and fails on any warning.

We rejected oxlint. With its default rules it found nothing in `src` on 2026-10-19, and its type-aware rules were experimental. Its speed does not matter in a repo this size. We rejected Biome, because its React hooks rules are thinner and its formatter would reformat every file, which is a separate decision.

On 2026-10-19 the linter found 36 problems in code that predates it. `eslint-suppressions.json` records them, so they pass and any new finding fails. Issues #12, #13 and #14 fix them, and each fix runs `npx eslint src --prune-suppressions` so the file only shrinks. `react-hooks/exhaustive-deps` is set to `error`, because bulk suppressions record errors only. `api/` is not linted yet, because `tsconfig.json` does not include it. Issue #11 adds it.
