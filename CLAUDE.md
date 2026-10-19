# Penny Portfolio

A private, personal photo portfolio app. The owner browses and curates their photo albums; guests view shared content in read-only mode. No social features — purely a memory archive.

## Stack

- **React 19** + **Vite 7** + **TypeScript 5**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no `tailwind.config.js`, configured in CSS)
- **react-router-dom v7** for routing
- **@dnd-kit** (core + sortable + utilities) for drag-and-drop reordering
- **Lenis** for smooth scroll (`window.__lenis` global)
- **lucide-react** for icons
- **vitest + @testing-library/react** for tests
- **Puppeteer** available for screenshot capture (`npm run screenshot`)

## Path alias

`@/` maps to `src/` (configured in `vite.config.ts`).

## Architecture

All state is **in-memory React state** — no backend or persistence yet.

```
src/
  App.tsx          # All page components and main routing
  data.ts          # Seed albums (picsum.photos placeholders)
  types.ts         # Album and Photo types
  styles.css       # All styles (CSS custom props + Tailwind utilities)
  useSmoothScroll.ts
  components/ui/
    theme-toggle.tsx
```

### Core types

```ts
type Photo  = { id, src, title, note }
type Album  = { id, isPrivate, year, title, eventDate, cover, description, photos[] }
```

### Routing

- `/` — HomePage (hero + album grid + year filter + all-photos feed)
- `/album/:albumId` — AlbumPage (hero + masonry photo grid + lightbox)

### Owner vs Guest mode

Toggled via `viewerMode` state (`'owner' | 'guest'`). In owner mode:
- Private albums are visible and editable
- Drag-and-drop reordering is active (albums on home, photos in album)
- Per-photo notes are editable
- Privacy toggle available on album hero

In guest mode: private albums are hidden/blocked; lightbox notes are read-only.

## Dev commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc + vite build
npm run test      # vitest run (single pass)
npm run test:watch
npm run screenshot
npm run lint      # eslint, fails on any warning
npm run verify    # lint, then build, then test. CI runs the same
```

## Styling conventions

- All styles live in `src/styles.css` — BEM-ish class names, no CSS modules
- CSS custom properties for theming: `--bg`, `--ink`, `--brand`, `--accent-orange`, `--panel`, `--line`, `--shadow`
- Dark mode via `[data-theme='dark']` on `<html>`; theme persisted in `localStorage` under key `penny-theme`
- Fonts: **Manrope** (body), **Instrument Serif** (hero headings)
- Responsive breakpoints: `max-width: 1024px` and `max-width: 760px`
- Animations: `fade-in-up` keyframe; respect `prefers-reduced-motion`

## Key rules

- **UI tasks**: invoke the `frontend-design` skill before implementing
- **Non-UI tasks** (data, refactor, tests): skip `frontend-design`
- Desktop-first responsive design
- No social features: no comments, likes, follows, DMs, or feeds
- Default new albums to private
- No photo downloads for guests
- Preserve accessibility: semantic HTML, keyboard focus states, color contrast
- Keep state predictable; no hidden side effects
- Run `npm run verify` before finishing any task; fix failures

## Visual references

Design references are in `references/`:
- `website reference 2.png` — home page editorial grid feel
- `website reference 3.png` — album page large hero + masonry feel
- `Brand 1.png`, `Brand 2.jpg` — brand direction

## Planned features (not yet built)

- Owner authentication
- Real photo upload and cloud storage
- Shareable public links with optional password protection
- Backend persistence

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `stefanolodi/awesome-photo-portfolio`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The repo uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- stefanolodi-setup-repo -->
## Workflow

### Coding standards

How code is written here, the commands for install and verify, and the definition of done. See `docs/agents/coding-standards.md`.

### Git workflow

Feature branches, declarative conventional commits, PR bodies from the `pr` skill, squash merges only. See `docs/agents/git-workflow.md`.

### AFK pipeline

`afk-run` takes `ready-for-agent` issues through `afk-implement`, `afk-code-review` and `afk-pr`, one fresh subagent per stage, handing off through files under `.git/afk/<n>/`. See `docs/agents/afk.md`.

### ADRs

When `docs/adr/README.md` exists, read it and not the `docs/adr/` directory. It holds one line per decision. Open a single ADR only when you are changing what it governs. Every new ADR adds its line to the index in the same commit, and the first ADR creates the index.

### Handoff notes

`docs/handoff/` holds one file per investigation that outlived its PR, such as a platform bug we work around or a diagnosis the code does not explain. Name it `<issue>-<slug>.md` and list it here with one line. Read one only when the code points you at it. A comment that depends on a handoff names the file.
