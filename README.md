# Uma Compass

A draft tool for Umamusume: Pretty Derby. Use it to browse every track and to work out which tracks,
skills and umas fit your accel plan before a draft.

**Live site:** https://uma-compass.wolfhaize.workers.dev/

**This project is in beta.** The track data is parsed from a community draft cheat sheet, so some
entries may be inaccurate. Double-check against
[gametora.com](https://gametora.com/umamusume) when it matters.

## Tools

- **Strategy Planner** (`/`) — filter tracks by distance, accel type, surface, accel skills and
  inherit umas.
  - A track can be valid for more than one accel type (C4 / C3 / Straight). Tags come from the
    skills listed on the track: Angling and Scheming or Let's Pump Some Iron! = C4, Moving Past
    and Beyond = C3, Straightaway Spurt = Straight.
  - The number on every skill, uma and accel button updates live to show how many tracks match
    your current filters.
  - Skills can be required or excluded (switch the "Clicking a skill will" toggle), so you can drop
    tracks that depend on a skill you can't get.
  - Active filters show as removable chips under the header. "Hide tracks marked as taken" drops
    taken tracks from results and counts.
  - **Saved presets** — name a filter set and reload it later (stored in your browser).
  - A floating panel stays on screen with the live result count, **Copy plan** (filters + matching
    tracks, formatted for Discord), **Copy share link**, **Add all to picks** and **My picks**.
  - Filters are saved in your browser and mirrored in the page URL, so the link can be shared.
    Anyone who opens it lands on the same filters.
- **My Picks** — a slide-out panel (nav bar or planner) listing your draft pool, with taken /
  not-taken marking, remove, a summary of what's still available, and **Copy picks** for Discord.
- **Track Database** (`/tracks`) — every course with distance, surface, valid accels (C4 / C3 /
  Straight), threshold, spurt timing, and the skills and umas that matter there. Filter by
  location, surface, type, handedness or accel. Click a track for its detail view, add it to your
  picks, or mark it as taken.

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

## Deployment

The site runs on Cloudflare Workers. `npm run build` outputs to `dist/`, and `worker.js` serves it,
falls back to `index.html` for client-side routes, and sets link-preview meta tags per page. A
shared planner link gets a preview describing its filters and match count (the Worker reuses
`src/utils/filters.js`). Config is in `wrangler.jsonc`.

## Structure

- `src/pages/` — `StrategyPlanner.jsx` and `TrackDatabase.jsx`
- `src/components/` — layout, footer, My Picks panel, track detail modal, track visual, copy
  button, attribution
- `src/data/` — `tracks.js` (track dataset and accel tagging rules), `course_data.json` (course
  geometry)
- `src/utils/` — planner filter model shared with the Worker (`filters.js`), counting helpers
  (`recommend.js`), course geometry, Discord export formatting
- `src/context/` — draft pool and taken-track state (persisted to `localStorage`)

## Links

- Project: https://github.com/Wolfhaize/Uma-Compass
- Discord: https://discord.gg/XD4w2PSAz7

## License

GPL-3.0-or-later — see [LICENSE](./LICENSE).
