import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRACKS } from '../data/tracks.js'
import { useDraft, trackKey } from '../context/DraftContext.jsx'
import { topSkills, topUmas, accelFocus, ACCEL_FOCUS_LABELS, DISTANCE_ORDER } from '../utils/recommend.js'
import TrackDetailModal from '../components/TrackDetailModal.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { formatDraftPoolForDiscord } from '../utils/discordExport.js'

const ACCEL_OPTIONS = [
  { key: 'final', label: 'Final Corner Accel', desc: 'Spurt kicks in right off the last corner, close to home.' },
  { key: 'multi', label: '3rd Corner / Multi-Corner Accel', desc: 'Course has 4+ corners — sustained cornering matters more.' },
  { key: 'straight', label: 'Straight Accel', desc: 'Spurt lands on a long final straight, not tied to a corner.' },
]

function Chip({ children, count }) {
  return <span className="chip chip-count">{children}{count > 1 && <b>×{count}</b>}</span>
}

export default function StrategyPlanner() {
  const [distances, setDistances] = useState([])
  const [accels, setAccels] = useState([])
  const [confirmingAdd, setConfirmingAdd] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const { selectedKeys, toggleTrack, isTrackTaken, toggleTrackTaken } = useDraft()

  function toggleDistance(d) {
    setDistances(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleAccel(a) {
    setAccels(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const matches = useMemo(() => {
    if (distances.length === 0 && accels.length === 0) return []
    return TRACKS.filter(t => {
      if (distances.length && !distances.includes(t.type)) return false
      if (accels.length && !accels.includes(accelFocus(t))) return false
      return true
    }).sort((a, b) => {
      const ai = DISTANCE_ORDER.indexOf(a.type), bi = DISTANCE_ORDER.indexOf(b.type)
      if (ai !== bi) return ai - bi
      return a.location.localeCompare(b.location)
    })
  }, [distances, accels])

  const skills = useMemo(() => topSkills(matches, 16), [matches])
  const umas = useMemo(() => topUmas(matches, 16), [matches])

  const started = distances.length > 0 || accels.length > 0

  const newTrackCount = useMemo(
    () => matches.filter(t => !selectedKeys.includes(trackKey(t))).length,
    [matches, selectedKeys]
  )

  function addAllToDraft() {
    for (const t of matches) {
      if (!selectedKeys.includes(trackKey(t))) toggleTrack(t)
    }
    setConfirmingAdd(false)
  }

  return (
    <div className="app">
      <header>
        <h1>Strategy Planner</h1>
        <p className="subtitle">Pick a gameplan, get the tracks and umas that fit it.</p>
      </header>

      <section className="board-section">
        <h2>1. Distance Focus</h2>
        <p className="muted small">Pick one or more — mix and match if your team isn't committing to one lane.</p>
        <div className="option-row">
          {DISTANCE_ORDER.map(d => (
            <button
              key={d}
              className={'option-btn' + (distances.includes(d) ? ' active' : '')}
              onClick={() => toggleDistance(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="board-section">
        <h2>2. Accel / Spurt Shape</h2>
        <p className="muted small">Where do you want the race to be won?</p>
        <div className="option-row option-row-wide">
          {ACCEL_OPTIONS.map(o => (
            <button
              key={o.key}
              className={'option-card' + (accels.includes(o.key) ? ' active' : '')}
              onClick={() => toggleAccel(o.key)}
            >
              <span className="option-card-title">{o.label}</span>
              <span className="option-card-desc">{o.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {!started && (
        <div className="empty-state">
          <p>Choose at least one distance or accel shape above to see matching tracks and recommended picks.</p>
        </div>
      )}

      {started && (
        <>
          <section className="board-section">
            <div className="track-hub-header" style={{ marginBottom: 0 }}>
              <h2 style={{ margin: 0 }}>Matching Tracks ({matches.length})</h2>
              {matches.length > 0 && (
                <div className="header-btn-row">
                  <CopyButton
                    label="Copy plan for Discord"
                    getText={() => formatDraftPoolForDiscord(matches)}
                  />
                  {!confirmingAdd && (
                    <button className="reset" onClick={() => setConfirmingAdd(true)}>Add All to My Picks</button>
                  )}
                </div>
              )}
            </div>
            {confirmingAdd && (
              <div className="inline-confirm">
                <span>
                  {newTrackCount > 0
                    ? `Add these ${newTrackCount} track${newTrackCount !== 1 ? 's' : ''} to your real draft pool?`
                    : 'All of these tracks are already in your draft pool.'}
                </span>
                <div className="inline-confirm-actions">
                  {newTrackCount > 0 && (
                    <button className="confirm-yes" onClick={addAllToDraft}>Yes, add them</button>
                  )}
                  <button className="confirm-no" onClick={() => setConfirmingAdd(false)}>Cancel</button>
                </div>
              </div>
            )}
          </section>

          <div className="board-grid">
            <section className="board-section">
              <h2>Recommended Skills</h2>
              <div className="chips">
                {skills.length ? skills.map(s => <Chip key={s.name} count={s.count}>{s.name}</Chip>) : <span className="muted">No matches yet.</span>}
              </div>
            </section>
            <section className="board-section">
              <h2>Recommended Umas / Accels</h2>
              <div className="chips">
                {umas.length ? umas.map(u => <Chip key={u.name} count={u.count}>{u.name}</Chip>) : <span className="muted">No pot uma data for this combination.</span>}
              </div>
            </section>
          </div>

          <section className="board-section">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Location</th>
                    <th>Distance</th>
                    <th>Type</th>
                    <th>Surface</th>
                    <th>Accel Focus</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((t, i) => {
                    const inPool = selectedKeys.includes(trackKey(t))
                    return (
                      <tr key={i} className={'row-clickable' + (inPool ? ' row-selected' : '')}>
                        <td className="col-draft" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={inPool}
                            onChange={() => toggleTrack(t)}
                            aria-label={`Add ${t.location} ${t.distance}m to draft pool`}
                          />
                        </td>
                        <td onClick={() => setSelectedTrack(t)}>{t.location}</td>
                        <td onClick={() => setSelectedTrack(t)}>{t.distance}m</td>
                        <td onClick={() => setSelectedTrack(t)}>{t.type}</td>
                        <td onClick={() => setSelectedTrack(t)}>{t.surface}</td>
                        <td onClick={() => setSelectedTrack(t)}>{ACCEL_FOCUS_LABELS[accelFocus(t)]}</td>
                      </tr>
                    )
                  })}
                  {matches.length === 0 && (
                    <tr><td colSpan={6} className="empty">No tracks match that combination.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedKeys.length > 0 && (
            <p className="muted small">
              <Link to="/draft-board" className="inline-link">View your full draft pool ({selectedKeys.length}) →</Link>
            </p>
          )}
        </>
      )}

      {selectedTrack && (
        <TrackDetailModal
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          draftControls={
            <>
              <button
                className={'draft-toggle-btn' + (selectedKeys.includes(trackKey(selectedTrack)) ? ' active' : '')}
                onClick={() => toggleTrack(selectedTrack)}
              >
                {selectedKeys.includes(trackKey(selectedTrack)) ? '✓ In Draft Pool' : '+ Add to Draft Pool'}
              </button>
              <button
                className={'taken-toggle-btn' + (isTrackTaken(selectedTrack) ? ' active' : '')}
                onClick={() => toggleTrackTaken(selectedTrack)}
              >
                {isTrackTaken(selectedTrack) ? 'Taken ✓ (click to unmark)' : 'Mark as taken'}
              </button>
            </>
          }
        />
      )}
    </div>
  )
}
