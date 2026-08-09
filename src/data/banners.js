// Banner Timeline data.
// NOTE: I don't have live access to gametora.com or game8.co from this environment
// (sandbox network is locked to dev package registries only), so the rows below are
// PLACEHOLDER samples showing the intended shape only — not real banner data.
//
// To fill this in for real: paste/upload the banner list (from the game8 archive page
// or the gametora foresight timeline) and it'll get parsed into this same B(...) format,
// the same way tracks.js and events.js were built from your source sheets.

const B = (id, name, featured, rarity, jpDate, enDate, isRerun, notes) => ({
  id, name, featured, rarity, jpDate, enDate, isRerun: !!isRerun, notes,
})

// featured = array of character names pulled up in this banner (SSR/SR focus units)
export const UMA_BANNERS = [
  B('uma-sample-1', '[SAMPLE] Special Week & Silence Suzuka', ['Special Week', 'Silence Suzuka'], 'SSR', '1/1/2026', '2/1/2026', false, 'Placeholder — replace with real data'),
  B('uma-sample-2', '[SAMPLE] Symboli Rudolf Rerun', ['Symboli Rudolf'], 'SSR', '1/15/2026', '2/15/2026', true, 'Placeholder — replace with real data'),
]

// featured = array of support card names pulled up in this banner
export const SUPPORT_BANNERS = [
  B('sup-sample-1', '[SAMPLE] Training Support: Kitasan Black & Friends', ['Kitasan Black', 'Satono Diamond'], 'SSR', '1/8/2026', '2/8/2026', false, 'Placeholder — replace with real data'),
  B('sup-sample-2', '[SAMPLE] Support Rerun: Gold Ship', ['Gold Ship'], 'SR', '1/22/2026', '2/22/2026', true, 'Placeholder — replace with real data'),
]

export const RARITIES = [...new Set([...UMA_BANNERS, ...SUPPORT_BANNERS].map(b => b.rarity))]
