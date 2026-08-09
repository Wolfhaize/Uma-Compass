import React from 'react'
import { computeStandings } from '../../utils/tournamentEngine.js'
import StandingsTable from './StandingsTable.jsx'

export default function GroupStageView({ tournament, players, onOpenMatch }) {
  const { groups, matches, settings } = tournament
  return (
    <div className="group-stage-grid">
      {groups.map(grp => {
        const groupPlayers = players.filter(p => grp.playerIds.includes(p.id))
        const groupMatches = matches.filter(m => m.stage === 'group' && m.groupId === grp.id)
        const standings = computeStandings(groupPlayers, matches, settings.pointsValues, { stage: 'group', groupId: grp.id })
        return (
          <section className="board-section" key={grp.id}>
            <h2>{grp.name}</h2>
            <StandingsTable standings={standings} highlightTop={settings.advancePerGroup} />
            <p className="muted small" style={{ marginTop: 10 }}>Top {settings.advancePerGroup} advance to the knockout playoffs.</p>
            <div className="fixture-list">
              {groupMatches.map(m => (
                <button key={m.id} className={'fixture-row' + (m.status === 'completed' ? ' completed' : '')} onClick={() => onOpenMatch(m)}>
                  <span className="fixture-round">R{m.round}</span>
                  <span className="fixture-players">
                    {m.playerIds.map(pid => groupPlayers.find(p => p.id === pid)?.name || players.find(p => p.id === pid)?.name || '???').join(' vs ')}
                  </span>
                  <span className="fixture-status">{m.status === 'completed' ? 'View / edit' : 'Record'}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
