// courseData.js
//
// Bridges our tracks.js (location/distance/surface/handed rows sourced
// from the draft cheat sheet) with course_data.json (umalator's raw
// per-course geometry: exact corner/straight start+length and slope
// data, keyed by a numeric course id).
//
// course_data.json has no track *names* in it, only a numeric
// `raceTrackId` per physical track. The mapping below was derived by
// cross-matching each raceTrackId's set of (distance, surface, handed)
// combinations against our own tracks.js data — every JRA/NAR track we
// use matched exactly on distance+surface+handedness, so this mapping is
// high-confidence, not a guess.
import COURSE_DATA from '../data/course_data.json'

const RACE_TRACK_ID_TO_LOCATION = {
  10001: 'Sapporo',
  10002: 'Hakodate',
  10003: 'Niigata',
  10004: 'Fukushima',
  10005: 'Nakayama',
  10006: 'Tokyo',
  10007: 'Chukyo',
  10008: 'Kyoto',
  10009: 'Hanshin',
  10010: 'Kokura',
  10101: 'Ooi',
  10103: 'Kawasaki',
  10104: 'Funabashi',
  10105: 'Morioka',
}

const SURFACE_CODE = { Turf: 1, Dirt: 2 }
// umalator "turn" field: 1 = right, 2 = left, 3 = (unused), 4 = straight course
const TURN_CODE = { Right: 1, Left: 2, Straight: 4 }

// Locations that are named variants of a track sharing the same
// raceTrackId (e.g. "Kyoto (Inner)" / "Kyoto (Outer)" both live under
// raceTrackId 10008, distinguished only by the umalator `course` field,
// not by distance+surface+handed alone). We fall back to the base
// track's geometry for these since the difference is cosmetic for our
// diagram purposes.
const LOCATION_ALIASES = {
  'Kyoto (Inner)': 'Kyoto',
  'Kyoto (Outer)': 'Kyoto',
  'Niigata (Inner)': 'Niigata',
  'Niigata (Outer)': 'Niigata',
}

// For "(Inner)" / "(Outer)" rows, umalator's `course` field tells them apart:
// course 2 = Inner, course 3 = Outer (checked against Niigata + Kyoto, where
// corner counts line up with tracks.js).
const VARIANT_COURSE = { Inner: 2, Outer: 3 }

let entriesByTrack = null
function index() {
  if (entriesByTrack) return entriesByTrack
  entriesByTrack = new Map()
  for (const course of Object.values(COURSE_DATA)) {
    const location = RACE_TRACK_ID_TO_LOCATION[course.raceTrackId]
    if (!location) continue
    const key = location
    if (!entriesByTrack.has(key)) entriesByTrack.set(key, [])
    entriesByTrack.get(key).push(course)
  }
  return entriesByTrack
}

// Finds the umalator course-geometry record matching a tracks.js row, by
// location + distance + surface + handedness. Returns null if we don't
// have geometry data for that combination (e.g. tracks not covered by
// course_data.json, or a distance/surface combo not present in it).
export function getCourseGeometry(track) {
  // Tolerate sheet typos like "Kyoto(inner)" -> "Kyoto (Inner)".
  const cleanLocation = String(track.location).replace(/\s*\((inner|outer)\)/i, (_, v) => ` (${v[0].toUpperCase()}${v.slice(1).toLowerCase()})`)
  const location = LOCATION_ALIASES[cleanLocation] || cleanLocation
  const byTrack = index()
  const candidates = byTrack.get(location)
  if (!candidates) return null

  const surfaceCode = SURFACE_CODE[track.surface]
  const distance = Number(track.distance)

  const variant = /\((Inner|Outer)\)/.exec(cleanLocation)?.[1]
  const wantedCourse = variant ? VARIANT_COURSE[variant] : null

  const fits = c =>
    c.distance === distance &&
    c.surface === surfaceCode &&
    (track.handed === 'Straight' ? c.turn === TURN_CODE.Straight : true)

  // Prefer the exact inner/outer course; fall back to any same-distance
  // course if that variant isn't in course_data.json.
  let match =
    (wantedCourse != null && candidates.find(c => fits(c) && c.course === wantedCourse)) ||
    candidates.find(fits)
  if (!match) return null
  return match
}
