// Aggregation helpers for turning a set of tracks into skill / uma recommendations.

import { findSkillIdsByName, umasWithSkill } from './skillLookup.js'

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

// The manually-curated "accels" pick list from the source cheat sheet only
// (no kit-matching). Kept around for callers that specifically want the
// curated-only view; topUmas() below is the recommended entry point since it
// blends this with kit-derived matches.
export function curatedUmas(tracks, limit = 12) {
  return aggregateCounts(tracks, 'accels').slice(0, limit)
}

// Weight a kit match by how "core" the skill is to that uma - a unique skill
// match is a much stronger signal ("this track wants Angling and Scheming,
// and Seiun Sky's unique literally IS Angling and Scheming") than just
// happening to have picked up the matching gold/white skill.
function kitMatchWeight(skill) {
  if (skill.isUnique) return 1.5
  if (skill.isGold) return 1
  return 0.6
}

// For each track's recommended skill-name list, resolve the names we can
// confidently match to real skill ids (skillnames.json), then look up which
// umas actually carry that skill in their kit (uma_profiles.json, built by
// umaProfiler.js). This turns "this track wants Angling and Scheming" into
// "...so Seiun Sky is a natural fit" automatically, instead of relying
// purely on the hand-curated accels list from the source sheet.
//
// Only exact/near-exact name matches are used (not the looser token-overlap
// fallback in findSkillIdsByName) - track sheets list plenty of short/vague
// tokens ("DDPP") that would otherwise fuzzy-match into noise.
export function deriveKitUmaMatches(tracks, skillNamesById, profiles, limit = 16) {
  if (!skillNamesById || !profiles || !profiles.length) return []

  const scores = new Map() // cardId -> { name, title, cardId, score, matches: Map<skillName, Set<trackIdx>> }

  tracks.forEach((t, trackIdx) => {
    for (const skillName of t.skills || []) {
      const q = skillName.trim()
      if (!q || q.length < 4) continue // skip abbreviations like "DDPP"
      const matches = findSkillIdsByName(q, skillNamesById, 3)
      const exact = matches.filter(m => m.name && m.name.toLowerCase() === q.toLowerCase())
      const resolved = exact.length ? exact : matches.slice(0, 1) // keep it tight - top candidate only
      for (const m of resolved) {
        for (const { profile, skill } of umasWithSkill(m.id, profiles)) {
          const weight = kitMatchWeight(skill)
          const entry = scores.get(profile.cardId) || {
            name: profile.name, title: profile.title, cardId: profile.cardId, score: 0, matches: new Map(),
          }
          entry.score += weight
          const seenTracks = entry.matches.get(m.name) || new Set()
          seenTracks.add(trackIdx)
          entry.matches.set(m.name, seenTracks)
          scores.set(profile.cardId, entry)
        }
      }
    }
  })

  return [...scores.values()]
    .map(e => ({
      name: e.name,
      title: e.title,
      cardId: e.cardId,
      count: [...e.matches.values()].reduce((s, set) => s + set.size, 0),
      score: Math.round(e.score * 100) / 100,
      matchedSkills: [...e.matches.keys()],
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}

// Blended "Recommended Umas" view: merges the hand-curated accels list from
// the source sheet with kit-derived matches (umas whose actual skill kit
// contains the skills this track pool wants). Curated picks that also show
// up as a kit match get flagged so it's clear the recommendation is backed
// by both the sheet and the underlying skill data, not just one or the
// other.
export function topUmas(tracks, limit = 16, skillNamesById = null, profiles = null) {
  const curated = curatedUmas(tracks, Infinity)
  const kitMatches = skillNamesById && profiles ? deriveKitUmaMatches(tracks, skillNamesById, profiles, Infinity) : []
  const kitByName = new Map(kitMatches.map(k => [k.name, k]))

  const merged = new Map()
  for (const c of curated) {
    const kit = kitByName.get(c.name)
    merged.set(c.name, {
      name: c.name,
      count: c.count + (kit ? kit.count : 0),
      curatedCount: c.count,
      kitCount: kit ? kit.count : 0,
      score: kit ? kit.score : 0,
      matchedSkills: kit ? kit.matchedSkills : [],
      source: kit ? 'both' : 'curated',
    })
  }
  for (const k of kitMatches) {
    if (merged.has(k.name)) continue
    merged.set(k.name, {
      name: k.name,
      count: k.count,
      curatedCount: 0,
      kitCount: k.count,
      score: k.score,
      matchedSkills: k.matchedSkills,
      source: 'kit',
    })
  }

  // Rank by total appearances first, then by kit-match strength (a unique
  // skill match outweighs a white/gold one), then alphabetically.
  return [...merged.values()]
    .sort((a, b) => b.count - a.count || b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
}

// Classifies a track's spurt/accel profile into a rough "corner focus" bucket.
// This is a heuristic built from the fields we have (beforeAfter + corner count),
// not a 1:1 read of in-game physics — good enough to steer track/uma picks.
export function accelFocus(t) {
  const corners = Number(t.corners) || 0
  if (t.beforeAfter === 'Before' || (t.skills || []).includes('Straightaway Spurt')) {
    return 'straight'
  }
  if (t.beforeAfter === 'After' && corners <= 2) {
    return 'final'
  }
  if (corners >= 4) {
    return 'multi'
  }
  return 'final'
}

export const ACCEL_FOCUS_LABELS = {
  straight: 'Straight Accel',
  final: 'Final Corner Accel',
  multi: '3rd/Multi-Corner Accel',
}

export const DISTANCE_ORDER = ['Sprint', 'Mile', 'Medium', 'Long']
