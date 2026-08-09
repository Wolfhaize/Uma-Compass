// discordExport.js
//
// Plain-text formatters tuned for pasting straight into a Discord message —
// bold via **, code blocks for tables, no markdown Discord doesn't support.

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

function pad(str, len) {
  str = String(str)
  return str.length >= len ? str : str + ' '.repeat(len - str.length)
}

export function formatDraftPoolForDiscord(tracks, umas = []) {
  const lines = [`**🏇 Draft Pool — ${tracks.length} track${tracks.length !== 1 ? 's' : ''}**`]
  if (tracks.length) {
    lines.push('```')
    for (const t of tracks) {
      lines.push(`${pad(t.location, 10)} ${pad(t.distance + 'm', 6)} ${pad(t.type, 8)} ${pad(t.surface, 6)} ${t.handed}`)
    }
    lines.push('```')
  } else {
    lines.push('_No tracks selected._')
  }
  if (umas.length) {
    lines.push('', `**My Umas (${umas.length}):** ${umas.map(u => u.name).join(', ')}`)
  }
  return lines.join('\n')
}

export function formatMatchResultForDiscord(match, players) {
  const name = (pid) => players.find(p => p.id === pid)?.name || '???'
  const label = match.label || `Round ${match.round}`
  const lines = [`**🏁 ${label}**`]
  const placements = [...(match.placements || [])].sort((a, b) => a.place - b.place)
  for (const p of placements) {
    lines.push(`${MEDAL[p.place] || `#${p.place}`} ${name(p.playerId)}`)
  }
  if (match.note) lines.push(`_${match.note}_`)
  return lines.join('\n')
}

export function formatStandingsForDiscord(standings, title = 'Standings') {
  const lines = [`**📊 ${title}**`, '```']
  lines.push(`${pad('#', 3)} ${pad('Player', 16)} ${pad('Pts', 4)} ${pad('Races', 6)} 1st 2nd 3rd`)
  standings.forEach((s, i) => {
    lines.push(`${pad(i + 1, 3)} ${pad(s.name, 16)} ${pad(s.points, 4)} ${pad(s.races, 6)} ${pad(s.firsts, 3)} ${pad(s.seconds, 3)} ${pad(s.thirds, 3)}`)
  })
  lines.push('```')
  return lines.join('\n')
}

export function formatPodiumForDiscord(tournamentName, finalMatch, losersMatch, players) {
  const name = (pid) => players.find(p => p.id === pid)?.name || '???'
  const lines = [`**🏆 ${tournamentName} — Final Standings**`]
  const placements = [...(finalMatch.placements || [])].sort((a, b) => a.place - b.place)
  for (const p of placements) {
    lines.push(`${MEDAL[p.place] || `#${p.place}`} ${name(p.playerId)}`)
  }
  if (losersMatch) {
    const losers = [...(losersMatch.placements || [])].sort((a, b) => a.place - b.place)
    lines.push('', ...losers.map(p => `${p.place + 3}th — ${name(p.playerId)}`))
  }
  return lines.join('\n')
}
