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
- Run `npm run test` before finishing any task; fix failures

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
