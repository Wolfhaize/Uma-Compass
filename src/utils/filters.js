// filters.js
//
// Strategy Planner filter model, shared by the page and by worker.js (which
// uses it to build link previews for shared filter URLs). Keep this file free
// of React / browser APIs.

import { TRACKS } from '../data/tracks.js'
import {
  DISTANCE_ORDER, ACCEL_FOCUS_LABELS, skillFilterOptions, umaFilterOptions,
  matchesSelection, matchesAccels, trackKeysFor,
} from './recommend.js'

export const ACCEL_OPTIONS = [
  { key: 'final', label: 'Final Corner Accel (C4)', short: 'C4', desc: 'Late Race starts somewhere on the final corner/very close to it.' },
  { key: 'multi', label: 'Multi-Corner Accel (C3)', short: 'C3', desc: 'Late Race starts on the 3rd corner.' },
  { key: 'straight', label: 'Straight Accel', short: 'Straight', desc: 'Late Race starts on a straight/very close to it.' },
]
export const SURFACE_OPTIONS = ['Turf', 'Dirt']
export const SKILL_OPTIONS = skillFilterOptions(TRACKS)
export const UMA_OPTIONS = umaFilterOptions(TRACKS)

const SKILL_KEYS = new Set(SKILL_OPTIONS.map(o => o.key))
const UMA_KEYS = new Set(UMA_OPTIONS.map(o => o.key))

export const EMPTY_FILTERS = {
  distances: [], accels: [], surfaces: [], skillPicks: [], excludeSkills: [], umaPicks: [], matchMode: 'all',
}

export function hasAnyFilter(f) {
  return !!(f.distances.length || f.accels.length || f.surfaces.length ||
    f.skillPicks.length || f.excludeSkills.length || f.umaPicks.length)
}

// Shareable link format: ?d=Sprint&d=Mile&a=final&s=Turf&sk=<skill>&xs=<skill>&u=<uma>&m=any
// Returns null when the query string holds no (valid) filters.
export function filtersFromSearch(search) {
  const q = new URLSearchParams(search)
  const pick = (name, allowed) => [...new Set(q.getAll(name))].filter(v => allowed.has(v))
  const f = {
    distances: pick('d', new Set(DISTANCE_ORDER)),
    accels: pick('a', new Set(ACCEL_OPTIONS.map(o => o.key))),
    surfaces: pick('s', new Set(SURFACE_OPTIONS)),
    skillPicks: pick('sk', SKILL_KEYS),
    excludeSkills: pick('xs', SKILL_KEYS),
    umaPicks: pick('u', UMA_KEYS),
    matchMode: q.get('m') === 'any' ? 'any' : 'all',
  }
  return hasAnyFilter(f) ? f : null
}

export function filtersToSearch({ distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode }) {
  const q = new URLSearchParams()
  distances.forEach(v => q.append('d', v))
  accels.forEach(v => q.append('a', v))
  surfaces.forEach(v => q.append('s', v))
  skillPicks.forEach(v => q.append('sk', v))
  excludeSkills.forEach(v => q.append('xs', v))
  umaPicks.forEach(v => q.append('u', v))
  if (matchMode === 'any' && (skillPicks.length + umaPicks.length > 1)) q.set('m', 'any')
  const str = q.toString()
  return str ? '?' + str : ''
}

export function hasExcludedSkill(track, excludeSkills) {
  if (!excludeSkills.length) return false
  const have = trackKeysFor(track, 'skills')
  return excludeSkills.some(k => have.has(k))
}

// Tracks matching the filters, sorted by distance class then location.
// `hidden(track)` optionally drops tracks (used for "hide taken").
export function filterTracks(f, hidden = null, tracks = TRACKS) {
  return tracks.filter(t => {
    if (f.distances.length && !f.distances.includes(t.type)) return false
    if (!matchesAccels(t, f.accels)) return false
    if (f.surfaces.length && !f.surfaces.includes(t.surface)) return false
    if (hasExcludedSkill(t, f.excludeSkills)) return false
    if (hidden && hidden(t)) return false
    if (!matchesSelection(t, 'skills', f.skillPicks, f.matchMode)) return false
    if (!matchesSelection(t, 'accels', f.umaPicks, f.matchMode)) return false
    return true
  }).sort((a, b) => {
    const ai = DISTANCE_ORDER.indexOf(a.type), bi = DISTANCE_ORDER.indexOf(b.type)
    if (ai !== bi) return ai - bi
    return a.location.localeCompare(b.location)
  })
}

const labelOf = (opts, key) => opts.find(o => o.key === key)?.label || key

// Short labels, e.g. ["Sprint", "Turf", "C4", "Not: Victory Cheer"].
export function filterSummaryParts(f) {
  return [
    ...f.distances,
    ...f.accels.map(a => ACCEL_OPTIONS.find(o => o.key === a)?.short || a),
    ...f.surfaces,
    ...f.skillPicks.map(k => labelOf(SKILL_OPTIONS, k)),
    ...f.excludeSkills.map(k => 'Not: ' + labelOf(SKILL_OPTIONS, k)),
    ...f.umaPicks.map(k => labelOf(UMA_OPTIONS, k)),
  ]
}

// Longer lines for the Discord export.
export function describeFilters(f) {
  const mode = f.matchMode === 'any' ? 'any of' : 'all of'
  const lines = []
  if (f.distances.length) lines.push(`Distance: ${f.distances.join(', ')}`)
  if (f.accels.length) lines.push(`Accel: ${f.accels.map(a => ACCEL_OPTIONS.find(o => o.key === a)?.label || a).join(', ')}`)
  if (f.surfaces.length) lines.push(`Surface: ${f.surfaces.join(', ')}`)
  if (f.skillPicks.length) lines.push(`Skills (${mode}): ${f.skillPicks.map(k => labelOf(SKILL_OPTIONS, k)).join(', ')}`)
  if (f.excludeSkills.length) lines.push(`Excluding skills: ${f.excludeSkills.map(k => labelOf(SKILL_OPTIONS, k)).join(', ')}`)
  if (f.umaPicks.length) lines.push(`Inherit umas (${mode}): ${f.umaPicks.map(k => labelOf(UMA_OPTIONS, k)).join(', ')}`)
  return lines
}

export { ACCEL_FOCUS_LABELS }
