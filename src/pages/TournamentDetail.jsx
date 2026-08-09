import React, { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTournaments } from '../context/TournamentContext.jsx'
import { FORMATS, MIN_PLAYERS, computeStandings } from '../utils/tournamentEngine.js'
import UMA_PROFILES from '../data/uma_profiles.json'
import UmaPicker from '../components/tournament/UmaPicker.jsx'
import MatchResultModal from '../components/tournament/MatchResultModal.jsx'
import StandingsTable from '../components/tournament/StandingsTable.jsx'
import BracketView from '../components/tournament/BracketView.jsx'
import GroupStageView from '../components/tournament/GroupStageView.jsx'
import LeagueFixtures from '../components/tournament/LeagueFixtures.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { formatStandingsForDiscord, formatPodiumForDiscord } from '../utils/discordExport.js'

const TABS = [
  { id: 'participants', label: 'Participants' },
  { id: 'schedule', label: 'Schedule & Results' },
  { id: 'standings', label: 'Standings' },
  { id: 'settings', label: 'Settings' },
]

function ParticipantsTab({ t, actions }) {
  const [newName, setNewName] = useState('')
  const activePlayers = t.players.filter(p => !p.disqualified)
  const canStart = t.status === 'setup' && activePlayers.length >= MIN_PLAYERS && activePlayers.every(p => p.umas.length > 0)

  function addPlayer() {
    actions.addPlayer(t.id, newName.trim())
    setNewName('')
  }

  return (
    <section className="board-section">
      <div className="track-hub-header" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Signups ({t.players.length})</h2>
      </div>
      <p className="muted small">
        Every player needs their 3 aces selected before the tournament can start — the picker links straight into the same uma
        data used across the rest of the app (search by name, same icons as the <Link to="/uma-kits" className="inline-link">Uma Kit Library</Link>).
      </p>

      {t.status === 'setup' && (
        <div className="controls" style={{ marginBottom: 16 }}>
          <input className="search" placeholder="Player / racer name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlayer()} />
          <button className="primary-btn" onClick={addPlayer}>+ Add player</button>
        </div>
      )}

      <div className="player-list">
        {t.players.map(p => (
          <div className={'player-row' + (p.disqualified ? ' player-row-dq' : '')} key={p.id}>
            <div className="player-row-head">
              {t.status === 'setup' ? (
                <input className="player-name-input" value={p.name} onChange={e => actions.updatePlayerName(t.id, p.id, e.target.value)} />
              ) : (
                <b>{p.name}{p.disqualified && <span className="muted small"> — disqualified</span>}</b>
              )}
              <div className="player-row-actions">
                {t.status === 'setup' && (
                  <button className="remove-btn" title="Remove player" onClick={() => actions.removePlayer(t.id, p.id)}>×</button>
                )}
                {t.status !== 'setup' && (
                  <button className={'taken-toggle-btn' + (p.disqualified ? ' active' : '')} onClick={() => actions.disqualifyPlayer(t.id, p.id, !p.disqualified)}>
                    {p.disqualified ? 'Reinstate' : 'Disqualify / withdraw'}
                  </button>
                )}
              </div>
            </div>
            {t.status === 'setup' ? (
              <UmaPicker umaIds={p.umas} onChange={ids => actions.updatePlayerUmas(t.id, p.id, ids)} />
            ) : (
              <div className="chips" style={{ marginBottom: 0 }}>
                {p.umas.map(id => <span className="chip" key={id}>{UMA_PROFILES.find(u => u.cardId === id)?.name || id}</span>)}
              </div>
            )}
          </div>
        ))}
        {!t.players.length && <p className="muted small">No players yet — add at least {MIN_PLAYERS}.</p>}
      </div>

      {t.status === 'setup' && (
        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 20 }}>
          <button className="primary-btn" disabled={!canStart} onClick={() => actions.startTournament(t.id)}>
            Start tournament ({activePlayers.length} / {t.playerTarget} target)
          </button>
          {!canStart && (
            <p className="muted small" style={{ margin: 0 }}>
              {activePlayers.length < MIN_PLAYERS ? `Need at least ${MIN_PLAYERS} players.` : 'Every player needs at least 1 uma selected (ideally 3).'}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function ScheduleTab({ t, actions, onOpenMatch }) {
  if (t.status === 'setup') return <p className="muted small">Add and confirm players first, then start the tournament to generate the schedule.</p>

  if (t.format === 'knockout') {
    return (
      <section className="board-section">
        <h2>Bracket</h2>
        <BracketView matches={t.matches} players={t.players} onOpenMatch={onOpenMatch} />
      </section>
    )
  }

  if (t.format === 'groups_knockout') {
    const groupsDone = t.matches.filter(m => m.stage === 'group').every(m => m.status === 'completed')
    return (
      <>
        <section className="board-section">
          <div className="track-hub-header" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Group Stage</h2>
            {!t.playoffsStarted && (
              <button className="primary-btn" disabled={!groupsDone} onClick={() => actions.advanceToPlayoffs(t.id)}>
                {groupsDone ? 'Advance top players to Playoffs →' : 'Waiting on group races...'}
              </button>
            )}
          </div>
          <GroupStageView tournament={t} players={t.players} onOpenMatch={onOpenMatch} />
        </section>
        {t.playoffsStarted && (
          <section className="board-section">
            <h2>Knockout Playoffs</h2>
            <BracketView matches={t.matches} players={t.players} onOpenMatch={onOpenMatch} />
          </section>
        )}
      </>
    )
  }

  // league / league_finals
  return (
    <section className="board-section">
      <h2>Season Fixtures</h2>
      <LeagueFixtures matches={t.matches} players={t.players} onOpenMatch={onOpenMatch} stage="league" />
      {t.matches.some(m => m.stage === 'final') && (
        <>
          <h2 style={{ marginTop: 20 }}>Grand Final</h2>
          <BracketView matches={t.matches} players={t.players} onOpenMatch={onOpenMatch} />
        </>
      )}
    </section>
  )
}

function StandingsTab({ t }) {
  if (t.status === 'setup') return <p className="muted small">Standings will appear once the tournament starts.</p>
  const overallStage = t.format === 'groups_knockout' ? null : (t.format === 'league' || t.format === 'league_finals' ? 'league' : null)
  const finalMatch = t.matches.find(m => m.stage === 'final' && m.status === 'completed')
  const losersMatch = t.matches.find(m => m.stage === 'losers_final' && m.status === 'completed')

  return (
    <section className="board-section">
      {finalMatch && (
        <div className="podium">
          <div className="track-hub-header" style={{ marginBottom: 0 }}>
            <h2 style={{ margin: 0 }}>🏆 Final Standings</h2>
            <CopyButton label="Copy podium" getText={() => formatPodiumForDiscord(t.name, finalMatch, losersMatch, t.players)} />
          </div>
          <div className="podium-row">
            {[1, 2, 3].map(place => {
              const res = finalMatch.placements.find(p => p.place === place)
              const player = t.players.find(p => p.id === res?.playerId)
              return (
                <div key={place} className={`podium-slot podium-${place}`}>
                  <span className="podium-medal">{place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}</span>
                  <span className="podium-name">{player?.name || '—'}</span>
                </div>
              )
            })}
          </div>
          {losersMatch && (
            <p className="muted small">4th-6th (Losers Final): {losersMatch.placements.map(p => `${p.place + 3}th ${t.players.find(pp => pp.id === p.playerId)?.name}`).join(', ')}</p>
          )}
        </div>
      )}

      {t.format === 'groups_knockout' ? (
        <>
          <h2 style={{ marginTop: finalMatch ? 24 : 0 }}>Group Standings</h2>
          <div className="group-stage-grid">
            {t.groups.map(grp => {
              const groupPlayers = t.players.filter(p => grp.playerIds.includes(p.id))
              const standings = computeStandings(groupPlayers, t.matches, t.settings.pointsValues, { stage: 'group', groupId: grp.id })
              return (
                <div key={grp.id}>
                  <div className="track-hub-header" style={{ marginBottom: 4 }}>
                    <h3 style={{ color: 'var(--accent)', fontSize: 18, margin: 0 }}>{grp.name}</h3>
                    <CopyButton label="Copy" className="copy-btn-sm" getText={() => formatStandingsForDiscord(standings, `${t.name} — ${grp.name}`)} />
                  </div>
                  <StandingsTable standings={standings} highlightTop={t.settings.advancePerGroup} />
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          {(() => {
            const overallStandings = computeStandings(t.players, t.matches, t.settings.pointsValues, overallStage ? { stage: overallStage } : {})
            return (
              <>
                <div className="track-hub-header" style={{ marginTop: finalMatch ? 24 : 0, marginBottom: 4 }}>
                  <h2 style={{ margin: 0 }}>{overallStage ? 'League Table' : 'Overall'}</h2>
                  <CopyButton label="Copy standings" getText={() => formatStandingsForDiscord(overallStandings, `${t.name} — ${overallStage ? 'League Table' : 'Standings'}`)} />
                </div>
                <StandingsTable standings={overallStandings} highlightTop={t.format === 'league_finals' ? 3 : 0} />
              </>
            )
          })()}
        </>
      )}
    </section>
  )
}

function SettingsTab({ t, actions, navigate }) {
  return (
    <section className="board-section">
      <h2>Format</h2>
      <p>{FORMATS[t.format]?.icon} <b>{FORMATS[t.format]?.label}</b></p>
      <p className="muted small">{FORMATS[t.format]?.blurb}</p>

      <h2 style={{ marginTop: 20 }}>Roster changes</h2>
      <p className="muted small">
        If a player is disqualified or withdraws mid-tournament, use Recalculate to rebuild every not-yet-played race around the
        remaining active roster. Completed results are never touched.
      </p>
      <button className="reset" disabled={t.status !== 'in_progress'} onClick={() => actions.recalculateSchedule(t.id)}>
        Recalculate remaining schedule
      </button>

      <h2 style={{ marginTop: 20 }}>Activity log</h2>
      <ul className="tourney-log">
        {[...(t.log || [])].reverse().map((l, i) => (
          <li key={i}><span className="muted small">{new Date(l.at).toLocaleString()}</span> — {l.text}</li>
        ))}
      </ul>

      <h2 style={{ marginTop: 20, color: '#ff6b6b' }}>Danger zone</h2>
      <button className="remove-btn" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => {
        if (confirm(`Delete "${t.name}"? This can't be undone.`)) { actions.deleteTournament(t.id); navigate('/tournaments') }
      }}>Delete tournament</button>
    </section>
  )
}

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const actions = useTournaments()
  const t = actions.getTournament(id)
  const [tab, setTab] = useState('participants')
  const [activeMatch, setActiveMatch] = useState(null)

  const activePlayers = useMemo(() => t ? t.players.filter(p => !p.disqualified) : [], [t])

  if (!t) {
    return (
      <div className="app">
        <p className="muted">Tournament not found. <Link to="/tournaments" className="inline-link">Back to Tournaments</Link></p>
      </div>
    )
  }

  function submitResult(order) {
    if (activeMatch.status === 'completed') actions.editResult(t.id, activeMatch.id, order)
    else actions.recordResult(t.id, activeMatch.id, order)
    setActiveMatch(null)
  }

  return (
    <div className="app">
      <header className="track-hub-header">
        <div>
          <p className="muted small" style={{ margin: '0 0 4px' }}><Link to="/tournaments" className="inline-link">← Tournaments</Link></p>
          <h1>{t.name}</h1>
          <p className="subtitle">{FORMATS[t.format]?.icon} {FORMATS[t.format]?.label} · {activePlayers.length} active players · {t.status.replace('_', ' ')}</p>
        </div>
      </header>

      <div className="tab-strip">
        {TABS.map(tb => (
          <button key={tb.id} className={'tab-btn' + (tab === tb.id ? ' active' : '')} onClick={() => setTab(tb.id)}>{tb.label}</button>
        ))}
      </div>

      {tab === 'participants' && <ParticipantsTab t={t} actions={actions} />}
      {tab === 'schedule' && <ScheduleTab t={t} actions={actions} onOpenMatch={setActiveMatch} />}
      {tab === 'standings' && <StandingsTab t={t} />}
      {tab === 'settings' && <SettingsTab t={t} actions={actions} navigate={navigate} />}

      {activeMatch && (
        <MatchResultModal match={activeMatch} players={t.players} onSubmit={submitResult} onClose={() => setActiveMatch(null)} />
      )}
    </div>
  )
}
