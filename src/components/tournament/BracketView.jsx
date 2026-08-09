import React from 'react'
import CopyButton from '../CopyButton.jsx'
import { formatMatchResultForDiscord } from '../../utils/discordExport.js'

const STAGE_LABEL = { knockout: 'Round', final: 'Grand Final', losers_final: 'Losers Final' }

function playerName(players, id) {
  return players.find(p => p.id === id)?.name || '???'
}

function MatchCard({ match, players, onOpen, canEdit }) {
  const isBye = match.status === 'bye'
  const placeOf = (pid) => match.placements?.find(pl => pl.playerId === pid)?.place
  return (
    <div className={'bracket-card' + (match.status === 'completed' ? ' completed' : '') + (isBye ? ' bye' : '') + (match.stage === 'final' ? ' final' : '') + (match.stage === 'losers_final' ? ' losers' : '')}>
      <div className="bracket-card-head">
        <span>{match.label || `${STAGE_LABEL[match.stage] || match.stage} ${match.round}`}</span>
        {isBye && <span className="muted small">bye</span>}
      </div>
      {match.note && <p className="bracket-card-note">{match.note}</p>}
      <div className="bracket-card-players">
        {match.playerIds.map(pid => {
          const place = placeOf(pid)
          return (
            <div key={pid} className={'bracket-card-player' + (place === 1 ? ' place-1' : place === 2 ? ' place-2' : place === 3 ? ' place-3' : place ? ' eliminated' : '')}>
              <span>{playerName(players, pid)}</span>
              {place && <b>{place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `#${place}`}</b>}
            </div>
          )
        })}
      </div>
      {!isBye && (
        <div className="bracket-card-actions">
          <button className="bracket-card-action" onClick={() => onOpen(match)} disabled={!canEdit && match.status === 'completed'}>
            {match.status === 'completed' ? 'Edit result' : 'Record result'}
          </button>
          {match.status === 'completed' && (
            <CopyButton label="Discord" className="copy-btn-sm" getText={() => formatMatchResultForDiscord(match, players)} />
          )}
        </div>
      )}
    </div>
  )
}

export default function BracketView({ matches, players, onOpenMatch, canEdit = true }) {
  const bracketMatches = matches.filter(m => ['knockout', 'final', 'losers_final'].includes(m.stage))
  const rounds = [...new Set(bracketMatches.map(m => m.round))].sort((a, b) => a - b)

  if (!bracketMatches.length) return <p className="muted small">No bracket generated yet.</p>

  return (
    <div className="bracket-scroll">
      <div className="bracket-tree">
        {rounds.map(r => {
          const roundMatches = bracketMatches.filter(m => m.round === r)
          const mainMatches = roundMatches.filter(m => m.stage !== 'losers_final')
          const losersMatch = roundMatches.filter(m => m.stage === 'losers_final')
          return (
            <div className="bracket-round" key={r}>
              <div className="bracket-round-label">
                {mainMatches.some(m => m.stage === 'final') ? 'Grand Final' : `Round ${r}`}
              </div>
              <div className="bracket-round-matches">
                {mainMatches.map(m => (
                  <MatchCard key={m.id} match={m} players={players} onOpen={onOpenMatch} canEdit={canEdit} />
                ))}
              </div>
              {losersMatch.map(m => (
                <div key={m.id} className="bracket-losers-slot">
                  <div className="bracket-round-label losers-label">Losers Final</div>
                  <MatchCard match={m} players={players} onOpen={onOpenMatch} canEdit={canEdit} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
