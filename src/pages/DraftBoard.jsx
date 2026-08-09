import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { TRACKS } from '../data/tracks.js'
import UMA_PROFILES from '../data/uma_profiles.json'
import SKILL_NAMES from '../data/skillnames.json'
import { useDraft, trackKey } from '../context/DraftContext.jsx'
import { topSkills, topUmas, accelFocus, ACCEL_FOCUS_LABELS } from '../utils/recommend.js'
import { getIconUrl } from '../utils/iconUrl.js'
import TrackDetailModal from '../components/TrackDetailModal.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { formatDraftPoolForDiscord } from '../utils/discordExport.js'

const NOTES_STORAGE_KEY = 'draftCompass.draftNotes.v1'
const NOTES_DEBOUNCE_MS = 500

function Chip({ children, count }) {
  return <span className="chip chip-count">{children}{count > 1 && <b>×{count}</b>}</span>
}

// source: 'both' (curated pick sheet + this uma's own kit actually carries a
// wanted skill), 'kit' (kit match only - not on the curated sheet), or
// 'curated' (on the sheet, but we couldn't verify it against kit data).
const SOURCE_TITLE = {
  both: 'On the pick sheet, and their kit naturally carries a skill this track pool wants',
  kit: 'Not on the pick sheet - but their kit naturally carries a skill this track pool wants',
  curated: 'From the curated pick sheet',
}

function UmaIcon({ cardId, name, size = 40 }) {
  const [failed, setFailed] = useState(false)
  const url = getIconUrl(cardId)
  if (!url || failed) {
    return (
      <div className="uma-icon uma-icon-fallback" style={{ width: size, height: size }}>
        {name?.slice(0, 2) || '?'}
      </div>
    )
  }
  return (
    <img
      className="uma-icon"
      src={url}
      alt={name}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

function loadNotes() {
  try {
    return localStorage.getItem(NOTES_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function DraftNotes() {
  const [notes, setNotes] = useState(loadNotes)
  const [saved, setSaved] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleChange(e) {
    const value = e.target.value
    setNotes(value)
    setSaved(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try { localStorage.setItem(NOTES_STORAGE_KEY, value) } catch { /* ignore */ }
      setSaved(true)
    }, NOTES_DEBOUNCE_MS)
  }

  return (
    <section className="board-section">
      <h2>Draft Notes</h2>
      <p className="muted small">Freeform notes that don't fit a track or uma — opponent reads, reminders, etc.</p>
      <textarea
        className="draft-notes-textarea"
        placeholder="e.g. opponent has 2 sprint umas already, still need a debuffer..."
        value={notes}
        onChange={handleChange}
      />
      <p className="notes-save-indicator">{saved ? (notes ? 'Saved ✓' : '') : 'Saving…'}</p>
    </section>
  )
}

function UmaChip({ uma, owned }) {
  return (
    <span
      className={`chip chip-count chip-uma chip-uma-${uma.source}` + (owned ? ' chip-uma-owned' : '')}
      title={SOURCE_TITLE[uma.source] + (uma.matchedSkills?.length ? ` (${uma.matchedSkills.join(', ')})` : '') + (owned ? ' — already in My Umas' : '')}
    >
      {uma.name}
      {uma.source === 'kit' && <span className="uma-kit-badge"> kit match</span>}
      {owned && <span className="already-have-badge">✓ already have</span>}
      {uma.count > 1 && <b>×{uma.count}</b>}
    </span>
  )
}

export default function DraftBoard() {
  const {
    selectedKeys, toggleTrack, clearSelection, isTrackTaken,
    selectedUmaIds, toggleUma, isUmaTaken, clearUmaSelection,
  } = useDraft()
  const [selectedTrack, setSelectedTrack] = useState(null)

  const tracks = useMemo(
    () => TRACKS.filter(t => selectedKeys.includes(trackKey(t))),
    [selectedKeys]
  )

  // Taken tracks stay in "Tracks in Pool" for reference, but are excluded
  // from the recommendation calculations below.
  const activeTracks = useMemo(
    () => tracks.filter(t => !isTrackTaken(t)),
    [tracks, isTrackTaken]
  )

  const myUmas = useMemo(
    () => UMA_PROFILES.filter(p => selectedUmaIds.includes(p.cardId)),
    [selectedUmaIds]
  )
  const myUmaNames = useMemo(() => new Set(myUmas.map(u => u.name)), [myUmas])

  const skills = useMemo(() => topSkills(activeTracks, 16), [activeTracks])
  const umas = useMemo(() => {
    const all = topUmas(activeTracks, 32, SKILL_NAMES, UMA_PROFILES)
    // Exclude umas already marked taken from the recommendation calculations.
    const byName = new Map(UMA_PROFILES.map(p => [p.name, p]))
    return all.filter(u => {
      const profile = byName.get(u.name)
      return !(profile && isUmaTaken(profile))
    }).slice(0, 16)
  }, [activeTracks, isUmaTaken])

  const distanceBreakdown = useMemo(() => {
    const counts = {}
    for (const t of activeTracks) counts[t.type] = (counts[t.type] || 0) + 1
    return counts
  }, [activeTracks])

  const focusBreakdown = useMemo(() => {
    const counts = {}
    for (const t of activeTracks) {
      const f = accelFocus(t)
      counts[f] = (counts[f] || 0) + 1
    }
    return counts
  }, [activeTracks])

  if (tracks.length === 0 && myUmas.length === 0) {
    return (
      <div className="app">
        <header>
          <h1>Draft Board</h1>
          <p className="subtitle">Your active draft pool — no tracks or umas selected yet.</p>
        </header>
        <div className="empty-state">
          <p>Head to the <Link to="/tracks" className="inline-link">Track Database</Link> and tick the tracks that are likely to come up in this draft, or save some umas from the <Link to="/uma-kits" className="inline-link">Uma Kit Library</Link> (or use the <Link to="/strategy" className="inline-link">Strategy Planner</Link> to auto-pick a set).</p>
        </div>
        <DraftNotes />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="track-hub-header">
        <div>
          <h1>Draft Board</h1>
          <p className="subtitle">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} · {myUmas.length} uma{myUmas.length !== 1 ? 's' : ''} in your draft pool
          </p>
        </div>
        <div className="header-btn-row">
          {(tracks.length > 0 || myUmas.length > 0) && (
            <CopyButton label="Copy pool for Discord" getText={() => formatDraftPoolForDiscord(tracks, myUmas)} />
          )}
          {tracks.length > 0 && <button className="reset" onClick={clearSelection}>Clear Tracks</button>}
        </div>
      </header>

      {tracks.length > 0 && (
        <>
          <section className="board-section">
            <h2>Distance Spread</h2>
            <div className="chips">
              {Object.entries(distanceBreakdown).map(([type, count]) => (
                <span className="chip" key={type}>{type}: {count}</span>
              ))}
            </div>
          </section>

          <section className="board-section">
            <h2>Accel Focus Spread</h2>
            <div className="chips">
              {Object.entries(focusBreakdown).map(([f, count]) => (
                <span className="chip" key={f}>{ACCEL_FOCUS_LABELS[f]}: {count}</span>
              ))}
            </div>
          </section>

          <div className="board-grid">
            <section className="board-section">
              <h2>Recommended Skills</h2>
              <p className="muted small">Ranked by how often they show up across your selected tracks (taken tracks excluded).</p>
              <div className="chips">
                {skills.map(s => <Chip key={s.name} count={s.count}>{s.name}</Chip>)}
              </div>
            </section>

            <section className="board-section">
              <h2>Recommended Umas / Accels</h2>
              <p className="muted small">
                Ranked by pick-sheet frequency plus kit matches — umas whose own skill kit naturally
                carries a skill this track pool wants (e.g. a track wanting "Angling and Scheming"
                auto-surfaces Seiun Sky, since that's her unique). Hover a chip marked <i>kit match</i> to
                see which skill(s) it's based on. Umas already in your <Link to="/uma-kits" className="inline-link">My Umas</Link> pool
                are marked "already have"; taken tracks/umas are excluded from these rankings.
              </p>
              <div className="chips">
                {umas.length ? umas.map(u => <UmaChip key={u.name} uma={u} owned={myUmaNames.has(u.name)} />) : <span className="muted">No pot uma data listed for this set.</span>}
              </div>
            </section>
          </div>

          <section className="board-section">
            <h2>Tracks in Pool</h2>
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
                  {tracks.map((t, i) => (
                    <tr key={i} className={'row-clickable' + (isTrackTaken(t) ? ' row-taken' : '')}>
                      <td className="col-draft" onClick={e => e.stopPropagation()}>
                        <button className="remove-btn" onClick={() => toggleTrack(t)} title="Remove from pool">×</button>
                      </td>
                      <td onClick={() => setSelectedTrack(t)}>{t.location}</td>
                      <td onClick={() => setSelectedTrack(t)}>{t.distance}m</td>
                      <td onClick={() => setSelectedTrack(t)}>{t.type}</td>
                      <td onClick={() => setSelectedTrack(t)}>{t.surface}</td>
                      <td onClick={() => setSelectedTrack(t)}>{ACCEL_FOCUS_LABELS[accelFocus(t)]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="board-section">
        <div className="track-hub-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>My Umas</h2>
          {myUmas.length > 0 && <button className="reset" onClick={clearUmaSelection}>Clear Umas</button>}
        </div>
        {myUmas.length === 0 ? (
          <p className="muted small">No umas saved yet. Save some from the <Link to="/uma-kits" className="inline-link">Uma Kit Library</Link>.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                  <th>Name</th>
                  <th>Title</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myUmas.map(u => (
                  <tr key={u.cardId} className={isUmaTaken(u) ? 'row-taken' : ''}>
                    <td className="col-draft">
                      <button className="remove-btn" onClick={() => toggleUma(u)} title="Remove from My Umas">×</button>
                    </td>
                    <td><UmaIcon cardId={u.cardId} name={u.name} /></td>
                    <td>{u.name}</td>
                    <td>{u.title}</td>
                    <td>{isUmaTaken(u) && <span className="muted small">taken</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DraftNotes />

      {selectedTrack && (
        <TrackDetailModal
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          draftControls={
            <button
              className={'taken-toggle-btn' + (isTrackTaken(selectedTrack) ? ' active' : '')}
              onClick={() => toggleTrackTaken(selectedTrack)}
            >
              {isTrackTaken(selectedTrack) ? 'Taken ✓ (click to unmark)' : 'Mark as taken'}
            </button>
          }
        />
      )}
    </div>
  )
}
