import React, { useMemo, useState } from 'react'
import { TRACKS } from '../data/tracks.js'
import { useDraft, trackKey } from '../context/DraftContext.jsx'
import { topSkills, topUmas, accelFocus, ACCEL_FOCUS_LABELS, DISTANCE_ORDER, skillFilterOptions, umaFilterOptions, matchesSelection } from '../utils/recommend.js'
import TrackDetailModal from '../components/TrackDetailModal.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { formatDraftPoolForDiscord } from '../utils/discordExport.js'

const ACCEL_OPTIONS = [
  { key: 'final', label: 'Final Corner Accel (C4)', desc: 'Late Race starts somewhere on the final corner/very close to it.' },
  { key: 'multi', label: 'Multi-Corner Accel (C3)', desc: 'Late Race starts on the 3rd corner.' },
  { key: 'straight', label: 'Straight Accel', desc: 'Late Race starts on a straight/very close to it.' },
]

const SKILL_OPTIONS = skillFilterOptions(TRACKS)
const UMA_OPTIONS = umaFilterOptions(TRACKS)

const FILTERS_STORAGE_KEY = 'draftCompass.strategyFilters.v1'

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!raw) return { distances: [], accels: [], surfaces: [], skillPicks: [], umaPicks: [], matchMode: 'all' }
    const parsed = JSON.parse(raw)
    return {
      distances: Array.isArray(parsed.distances) ? parsed.distances : [],
      accels: Array.isArray(parsed.accels) ? parsed.accels : [],
      surfaces: Array.isArray(parsed.surfaces) ? parsed.surfaces : [],
      skillPicks: Array.isArray(parsed.skillPicks) ? parsed.skillPicks : [],
      umaPicks: Array.isArray(parsed.umaPicks) ? parsed.umaPicks : [],
      matchMode: parsed.matchMode === 'any' ? 'any' : 'all',
    }
  } catch {
    return { distances: [], accels: [], surfaces: [], skillPicks: [], umaPicks: [], matchMode: 'all' }
  }
}

function Chip({ children, count, total }) {
  return (
    <span className="chip chip-count">
      {children}
      {total > 0 && <b>{count}/{total} tracks</b>}
    </span>
  )
}

export default function StrategyPlanner() {
  const initialFilters = useMemo(loadFilters, [])
  const [distances, setDistances] = useState(initialFilters.distances)
  const [accels, setAccels] = useState(initialFilters.accels)
  const [surfaces, setSurfaces] = useState(initialFilters.surfaces)
  const [skillPicks, setSkillPicks] = useState(initialFilters.skillPicks)
  const [umaPicks, setUmaPicks] = useState(initialFilters.umaPicks)
  const [matchMode, setMatchMode] = useState(initialFilters.matchMode)
  const [confirmingAdd, setConfirmingAdd] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const { selectedKeys, toggleTrack, isTrackTaken, toggleTrackTaken } = useDraft()

  React.useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ distances, accels, surfaces, skillPicks, umaPicks, matchMode }))
    } catch { /* ignore */ }
  }, [distances, accels, surfaces, skillPicks, umaPicks, matchMode])

  function toggleDistance(d) {
    setDistances(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleAccel(a) {
    setAccels(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }
  function toggleSurface(s) {
    setSurfaces(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  function toggleSkillPick(k) {
    setSkillPicks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }
  function toggleUmaPick(k) {
    setUmaPicks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }
  function resetFilters() {
    setSkillPicks([])
    setUmaPicks([])
    setDistances([])
    setAccels([])
    setSurfaces([])
  }

  const started = distances.length > 0 || accels.length > 0 || surfaces.length > 0 || skillPicks.length > 0 || umaPicks.length > 0

  const matches = useMemo(() => {
    if (!started) return []
    return TRACKS.filter(t => {
      if (distances.length && !distances.includes(t.type)) return false
      if (accels.length && !accels.includes(accelFocus(t))) return false
      if (surfaces.length && !surfaces.includes(t.surface)) return false
      if (!matchesSelection(t, 'skills', skillPicks, matchMode)) return false
      if (!matchesSelection(t, 'accels', umaPicks, matchMode)) return false
      return true
    }).sort((a, b) => {
      const ai = DISTANCE_ORDER.indexOf(a.type), bi = DISTANCE_ORDER.indexOf(b.type)
      if (ai !== bi) return ai - bi
      return a.location.localeCompare(b.location)
    })
  }, [started, distances, accels, surfaces, skillPicks, umaPicks, matchMode])

  const skills = useMemo(() => topSkills(matches, 16), [matches])
  const umas = useMemo(() => topUmas(matches, 16), [matches])


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
      <header className="track-hub-header">
        <div>
          <h1>Strategy Planner</h1>
          <p className="subtitle">Pick a gameplan, get the tracks and umas that fit it. Your filters are saved automatically.</p>
        </div>
        {started && <button className="reset" onClick={resetFilters}>Reset filters</button>}
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

      <section className="board-section">
        <h2>3. Surface</h2>
        <p className="muted small">Narrow down to Turf, Dirt, or both.</p>
        <div className="option-row">
          {['Turf', 'Dirt'].map(s => (
            <button
              key={s}
              className={'option-btn' + (surfaces.includes(s) ? ' active' : '')}
              onClick={() => toggleSurface(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="board-section">
        <h2>4. Accel Skills</h2>
        <p className="muted small">Pick the accel skills you plan to bring (e.g. Bring on the Banquet!). The number is how many tracks list that skill.</p>
        <div className="option-row">
          {SKILL_OPTIONS.map(o => (
            <button
              key={o.key}
              className={'option-btn' + (skillPicks.includes(o.key) ? ' active' : '')}
              onClick={() => toggleSkillPick(o.key)}
            >
              {o.label} <span className="muted small">({o.count})</span>
            </button>
          ))}
        </div>
      </section>

      <section className="board-section">
        <h2>5. Accel Inherit Umas</h2>
        <p className="muted small">Pick the umas you can inherit accels from (e.g. NY Kitasan).</p>
        <div className="option-row">
          {UMA_OPTIONS.map(o => (
            <button
              key={o.key}
              className={'option-btn' + (umaPicks.includes(o.key) ? ' active' : '')}
              onClick={() => toggleUmaPick(o.key)}
            >
              {o.label} <span className="muted small">({o.count})</span>
            </button>
          ))}
        </div>
      </section>

      {(skillPicks.length + umaPicks.length > 1) && (
        <section className="board-section">
          <h2>Skill / Uma Match Mode</h2>
          <p className="muted small">
            {matchMode === 'all'
              ? 'Tracks must work with EVERYTHING you picked in sections 4 and 5 (a combo).'
              : 'Tracks that work with ANY of the skills or umas you picked in sections 4 and 5.'}
          </p>
          <div className="option-row">
            <button className={'option-btn' + (matchMode === 'all' ? ' active' : '')} onClick={() => setMatchMode('all')}>Must have all</button>
            <button className={'option-btn' + (matchMode === 'any' ? ' active' : '')} onClick={() => setMatchMode('any')}>Any of them</button>
          </div>
        </section>
      )}

      {!started && (
        <div className="empty-state">
          <p>Choose at least one filter above to see matching tracks and recommended picks.</p>
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
                {skills.length ? skills.map(s => <Chip key={s.name} count={s.count} total={matches.length}>{s.name}</Chip>) : <span className="muted">No matches yet.</span>}
              </div>
            </section>
            <section className="board-section">
              <h2>Recommended Umas / Accels</h2>
              <div className="chips">
                {umas.length ? umas.map(u => <Chip key={u.name} count={Math.min(u.count, matches.length)} total={matches.length}>{u.name}</Chip>) : <span className="muted">No pot uma data for this combination.</span>}
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
              {selectedKeys.length} track{selectedKeys.length !== 1 ? 's' : ''} in your draft pool
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
