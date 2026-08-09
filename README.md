# Uma Compass

A toolkit for Umamusume: Pretty Derby drafts and server tournaments — track reference, uma kit
classification, draft/strategy planning, and a full tournament runner (brackets, groups, leagues)
with Discord-ready result exports.

**This project is in beta.** Some skill condition data may still be inaccurate — always
double-check against [gametora.com](https://gametora.com/umamusume) when it matters.

## Tools

- **Track Database** — every course with distance, surface, threshold, and last-spurt timing,
  plus the skills that tend to matter there.
- **Uma Kit Library** — every uma's kit, classified by race phase, accel-vs-velocity, and
  corner/straight focus.
- **Strategy Planner** — filter by distance, accel/spurt shape, and surface to find matching
  tracks, skills, and umas.
- **Draft Board** — manage your saved tracks and umas, with recommendations.
- **Tournaments** — run knockout, group+knockout, or league formats for 3-vs-3-vs-3 server
  competitions, with standings, brackets, and one-click Discord result exports.

## Setup

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To build a static production bundle:

```bash
npm run build
npm run preview
```

## Structure

- `src/pages/` — one file per tool/page
- `src/components/` — shared UI (layout, nav, tournament sub-components, track visuals)
- `src/data/` — track, event, uma profile, and skill-name datasets
- `src/utils/` — recommendation engine, skill classifier, tournament engine, Discord export
  formatting
- `src/context/` — draft pool and tournament state (persisted to `localStorage`)

## Adding a favicon

There isn't one yet. To add one:

1. Get/make a small square image (a `.png` or `.ico`, e.g. 32x32 or 64x64).
2. Drop it in the `public/` folder (create that folder if it doesn't exist yet) — e.g. `public/favicon.png`.
3. In `index.html`, add this inside `<head>`:
   ```html
   <link rel="icon" type="image/png" href="/favicon.png" />
   ```
   (use `type="image/x-icon"` if you go with a `.ico` file instead)
4. Restart `npm run dev` (or rebuild) to see it in the browser tab.

## Links

- Project: https://github.com/Wolfhaize/Uma-Compass
- Discord: https://discord.gg/XD4w2PSAz7

## License

GPL-3.0-or-later — see [LICENSE](./LICENSE).
