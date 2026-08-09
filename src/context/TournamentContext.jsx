import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
  uid, shuffle, MIN_PLAYERS, POINTS_PRESETS, FORMATS,
  buildRoundRobinRounds, suggestRoundCount, splitIntoGroups,
  syncKnockout, computeStandings, placementsFromFinishOrder,
} from '../utils/tournamentEngine.js'

const STORAGE_KEY = 'draftCompass.tournaments.v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function persist(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

const TournamentContext = createContext(null)

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState(load)

  const save = useCallback((list) => {
    setTournaments(list)
    persist(list)
  }, [])

  const updateTournament = useCallback((id, updater) => {
    setTournaments(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t
        const patch = typeof updater === 'function' ? updater(t) : updater
        return { ...t, ...patch, updatedAt: Date.now() }
      })
      persist(next)
      return next
    })
  }, [])

  const getTournament = useCallback((id) => tournaments.find(t => t.id === id), [tournaments])

  const createTournament = useCallback((opts) => {
    const id = uid('tourney')
    const t = {
      id,
      name: opts.name || 'New Tournament',
      format: opts.format,
      status: 'setup', // setup -> in_progress -> completed
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        pointsPreset: opts.pointsPreset || 'standard',
        pointsValues: POINTS_PRESETS[opts.pointsPreset || 'standard'].values,
        advancePerMatch: opts.advancePerMatch || 2,
        useLosersFinal: !!opts.useLosersFinal,
        groupSize: opts.groupSize || 4,
        advancePerGroup: opts.advancePerGroup || 2,
        roundsPerPlayer: opts.roundsPerPlayer || null, // resolved once players are known
      },
      playerTarget: opts.playerTarget || MIN_PLAYERS,
      players: [],
      matches: [],
      groups: [], // [{ id, name, playerIds: [] }] for groups_knockout
      playoffsStarted: false,
      log: [{ at: Date.now(), text: `Tournament created (${FORMATS[opts.format]?.label || opts.format}).` }],
    }
    save([t, ...tournaments])
    return id
  }, [tournaments, save])

  const deleteTournament = useCallback((id) => {
    save(tournaments.filter(t => t.id !== id))
  }, [tournaments, save])

  const appendLog = (t, text) => ([...(t.log || []), { at: Date.now(), text }])

  // --- Players -------------------------------------------------------------
  const addPlayer = useCallback((tid, name) => {
    updateTournament(tid, t => {
      const player = { id: uid('player'), name: name || `Player ${t.players.length + 1}`, umas: [], active: true, disqualified: false, seed: t.players.length }
      return { players: [...t.players, player], log: appendLog(t, `Added player "${player.name}".`) }
    })
  }, [updateTournament])

  const updatePlayerName = useCallback((tid, playerId, name) => {
    updateTournament(tid, t => ({
      players: t.players.map(p => p.id === playerId ? { ...p, name } : p),
    }))
  }, [updateTournament])

  const updatePlayerUmas = useCallback((tid, playerId, umaIds) => {
    updateTournament(tid, t => ({
      players: t.players.map(p => p.id === playerId ? { ...p, umas: umaIds.slice(0, 3) } : p),
    }))
  }, [updateTournament])

  const removePlayer = useCallback((tid, playerId) => {
    updateTournament(tid, t => ({
      players: t.players.filter(p => p.id !== playerId),
      log: appendLog(t, `Removed a player from setup.`),
    }))
  }, [updateTournament])

  const disqualifyPlayer = useCallback((tid, playerId, disqualified = true) => {
    updateTournament(tid, t => {
      const player = t.players.find(p => p.id === playerId)
      return {
        players: t.players.map(p => p.id === playerId ? { ...p, disqualified, active: !disqualified } : p),
        log: appendLog(t, `${disqualified ? 'Disqualified' : 'Reinstated'} ${player?.name || 'a player'}.`),
      }
    })
  }, [updateTournament])

  // --- Scheduling ------------------------------------------------------------
  const makeMatch = (t) => (opts) => ({
    id: uid('match'),
    stage: opts.stage,
    round: opts.round,
    groupId: opts.groupId || null,
    label: opts.label || null,
    note: opts.note || null,
    playerIds: opts.playerIds,
    status: opts.status,
    finishOrder: opts.finishOrder || null,
    placements: opts.placements || null,
    createdAt: Date.now(),
    completedAt: opts.status === 'completed' ? Date.now() : null,
  })

  const startTournament = useCallback((tid) => {
    updateTournament(tid, t => {
      const activeIds = t.players.filter(p => p.active !== false && !p.disqualified).map(p => p.id)
      if (activeIds.length < MIN_PLAYERS) return {}
      const mk = makeMatch(t)
      let matches = []
      let groups = []

      if (t.format === 'league' || t.format === 'league_finals') {
        const rounds = t.settings.roundsPerPlayer || suggestRoundCount(activeIds.length)
        const roundGroups = buildRoundRobinRounds(activeIds, rounds)
        roundGroups.forEach((groupsInRound, ri) => {
          groupsInRound.forEach(g => matches.push(mk({ stage: 'league', round: ri + 1, playerIds: g, status: 'pending' })))
        })
      } else if (t.format === 'groups_knockout') {
        const groupLists = splitIntoGroups(activeIds, t.settings.groupSize)
        groups = groupLists.map((ids, i) => ({ id: uid('group'), name: `Group ${String.fromCharCode(65 + i)}`, playerIds: ids }))
        for (const grp of groups) {
          const rounds = Math.max(1, grp.playerIds.length <= 3 ? 1 : Math.min(6, grp.playerIds.length))
          const roundGroups = buildRoundRobinRounds(grp.playerIds, rounds)
          roundGroups.forEach((groupsInRound, ri) => {
            groupsInRound.forEach(g => matches.push(mk({ stage: 'group', groupId: grp.id, round: ri + 1, playerIds: g, status: 'pending' })))
          })
        }
      } else if (t.format === 'knockout') {
        const seeded = shuffle(activeIds)
        const result = syncKnockout({ entrantIds: seeded, existingMatches: [], settings: t.settings, makeMatch: mk })
        matches = result.matches
      }

      return {
        status: 'in_progress',
        matches,
        groups,
        seedOrder: activeIds,
        log: appendLog(t, `Tournament started with ${activeIds.length} players.`),
      }
    })
  }, [updateTournament])

  // Re-run knockout progression (append newly-ready rounds). Safe / idempotent.
  const advanceKnockoutIfReady = (t, entrantIds) => {
    const mk = makeMatch(t)
    const result = syncKnockout({ entrantIds, existingMatches: t.matches, settings: t.settings, makeMatch: mk })
    return result
  }

  const advanceToPlayoffs = useCallback((tid) => {
    updateTournament(tid, t => {
      if (t.format !== 'groups_knockout' || t.playoffsStarted) return {}
      const advanceN = t.settings.advancePerGroup || 2
      let entrants = []
      for (const grp of t.groups) {
        const groupPlayers = t.players.filter(p => grp.playerIds.includes(p.id))
        const standings = computeStandings(groupPlayers, t.matches, t.settings.pointsValues, { stage: 'group', groupId: grp.id })
        entrants.push(...standings.slice(0, advanceN).map(s => s.playerId))
      }
      const mk = makeMatch(t)
      const result = syncKnockout({ entrantIds: entrants, existingMatches: t.matches, settings: t.settings, makeMatch: mk })
      return {
        playoffsStarted: true,
        matches: result.matches,
        playoffEntrants: entrants,
        log: appendLog(t, `Advanced top ${advanceN} per group (${entrants.length} players) to the knockout playoffs.`),
      }
    })
  }, [updateTournament])

  const recordResult = useCallback((tid, matchId, finishOrder) => {
    updateTournament(tid, t => {
      const match = t.matches.find(m => m.id === matchId)
      if (!match) return {}
      const placements = placementsFromFinishOrder(finishOrder, match.playerIds)
      let matches = t.matches.map(m => m.id === matchId
        ? { ...m, status: 'completed', finishOrder, placements, completedAt: Date.now() }
        : m)

      let extra = {}
      if (match.stage === 'knockout' || match.stage === 'final' || match.stage === 'losers_final') {
        const entrants = t.playoffEntrants || t.seedOrder || t.players.map(p => p.id)
        const result = advanceKnockoutIfReady({ ...t, matches }, entrants)
        matches = result.matches
        if (result.finished) extra.status = 'completed'
      } else if (t.format === 'groups_knockout') {
        const allGroupDone = matches.filter(m => m.stage === 'group').every(m => m.status === 'completed')
        if (allGroupDone && !t.playoffsStarted) extra.groupStageComplete = true
      } else if (t.format === 'league' || t.format === 'league_finals') {
        const allLeagueDone = matches.filter(m => m.stage === 'league').every(m => m.status === 'completed')
        if (allLeagueDone) {
          if (t.format === 'league' && t.status !== 'completed') extra.status = 'completed'
          if (t.format === 'league_finals' && !matches.some(m => m.stage === 'final')) {
            const standings = computeStandings(t.players, matches, t.settings.pointsValues, { stage: 'league' })
            const top3 = standings.slice(0, 3).map(s => s.playerId)
            if (top3.length === 3) {
              const mk = makeMatch(t)
              matches = [...matches, mk({ stage: 'final', round: 999, playerIds: top3, status: 'pending', label: 'Grand Final' })]
            }
          }
        }
        if (matches.some(m => m.stage === 'final' && m.status === 'completed')) extra.status = 'completed'
      }

      return { matches, ...extra, log: appendLog(t, `Recorded result for a ${match.stage.replace('_', ' ')} race.`) }
    })
  }, [updateTournament])

  const editResult = useCallback((tid, matchId, finishOrder) => {
    updateTournament(tid, t => {
      const match = t.matches.find(m => m.id === matchId)
      if (!match) return {}
      const placements = placementsFromFinishOrder(finishOrder, match.playerIds)

      // Wipe any not-yet-completed downstream matches for this bracket so
      // they get rebuilt from the corrected result (completed history and
      // other stages are left untouched).
      const isBracket = ['knockout', 'final', 'losers_final'].includes(match.stage)
      let matches = t.matches.map(m => m.id === matchId
        ? { ...m, status: 'completed', finishOrder, placements, completedAt: Date.now() }
        : m)

      if (isBracket) {
        matches = matches.filter(m => !(['knockout', 'final', 'losers_final'].includes(m.stage) && m.round > match.round))
        const entrants = t.playoffEntrants || t.seedOrder || t.players.map(p => p.id)
        const result = advanceKnockoutIfReady({ ...t, matches }, entrants)
        matches = result.matches
      }

      return { matches, status: t.status === 'completed' ? 'in_progress' : t.status, log: appendLog(t, `Edited a previous result and rebuilt the bracket from that point onward.`) }
    })
  }, [updateTournament])

  // Rebuild every not-yet-completed match using the current active roster -
  // used after a mid-tournament disqualification / withdrawal.
  const recalculateSchedule = useCallback((tid) => {
    updateTournament(tid, t => {
      const activeIds = new Set(t.players.filter(p => p.active !== false && !p.disqualified).map(p => p.id))
      let matches = t.matches.filter(m => m.status === 'completed' || m.status === 'bye')
      let extra = {}

      if (t.format === 'league' || t.format === 'league_finals') {
        const remainingPlayerIds = [...activeIds]
        const playedRounds = new Set(matches.filter(m => m.stage === 'league').map(m => m.round))
        const totalRounds = t.settings.roundsPerPlayer || suggestRoundCount(t.players.length)
        const roundsLeft = Math.max(0, totalRounds - playedRounds.size)
        const mk = makeMatch(t)
        const roundGroups = buildRoundRobinRounds(remainingPlayerIds, roundsLeft)
        const startRound = Math.max(0, ...[...playedRounds, 0]) + 1
        roundGroups.forEach((groupsInRound, ri) => {
          groupsInRound.forEach(g => matches.push(mk({ stage: 'league', round: startRound + ri, playerIds: g, status: 'pending' })))
        })
      } else if (t.format === 'groups_knockout' && !t.playoffsStarted) {
        const mk = makeMatch(t)
        for (const grp of t.groups) {
          const groupActive = grp.playerIds.filter(id => activeIds.has(id))
          const alreadyPlayedRounds = new Set(matches.filter(m => m.stage === 'group' && m.groupId === grp.id).map(m => m.round))
          const rounds = Math.max(1, groupActive.length <= 3 ? 1 : Math.min(6, groupActive.length))
          const roundGroups = buildRoundRobinRounds(groupActive, Math.max(0, rounds - alreadyPlayedRounds.size))
          const startRound = Math.max(0, ...[...alreadyPlayedRounds, 0]) + 1
          roundGroups.forEach((groupsInRound, ri) => {
            groupsInRound.forEach(g => matches.push(mk({ stage: 'group', groupId: grp.id, round: startRound + ri, playerIds: g, status: 'pending' })))
          })
        }
      } else {
        // Knockout-style bracket (pure knockout, or playoffs stage of groups_knockout)
        const entrants = (t.playoffEntrants || t.seedOrder || [...activeIds]).filter(id => activeIds.has(id))
        const mk = makeMatch(t)
        const result = syncKnockout({ entrantIds: entrants, existingMatches: matches, settings: t.settings, makeMatch: mk })
        matches = result.matches
      }

      return { matches, ...extra, log: appendLog(t, `Recalculated the remaining schedule after a roster change.`) }
    })
  }, [updateTournament])

  const value = useMemo(() => ({
    tournaments, getTournament, createTournament, deleteTournament, updateTournament,
    addPlayer, updatePlayerName, updatePlayerUmas, removePlayer, disqualifyPlayer,
    startTournament, advanceToPlayoffs, recordResult, editResult, recalculateSchedule,
  }), [tournaments, getTournament, createTournament, deleteTournament, updateTournament,
    addPlayer, updatePlayerName, updatePlayerUmas, removePlayer, disqualifyPlayer,
    startTournament, advanceToPlayoffs, recordResult, editResult, recalculateSchedule])

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}

export function useTournaments() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournaments must be used within a TournamentProvider')
  return ctx
}
