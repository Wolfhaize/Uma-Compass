import { TRACKS } from '../data/tracks.js'

// Some event-sheet location names differ slightly from the track-sheet names.
const LOCATION_ALIASES = {
  'oi': 'ooi',
}

function normalizeLocation(loc) {
  if (!loc) return ''
  const base = loc.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim()
  return LOCATION_ALIASES[base] || base
}

// Returns today's date fixed to the app's reference "now".
export function today() {
  return new Date()
}

// event.enDate is a string like "3/26/2026" or null/"~Aug 2026" for TBD entries.
export function parseEnDate(enDate) {
  if (!enDate) return null
  const m = enDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, mo, d, y] = m
  return new Date(Number(y), Number(mo) - 1, Number(d))
}

// Returns 'completed' | 'soon' | 'upcoming' | 'unknown'
export function eventStatus(event) {
  const date = parseEnDate(event.enDate)
  if (!date) return 'unknown'
  const now = today()
  const diffDays = (date - now) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'completed'
  if (diffDays <= 21) return 'soon'
  return 'upcoming'
}

export const STATUS_LABEL = {
  completed: 'Completed',
  soon: 'Coming Soon',
  upcoming: 'Upcoming',
  unknown: 'Date TBD',
}

// Find the matching track-database entry for a CM/LoH event, if we have one.
export function findMatchingTrack(event) {
  if (!event.track || event.track === '---' || event.track === '?') return null
  const loc = normalizeLocation(event.track)
  const candidates = TRACKS.filter(t => normalizeLocation(t.location) === loc)
  if (candidates.length === 0) return null

  // Prefer exact surface + distance match.
  let match = candidates.find(t =>
    t.surface.toLowerCase() === (event.terrain || '').toLowerCase() &&
    String(t.distance) === String(event.distance)
  )
  if (match) return match

  // Fall back to surface match only (closest distance).
  const sameSurface = candidates.filter(t => t.surface.toLowerCase() === (event.terrain || '').toLowerCase())
  if (sameSurface.length > 0 && event.distance) {
    sameSurface.sort((a, b) => Math.abs(a.distance - event.distance) - Math.abs(b.distance - event.distance))
    return sameSurface[0]
  }
  return null
}
