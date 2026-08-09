import React from 'react'

export default function LeagueFixtures({ matches, players, onOpenMatch, stage = 'league' }) {
  const rounds = [...new Set(matches.filter(m => m.stage === stage).map(m => m.round))].sort((a, b) => a - b)
  const nameOf = (pid) => players.find(p => p.id === pid)?.name || '???'
  return (
    <div className="fixture-list">
      {rounds.map(r => (
        <div key={r} className="fixture-round-block">
          <p className="fixture-round-heading">Round {r}</p>
          {matches.filter(m => m.stage === stage && m.round === r).map(m => (
            <button key={m.id} className={'fixture-row' + (m.status === 'completed' ? ' completed' : '')} onClick={() => onOpenMatch(m)}>
              <span className="fixture-players">{m.playerIds.map(nameOf).join(' vs ')}</span>
              <span className="fixture-status">{m.status === 'completed' ? 'View / edit' : 'Record'}</span>
            </button>
          ))}
        </div>
      ))}
      {!rounds.length && <p className="muted small">No races scheduled yet.</p>}
    </div>
  )
}
