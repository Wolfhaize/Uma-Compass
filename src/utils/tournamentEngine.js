// tournamentEngine.js
//
// Pure functions for generating & scoring Umamusume 3-vs-3-vs-3 tournaments.
// A "match" (race) always seats exactly 3 players, each fielding up to 3
// umas (9 umas on track). Nothing here touches React state - the context
// wraps these with persistence + setState.

export const MIN_PLAYERS = 3 // 3 players x 3 umas = 9 umas, the smallest legal race

export const POINTS_PRESETS = {
  standard: { label: 'Standard (3 / 2 / 1)', values: [3, 2, 1] },
  podium: { label: 'Podium weighted (5 / 3 / 1)', values: [5, 3, 1] },
  grandprix: { label: 'Grand Prix (10 / 6 / 3)', values: [10, 6, 3] },
  winner: { label: 'Win only (1 / 0 / 0)', values: [1, 0, 0] },
}

export const FORMATS = {
  knockout: {
    id: 'knockout',
    label: 'Single Elimination Bracket',
    blurb: 'Straight knockout tree of 3-player races. Top 1 or 2 per race advance until a 3-player Grand Final crowns 1st/2nd/3rd. Good for a quick, high-stakes cup.',
    icon: '🏆',
  },
  groups_knockout: {
    id: 'groups_knockout',
    label: 'Group Stage + Knockout Playoffs',
    blurb: 'Players are split into points-based groups (round-robin races), then the top finishers per group cross over into a knockout bracket. The classic "World Cup" format.',
    icon: '🗂️',
  },
  league: {
    id: 'league',
    label: 'League / Season (Points Only)',
    blurb: 'Everyone races everyone across several rounds. Standings are pure cumulative points, no bracket - whoever tops the table at the end wins. Great for an ongoing server season.',
    icon: '📈',
  },
  league_finals: {
    id: 'league_finals',
    label: 'League + Finals Race',
    blurb: 'A full round-robin regular season to set the standings, then the top 3 on the table face off in one decisive Grand Final race.',
    icon: '🏁',
  },
}

let _idCounter = 1
export function uid(prefix = 'id') {
  _idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}`
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------------------------------------------------------------------------
// Placement resolution: staff record the finishing order of individual umas.
// A player's race placement = the position of the FIRST of their umas to
// cross the line. This automatically implements the "if a player sweeps
// 1st-3rd, the next distinct player is 2nd place" rule, with no special
// casing needed.
// ---------------------------------------------------------------------------
export function placementsFromFinishOrder(finishOrder, playerIds) {
  // finishOrder: [{ umaId, playerId }, ...] in the order umas crossed the line
  const seen = []
  for (const entry of finishOrder) {
    if (!playerIds.includes(entry.playerId)) continue
    if (!seen.includes(entry.playerId)) seen.push(entry.playerId)
    if (seen.length === playerIds.length) break
  }
  // Anyone whose umas never appear in the recorded order (shouldn't normally
  // happen once enough finishers are logged) is pushed to the back so the
  // match still resolves.
  for (const pid of playerIds) if (!seen.includes(pid)) seen.push(pid)
  return seen.map((playerId, idx) => ({ playerId, place: idx + 1 }))
}

export function pointsForPlace(place, pointsValues) {
  return pointsValues[place - 1] ?? 0
}

// ---------------------------------------------------------------------------
// Standings: aggregate every completed match a player appears in.
// ---------------------------------------------------------------------------
export function computeStandings(players, matches, pointsValues, { stage = null, groupId = null } = {}) {
  const rows = new Map()
  for (const p of players) {
    rows.set(p.id, {
      playerId: p.id, name: p.name, points: 0, races: 0,
      firsts: 0, seconds: 0, thirds: 0, active: p.active !== false && !p.disqualified,
    })
  }
  const relevant = matches.filter(m => (
    m.status === 'completed' &&
    (!stage || m.stage === stage) &&
    (!groupId || m.groupId === groupId)
  ))
  for (const m of relevant) {
    for (const res of (m.placements || [])) {
      const row = rows.get(res.playerId)
      if (!row) continue
      row.points += pointsForPlace(res.place, pointsValues)
      row.races += 1
      if (res.place === 1) row.firsts += 1
      else if (res.place === 2) row.seconds += 1
      else if (res.place === 3) row.thirds += 1
    }
  }
  return [...rows.values()].sort((a, b) => (
    b.points - a.points || b.firsts - a.firsts || b.seconds - a.seconds || a.races - b.races || a.name.localeCompare(b.name)
  ))
}

// ---------------------------------------------------------------------------
// Round-robin "everyone plays everyone" style fixture generator for a pool
// of players, grouped into 3-player races per round via a rotating circle.
// Players who don't fit into a full 3 for a given round simply sit that
// round out (only matters for pool sizes not divisible by 3).
// ---------------------------------------------------------------------------
export function buildRoundRobinRounds(playerIds, roundCount) {
  const ids = shuffle(playerIds)
  if (ids.length < 2) return []
  const fixed = ids[0]
  let rest = ids.slice(1)
  const rounds = []
  for (let r = 0; r < roundCount; r++) {
    const circle = [fixed, ...rest]
    const groups = []
    for (let i = 0; i < circle.length; i += 3) {
      const g = circle.slice(i, i + 3)
      if (g.length === 3) groups.push(g)
    }
    if (groups.length) rounds.push(groups)
    rest = rest.length ? [rest[rest.length - 1], ...rest.slice(0, rest.length - 1)] : rest
  }
  return rounds
}

export function suggestRoundCount(playerCount) {
  // Enough rounds that most players see a handful of distinct races.
  return Math.max(3, Math.min(10, Math.ceil(playerCount / 3) * 2))
}

export function splitIntoGroups(playerIds, groupSize) {
  const ids = shuffle(playerIds)
  const groupCount = Math.max(1, Math.round(ids.length / groupSize))
  const groups = Array.from({ length: groupCount }, () => [])
  ids.forEach((id, i) => groups[i % groupCount].push(id))
  return groups
}

// ---------------------------------------------------------------------------
// Knockout bracket: byes go to the best-seeded players when the pool isn't
// divisible by 3. Returns { byes: [playerId...], groups: [[p,p,p], ...] }
// ---------------------------------------------------------------------------
export function assignByesAndGroups(seededPlayerIds) {
  const n = seededPlayerIds.length
  const r = n % 3
  const byes = seededPlayerIds.slice(0, r)
  const playing = seededPlayerIds.slice(r)
  const groups = []
  for (let i = 0; i < playing.length; i += 3) groups.push(playing.slice(i, i + 3))
  return { byes, groups }
}

export function isFinalPoolSize(n) {
  return n === 3
}

// ---------------------------------------------------------------------------
// Knockout progression. Called after every result submitted / edited / after
// a recalculation. Only ever APPENDS rounds that are now ready to be built -
// it never mutates matches that already exist, so completed history (and
// its ids, for editing) is always stable. Callers that need to "undo" future
// rounds (edit of a historical result, or a player being pulled mid-run)
// should strip the not-yet-completed matches for this bracket out of
// `existingMatches` before calling this again.
//
// entrantIds: seed-ordered player ids that feed Round 1 (only consulted if
// no round exists yet for this bracket).
// ---------------------------------------------------------------------------
export function syncKnockout({ entrantIds, existingMatches, settings, stage = 'knockout', makeMatch }) {
  const advancePerMatch = settings.advancePerMatch || 2
  const useLosersFinal = !!settings.useLosersFinal

  const matches = [...existingMatches]
  const bracketMatches = matches.filter(m => ['knockout', 'losers_final', 'final'].includes(m.stage))
  const byRound = {}
  for (const m of bracketMatches) (byRound[m.round] = byRound[m.round] || []).push(m)
  const rounds = Object.keys(byRound).map(Number).sort((a, b) => a - b)

  if (rounds.length === 0) {
    if (entrantIds.length < 3) return { matches, added: false }
    const { byes, groups } = assignByesAndGroups(entrantIds)
    const created = []
    for (const g of groups) created.push(makeMatch({ stage: 'knockout', round: 1, playerIds: g, status: 'pending' }))
    for (const b of byes) created.push(makeMatch({ stage: 'knockout', round: 1, playerIds: [b], status: 'bye', placements: [{ playerId: b, place: 1 }] }))
    return { matches: [...matches, ...created], added: true }
  }

  const lastRound = rounds[rounds.length - 1]
  const lastItems = byRound[lastRound]
  if (lastItems.some(m => m.stage === 'final' || m.stage === 'losers_final')) {
    return { matches, added: false, finished: lastItems.every(m => m.status === 'completed' || m.status === 'bye') }
  }
  const allDone = lastItems.every(m => m.status === 'completed' || m.status === 'bye')
  if (!allDone) return { matches, added: false }

  const realMatches = lastItems.filter(m => m.status !== 'bye')
  const totalRealPlayers = realMatches.reduce((s, m) => s + m.playerIds.length, 0)

  // --- Losers-final trigger: exactly two full 3p races this round, no byes ---
  if (useLosersFinal && realMatches.length === 2 && lastItems.every(m => m.status !== 'bye') && totalRealPlayers === 6) {
    const combined = []
    for (const m of realMatches) {
      for (const res of m.placements) combined.push({ playerId: res.playerId, place: res.place })
    }
    combined.sort((a, b) => a.place - b.place)
    const finalists = combined.slice(0, 3).map(x => x.playerId)
    const consolation = combined.slice(3, 6).map(x => x.playerId)
    const created = [
      makeMatch({ stage: 'final', round: lastRound + 1, playerIds: finalists, status: 'pending', label: 'Grand Final' }),
      makeMatch({ stage: 'losers_final', round: lastRound + 1, playerIds: consolation, status: 'pending', label: 'Losers Final (5th-7th)' }),
    ]
    return { matches: [...matches, ...created], added: true }
  }

  // --- Normal trimming ---
  let pool = []
  for (const m of lastItems) {
    if (m.status === 'bye') { pool.push(m.playerIds[0]); continue }
    const advancing = m.placements.filter(p => p.place <= advancePerMatch).map(p => p.playerId)
    pool.push(...advancing)
  }

  if (pool.length === 3) {
    return { matches: [...matches, makeMatch({ stage: 'final', round: lastRound + 1, playerIds: pool, status: 'pending', label: 'Grand Final' })], added: true }
  }
  if (pool.length === 2) {
    // Pull the best-seeded eliminated player from this round back in so the
    // final can still be a proper 3-way race.
    const eliminated = []
    for (const m of lastItems) {
      if (m.status === 'bye') continue
      for (const res of m.placements) if (res.place > advancePerMatch) eliminated.push(res.playerId)
    }
    const recalled = eliminated[0]
    const finalists = recalled ? [...pool, recalled] : pool
    return {
      matches: [...matches, makeMatch({ stage: 'final', round: lastRound + 1, playerIds: finalists, status: 'pending', label: 'Grand Final', note: recalled ? 'Odd bracket size - best-seeded eliminated player recalled to fill the 3rd Final slot.' : undefined })],
      added: true,
    }
  }
  if (pool.length <= 1) {
    if (pool.length === 1) {
      return { matches: [...matches, makeMatch({ stage: 'final', round: lastRound + 1, playerIds: pool, status: 'completed', placements: [{ playerId: pool[0], place: 1 }], label: 'Champion (walkover)' })], added: true, finished: true }
    }
    return { matches, added: false, finished: true }
  }

  const { byes, groups } = assignByesAndGroups(pool)
  const created = []
  for (const g of groups) created.push(makeMatch({ stage: 'knockout', round: lastRound + 1, playerIds: g, status: 'pending' }))
  for (const b of byes) created.push(makeMatch({ stage: 'knockout', round: lastRound + 1, playerIds: [b], status: 'bye', placements: [{ playerId: b, place: 1 }] }))
  return { matches: [...matches, ...created], added: true }
}
