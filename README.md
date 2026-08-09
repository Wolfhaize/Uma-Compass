# Uma Toolbox

A small multi-page site collecting reference tools/cheat sheets in one place.

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

- `src/pages/Home.jsx` — landing page listing all tools
- `src/pages/TrackDatabase.jsx` — searchable/filterable racetrack reference
- `src/pages/ChampionshipTimeline.jsx` — Champions Meeting / League of Heroes schedule, grouped by scenario
- `src/data/tracks.js` — track dataset
- `src/data/events.js` — CM/LoH event dataset
- `src/components/Attribution.jsx` — the "source" credit banner shown at the top of each tool page
- `src/components/Layout.jsx` — shared nav bar

## Adding a new tool

1. Add a data file under `src/data/`.
2. Add a page component under `src/pages/`, including an `<Attribution label="..." href="..." />` at the top.
3. Register the route in `src/App.jsx`.
4. Add a card for it in `src/pages/Home.jsx` and a link in `src/components/Layout.jsx`.

## To do

- Fill in the real source links in each page's `<Attribution href="..." />` — currently placeholders (`#`).
- Track dataset: double check "# Corners" / "# Straights" / "Before/After" columns against the original PDF (the text extractor merged some columns).
- Championship timeline: several late-2026/2027 entries have unconfirmed tracks/details (marked `?` in the source).
