// Aggregation helpers for turning a set of tracks into skill / uma recommendations.

export function aggregateCounts(tracks, field) {
  const counts = new Map()
  for (const t of tracks) {
    for (const item of t[field] || []) {
      counts.set(item, (counts.get(item) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function topSkills(tracks, limit = 12) {
  return aggregateCounts(tracks, 'skills').slice(0, limit)
}

// The "accels" (inherit uma) pick list from the source cheat sheet.
export function curatedUmas(tracks, limit = 12) {
  return aggregateCounts(tracks, 'accels').slice(0, limit)
}

// "Recommended Umas": the inherit umas listed on the tracks, most common first.
export function topUmas(tracks, limit = 16) {
  return curatedUmas(tracks, limit)
}

// A track's accel tags live on the track itself (`focus`, an array - see
// data/tracks.js). A track can be valid for several at once.
export function accelTags(t) {
  return t.focus || []
}

// mode is always "any of the selected accel types" (OR).
export function matchesAccels(t, selected) {
  if (!selected.length) return true
  return accelTags(t).some(tag => selected.includes(tag))
}

export const ACCEL_FOCUS_LABELS = {
  straight: 'Straight',
  final: 'C4 (Final Corner)',
  multi: 'C3 (Multi-Corner)',
}

export const DISTANCE_ORDER = ['Sprint', 'Mile', 'Medium', 'Long']

// ---- Filter helpers for the Strategy Planner -------------------------------
// The source sheet has small spelling variants of the same thing
// ("Let's Pump Some Iron" / "Let's Pump Some Iron!", "Redshift/LP1211-M",
// "OG Kitasan(uma)" ...). Normalising them lets one filter chip match all variants.
export function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\(uma\)/g, '')
    .replace(/[!\s]+/g, ' ')
    .replace(/red\s?shift/g, 'redshift')
    .trim()
}

// Pretty label for a normalised key: first-seen original spelling, minus "(uma)".
function buildOptions(tracks, field) {
  const map = new Map() // key -> { key, label, count }
  for (const t of tracks) {
    const seenInTrack = new Set()
    for (const raw of t[field] || []) {
      const key = normalizeName(raw)
      if (!key || seenInTrack.has(key)) continue
      seenInTrack.add(key)
      const entry = map.get(key) || { key, label: raw.replace(/\(uma\)/i, '').replace(/Redshift/, 'Red Shift').trim(), count: 0 }
      entry.count += 1
      map.set(key, entry)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export const skillFilterOptions = tracks => buildOptions(tracks, 'skills')
export const umaFilterOptions = tracks => buildOptions(tracks, 'accels')

export function trackKeysFor(track, field) {
  return new Set((track[field] || []).map(normalizeName))
}

// mode 'all' = track must have every selected item, 'any' = at least one.
export function matchesSelection(track, field, selectedKeys, mode) {
  if (!selectedKeys.length) return true
  const have = trackKeysFor(track, field)
  return mode === 'any'
    ? selectedKeys.some(k => have.has(k))
    : selectedKeys.every(k => have.has(k))
}

// Count how many of `tracks` carry each filter option (keyed like
// skillFilterOptions / umaFilterOptions). Pass in tracks that have already been
// narrowed by the other active filters so the numbers stay in sync with them.
export function countByOption(tracks, field) {
  const counts = new Map()
  for (const t of tracks) {
    for (const key of trackKeysFor(t, field)) {
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return counts
}
