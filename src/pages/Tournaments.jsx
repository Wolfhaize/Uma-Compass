import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTournaments } from '../context/TournamentContext.jsx'
import { FORMATS, POINTS_PRESETS, MIN_PLAYERS } from '../utils/tournamentEngine.js'

const STATUS_LABEL = { setup: 'Setting up', in_progress: 'In progress', completed: 'Completed' }

function CreateWizard({ onClose }) {
  const { createTournament } = useTournaments()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [format, setFormat] = useState('knockout')
  const [playerTarget, setPlayerTarget] = useState(9)
  const [pointsPreset, setPointsPreset] = useState('standard')
  const [advancePerMatch, setAdvancePerMatch] = useState(2)
  const [useLosersFinal, setUseLosersFinal] = useState(true)
  const [groupSize, setGroupSize] = useState(4)
  const [advancePerGroup, setAdvancePerGroup] = useState(2)
  const [roundsPerPlayer, setRoundsPerPlayer] = useState('')

  function submit() {
    const id = createTournament({
      name: name.trim() || 'Untitled Tournament',
      format, playerTarget: Math.max(MIN_PLAYERS, Number(playerTarget) || MIN_PLAYERS),
      pointsPreset, advancePerMatch: Number(advancePerMatch), useLosersFinal,
      groupSize: Number(groupSize), advancePerGroup: Number(advancePerGroup),
      roundsPerPlayer: roundsPerPlayer ? Number(roundsPerPlayer) : null,
    })
    navigate(`/tournaments/${id}`)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        <h2>New Tournament</h2>

        <label className="field-label">Name</label>
        <input className="controls-input" style={{ width: '100%', marginBottom: 16 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Server Cup #3" />

        <label className="field-label">Format</label>
        <div className="format-grid">
          {Object.values(FORMATS).map(f => (
            <button type="button" key={f.id} className={'option-card format-card' + (format === f.id ? ' active' : '')} onClick={() => setFormat(f.id)}>
              <span className="option-card-title">{f.icon} {f.label}</span>
              <span className="option-card-desc">{f.blurb}</span>
            </button>
          ))}
        </div>

        <label className="field-label">Number of players (min {MIN_PLAYERS} — that's {MIN_PLAYERS * 3} umas on track for a race)</label>
        <input type="number" min={MIN_PLAYERS} className="controls-input" style={{ width: 140, marginBottom: 16 }} value={playerTarget} onChange={e => setPlayerTarget(e.target.value)} />

        <label className="field-label">Points per race</label>
        <div className="chips" style={{ marginBottom: 16 }}>
          {Object.entries(POINTS_PRESETS).map(([key, preset]) => (
            <button type="button" key={key} className={'chip chip-select' + (pointsPreset === key ? ' active' : '')} onClick={() => setPointsPreset(key)}>{preset.label}</button>
          ))}
        </div>

        {(format === 'knockout' || format === 'groups_knockout') && (
          <>
            <label className="field-label">Advancers per race</label>
            <div className="chips" style={{ marginBottom: 16 }}>
              <button type="button" className={'chip chip-select' + (advancePerMatch === 1 ? ' active' : '')} onClick={() => setAdvancePerMatch(1)}>Top 1 only (harsher, faster)</button>
              <button type="button" className={'chip chip-select' + (advancePerMatch === 2 ? ' active' : '')} onClick={() => setAdvancePerMatch(2)}>Top 2 (standard)</button>
            </div>
            <label className="field-label">
              <input type="checkbox" checked={useLosersFinal} onChange={e => setUseLosersFinal(e.target.checked)} style={{ marginRight: 8 }} />
              Add a Losers Final before the Grand Final (splits the semifinal round's 6 players into a top-3 Grand Final and a 4th-6th Losers Final)
            </label>
          </>
        )}

        {format === 'groups_knockout' && (
          <>
            <label className="field-label" style={{ marginTop: 12 }}>Target group size</label>
            <input type="number" min={3} max={8} className="controls-input" style={{ width: 140, marginBottom: 16 }} value={groupSize} onChange={e => setGroupSize(e.target.value)} />
            <label className="field-label">Advancers per group</label>
            <input type="number" min={1} max={4} className="controls-input" style={{ width: 140, marginBottom: 16 }} value={advancePerGroup} onChange={e => setAdvancePerGroup(e.target.value)} />
          </>
        )}

        {(format === 'league' || format === 'league_finals') && (
          <>
            <label className="field-label">Rounds (leave blank to auto-suggest based on player count)</label>
            <input type="number" min={1} className="controls-input" style={{ width: 140, marginBottom: 16 }} value={roundsPerPlayer} onChange={e => setRoundsPerPlayer(e.target.value)} placeholder="auto" />
          </>
        )}

        <div className="modal-actions">
          <button className="reset" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={submit}>Create tournament</button>
        </div>
      </div>
    </div>
  )
}

export default function Tournaments() {
  const { tournaments, deleteTournament } = useTournaments()
  const [showWizard, setShowWizard] = useState(false)

  return (
    <div className="app">
      <header className="track-hub-header">
        <div>
          <h1>Tournaments</h1>
          <p className="subtitle">Run Umamusume 3-vs-3-vs-3 server competitions — from signups to standings to the final podium.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowWizard(true)}>+ New Tournament</button>
      </header>

      {!tournaments.length ? (
        <div className="empty-state">
          <p>No tournaments yet. Create one to get started — you'll pick a bracket/points format, set the number of players, then sign everyone up with the umas they're racing.</p>
        </div>
      ) : (
        <div className="tourney-list">
          {tournaments.map(t => (
            <Link to={`/tournaments/${t.id}`} className="tourney-list-card" key={t.id}>
              <div>
                <span className="tourney-list-title">{FORMATS[t.format]?.icon} {t.name}</span>
                <span className={'chip status-chip status-' + t.status}>{STATUS_LABEL[t.status]}</span>
              </div>
              <p className="muted small">{FORMATS[t.format]?.label} · {t.players.length} player{t.players.length !== 1 ? 's' : ''} signed up</p>
              <button
                type="button"
                className="remove-btn"
                style={{ position: 'absolute', top: 12, right: 12 }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (confirm(`Delete "${t.name}"? This can't be undone.`)) deleteTournament(t.id) }}
                title="Delete tournament"
              >×</button>
            </Link>
          ))}
        </div>
      )}

      {showWizard && <CreateWizard onClose={() => setShowWizard(false)} />}
    </div>
  )
}
