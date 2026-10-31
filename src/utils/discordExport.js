// discordExport.js
//
// Plain-text formatters tuned for pasting straight into a Discord message —
// bold via **, code blocks for tables, no markdown Discord doesn't support.

const ACCEL_SHORT = { final: 'C4', multi: 'C3', straight: 'Straight' }

function pad(str, len) {
  str = String(str)
  return str.length >= len ? str : str + ' '.repeat(len - str.length)
}

function accelText(t) {
  return (t.focus || []).map(f => ACCEL_SHORT[f] || f).join('/')
}

// Strategy Planner export: the filters used + the matching tracks (+ share link).
// `filterLines` is an array of plain strings like "Surface: Turf".
export function formatPlanForDiscord(tracks, filterLines = [], shareUrl = '') {
  const lines = [`**Draft Plan — ${tracks.length} track${tracks.length !== 1 ? 's' : ''}**`]
  if (filterLines.length) {
    lines.push('**Filters:**')
    for (const f of filterLines) lines.push(`• ${f}`)
  }
  if (tracks.length) {
    lines.push('```')
    for (const t of tracks) {
      lines.push(`${pad(t.location, 10)} ${pad(t.distance + 'm', 6)} ${pad(t.type, 8)} ${pad(t.surface, 5)} ${accelText(t)}`)
    }
    lines.push('```')
  } else {
    lines.push('_No tracks match these filters._')
  }
  if (shareUrl) lines.push(`Open these filters: <${shareUrl}>`)
  return lines.join('\n')
}

// "My Picks" export. `isTaken(track)` marks tracks someone else already took.
export function formatPicksForDiscord(tracks, isTaken = () => false) {
  const lines = [`**My Picks — ${tracks.length} track${tracks.length !== 1 ? 's' : ''}**`]
  if (!tracks.length) {
    lines.push('_No tracks picked yet._')
    return lines.join('\n')
  }
  lines.push('```')
  for (const t of tracks) {
    const taken = isTaken(t) ? '  [TAKEN]' : ''
    lines.push(`${pad(t.location, 10)} ${pad(t.distance + 'm', 6)} ${pad(t.type, 8)} ${pad(t.surface, 5)} ${accelText(t)}${taken}`)
  }
  lines.push('```')
  return lines.join('\n')
}
