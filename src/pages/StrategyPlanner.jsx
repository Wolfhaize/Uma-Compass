import React, { useMemo, useState } from 'react'
import { TRACKS } from '../data/tracks.js'
import { useDraft, trackKey } from '../context/DraftContext.jsx'
import { topSkills, topUmas, accelTags, countByOption, ACCEL_FOCUS_LABELS, DISTANCE_ORDER, matchesSelection } from '../utils/recommend.js'
import {
  ACCEL_OPTIONS, SURFACE_OPTIONS, SKILL_OPTIONS, UMA_OPTIONS, EMPTY_FILTERS,
  filtersFromSearch, filtersToSearch, filterTracks, hasExcludedSkill, describeFilters,
} from '../utils/filters.js'
import TrackDetailModal from '../components/TrackDetailModal.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { formatPlanForDiscord } from '../utils/discordExport.js'

const FILTERS_STORAGE_KEY = 'draftCompass.strategyFilters.v1'

const PRESETS_STORAGE_KEY = 'draftCompass.strategyPresets.v1'
const HIDE_TAKEN_KEY = 'draftCompass.hideTaken.v1'

function loadFilters() {
  // A shared link wins over whatever was saved locally.
  const fromUrl = filtersFromSearch(window.location.search)
  if (fromUrl) return fromUrl
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!raw) return { ...EMPTY_FILTERS }
    const parsed = JSON.parse(raw)
    return {
      distances: Array.isArray(parsed.distances) ? parsed.distances : [],
      accels: Array.isArray(parsed.accels) ? parsed.accels : [],
      surfaces: Array.isArray(parsed.surfaces) ? parsed.surfaces : [],
      skillPicks: Array.isArray(parsed.skillPicks) ? parsed.skillPicks : [],
      excludeSkills: Array.isArray(parsed.excludeSkills) ? parsed.excludeSkills : [],
      umaPicks: Array.isArray(parsed.umaPicks) ? parsed.umaPicks : [],
      matchMode: parsed.matchMode === 'any' ? 'any' : 'all',
    }
  } catch {
    return { ...EMPTY_FILTERS }
  }
}

function loadPresets() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(p => p && p.name && p.filters) : []
  } catch {
    return []
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
  const [excludeSkills, setExcludeSkills] = useState(initialFilters.excludeSkills || [])
  const [skillMode, setSkillMode] = useState('require') // what clicking a skill button does
  const [umaPicks, setUmaPicks] = useState(initialFilters.umaPicks)
  const [presets, setPresets] = useState(loadPresets)
  const [presetName, setPresetName] = useState('')
  const [matchMode, setMatchMode] = useState(initialFilters.matchMode)
  const [confirmingAdd, setConfirmingAdd] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const { selectedKeys, toggleTrack, isTrackTaken, toggleTrackTaken, setPicksOpen, takenTrackKeys } = useDraft()
  const [hideTaken, setHideTaken] = useState(() => {
    try { return localStorage.getItem(HIDE_TAKEN_KEY) === '1' } catch { return false }
  })
  const takenSet = useMemo(() => new Set(takenTrackKeys), [takenTrackKeys])
  const isHidden = t => hideTaken && takenSet.has(trackKey(t))
  function toggleHideTaken(v) {
    setHideTaken(v)
    try { localStorage.setItem(HIDE_TAKEN_KEY, v ? '1' : '0') } catch { /* ignore */ }
  }

  React.useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode }))
    } catch { /* ignore */ }
    // Keep the address bar equal to the shareable link for the current filters.
    try {
      const search = filtersToSearch({ distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode })
      window.history.replaceState(window.history.state, '', window.location.pathname + search + window.location.hash)
    } catch { /* ignore */ }
  }, [distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode])

  function getShareUrl() {
    return window.location.origin + window.location.pathname +
      filtersToSearch({ distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode })
  }

  const currentFilters = { distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode }

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
    if (skillMode === 'exclude') {
      setSkillPicks(prev => prev.filter(x => x !== k))
      setExcludeSkills(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
    } else {
      setExcludeSkills(prev => prev.filter(x => x !== k))
      setSkillPicks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
    }
  }
  function toggleUmaPick(k) {
    setUmaPicks(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  }
  function resetFilters() {
    setSkillPicks([])
    setExcludeSkills([])
    setUmaPicks([])
    setDistances([])
    setAccels([])
    setSurfaces([])
  }

  const started = distances.length > 0 || accels.length > 0 || surfaces.length > 0 || skillPicks.length > 0 || excludeSkills.length > 0 || umaPicks.length > 0

  const hasExcluded = t => hasExcludedSkill(t, excludeSkills)

  const matches = useMemo(() => {
    if (!started) return []
    return filterTracks(currentFilters, hideTaken ? isHidden : null)
  }, [started, distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode, hideTaken, takenSet])

  // Live counts for the skill / uma buttons: how many tracks you'd get with that
  // option, given the distance / accel / surface filters and the other picks.
  const baseTracks = useMemo(() => TRACKS.filter(t => {
    if (distances.length && !distances.includes(t.type)) return false
    if (accels.length && !accelTags(t).some(f => accels.includes(f))) return false
    if (surfaces.length && !surfaces.includes(t.surface)) return false
    if (hasExcluded(t)) return false
    if (isHidden(t)) return false
    return true
  }), [distances, accels, surfaces, excludeSkills, hideTaken, takenSet])

  const skillCounts = useMemo(() => countByOption(baseTracks.filter(t =>
    matchesSelection(t, 'accels', umaPicks, matchMode) &&
    (matchMode === 'all' ? matchesSelection(t, 'skills', skillPicks, 'all') : true)
  ), 'skills'), [baseTracks, skillPicks, umaPicks, matchMode])

  const umaCounts = useMemo(() => countByOption(baseTracks.filter(t =>
    matchesSelection(t, 'skills', skillPicks, matchMode) &&
    (matchMode === 'all' ? matchesSelection(t, 'accels', umaPicks, 'all') : true)
  ), 'accels'), [baseTracks, skillPicks, umaPicks, matchMode])

  // Live counts for the accel cards: tracks that pass every OTHER filter.
  const accelCounts = useMemo(() => {
    const pool = TRACKS.filter(t => {
      if (distances.length && !distances.includes(t.type)) return false
      if (surfaces.length && !surfaces.includes(t.surface)) return false
      if (hasExcluded(t)) return false
      if (isHidden(t)) return false
      return matchesSelection(t, 'skills', skillPicks, matchMode) && matchesSelection(t, 'accels', umaPicks, matchMode)
    })
    const counts = {}
    for (const t of pool) for (const f of accelTags(t)) counts[f] = (counts[f] || 0) + 1
    return counts
  }, [distances, surfaces, excludeSkills, skillPicks, umaPicks, matchMode, hideTaken, takenSet])

  function savePreset() {
    const name = presetName.trim().slice(0, 40)
    if (!name || !started) return
    const next = [
      ...presets.filter(p => p.name.toLowerCase() !== name.toLowerCase()),
      { id: Date.now(), name, filters: { distances, accels, surfaces, skillPicks, excludeSkills, umaPicks, matchMode } },
    ]
    setPresets(next)
    setPresetName('')
    try { localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  function loadPreset(preset) {
    const f = { ...EMPTY_FILTERS, ...preset.filters }
    setDistances(f.distances); setAccels(f.accels); setSurfaces(f.surfaces)
    setSkillPicks(f.skillPicks); setExcludeSkills(f.excludeSkills || []); setUmaPicks(f.umaPicks)
    setMatchMode(f.matchMode === 'any' ? 'any' : 'all')
    setConfirmingAdd(false)
  }

  function deletePreset(id) {
    const next = presets.filter(p => p.id !== id)
    setPresets(next)
    try { localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  // Removable chips for every active filter.
  const activeChips = [
    ...distances.map(v => ({ id: 'd' + v, label: v, remove: () => setDistances(p => p.filter(x => x !== v)) })),
    ...accels.map(v => ({ id: 'a' + v, label: ACCEL_OPTIONS.find(o => o.key === v)?.label || v, remove: () => setAccels(p => p.filter(x => x !== v)) })),
    ...surfaces.map(v => ({ id: 's' + v, label: v, remove: () => setSurfaces(p => p.filter(x => x !== v)) })),
    ...skillPicks.map(v => ({ id: 'sk' + v, label: SKILL_OPTIONS.find(o => o.key === v)?.label || v, remove: () => setSkillPicks(p => p.filter(x => x !== v)) })),
    ...excludeSkills.map(v => ({ id: 'xs' + v, label: 'Not: ' + (SKILL_OPTIONS.find(o => o.key === v)?.label || v), exclude: true, remove: () => setExcludeSkills(p => p.filter(x => x !== v)) })),
    ...umaPicks.map(v => ({ id: 'u' + v, label: UMA_OPTIONS.find(o => o.key === v)?.label || v, remove: () => setUmaPicks(p => p.filter(x => x !== v)) })),
  ]

  function scrollToResults() {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    setPicksOpen(true)
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

      {activeChips.length > 0 && (
        <div className="active-filters" aria-label="Active filters">
          {activeChips.map(c => (
            <button
              key={c.id}
              className={'filter-chip' + (c.exclude ? ' exclude' : '')}
              onClick={c.remove}
              title="Remove this filter"
            >
              {c.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <label className="hide-taken-toggle">
        <input type="checkbox" checked={hideTaken} onChange={e => toggleHideTaken(e.target.checked)} />
        Hide tracks marked as taken{takenTrackKeys.length > 0 ? ` (${takenTrackKeys.length} taken)` : ''}
      </label>

      <section className="board-section presets">
        <h2>Saved Presets</h2>
        {presets.length === 0 && <p className="muted small">Set some filters, name them below, and save them to reuse later.</p>}
        {presets.length > 0 && (
          <div className="option-row">
            {presets.map(p => (
              <span key={p.id} className="preset-item">
                <button className="option-btn" onClick={() => loadPreset(p)} title="Load this preset">{p.name}</button>
                <button className="preset-delete" onClick={() => deletePreset(p.id)} aria-label={`Delete preset ${p.name}`}>×</button>
              </span>
            ))}
          </div>
        )}
        {started && (
          <div className="preset-save">
            <input
              type="text"
              value={presetName}
              maxLength={40}
              placeholder="Name this filter set, e.g. Sprint turf C4"
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') savePreset() }}
            />
            <button className="reset" onClick={savePreset} disabled={!presetName.trim()}>Save preset</button>
          </div>
        )}
      </section>

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
        <p className="muted small">Valid accelerations for the track</p>
        <div className="option-row option-row-wide">
          {ACCEL_OPTIONS.map(o => (
            <button
              key={o.key}
              className={'option-card' + (accels.includes(o.key) ? ' active' : '')}
              onClick={() => toggleAccel(o.key)}
            >
              <span className="option-card-title">{o.label} <span className="muted small">({accelCounts[o.key] || 0})</span></span>
              <span className="option-card-desc">{o.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="board-section">
        <h2>3. Surface</h2>
        <p className="muted small">Narrow down to Turf, Dirt, or both.</p>
        <div className="option-row">
          {SURFACE_OPTIONS.map(s => (
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
        <p className="muted small">Pick the accel skills you plan to bring (e.g. Bring on the Banquet!), or switch to “Exclude it” to drop tracks that list a skill you can't get. The number is how many tracks match your current filters and list that skill.</p>
        <div className="option-row">
          <span className="muted small">Clicking a skill will:</span>
          <button className={'option-btn' + (skillMode === 'require' ? ' active' : '')} onClick={() => setSkillMode('require')}>Require it</button>
          <button className={'option-btn' + (skillMode === 'exclude' ? ' active' : '')} onClick={() => setSkillMode('exclude')}>Exclude it</button>
        </div>
        <div className="option-row">
          {SKILL_OPTIONS.map(o => (
            <button
              key={o.key}
              className={'option-btn' + (skillPicks.includes(o.key) ? ' active' : excludeSkills.includes(o.key) ? ' excluded' : (skillCounts.get(o.key) ? '' : ' option-zero'))}
              onClick={() => toggleSkillPick(o.key)}
            >
              {o.label} <span className="muted small">({excludeSkills.includes(o.key) ? 'excluded' : (skillCounts.get(o.key) || 0)})</span>
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
              className={'option-btn' + (umaPicks.includes(o.key) ? ' active' : (umaCounts.get(o.key) ? '' : ' option-zero'))}
              onClick={() => toggleUmaPick(o.key)}
            >
              {o.label} <span className="muted small">({umaCounts.get(o.key) || 0})</span>
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
          <section className="board-section" id="results">
            <h2 style={{ margin: 0 }}>Matching Tracks ({matches.length})</h2>
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
                    <th>Valid Accels</th>
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
                        <td onClick={() => setSelectedTrack(t)}>{accelTags(t).map(f => ACCEL_FOCUS_LABELS[f]).join(' · ')}</td>
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
                {selectedKeys.includes(trackKey(selectedTrack)) ? 'In Draft Pool' : '+ Add to Draft Pool'}
              </button>
              <button
                className={'taken-toggle-btn' + (isTrackTaken(selectedTrack) ? ' active' : '')}
                onClick={() => toggleTrackTaken(selectedTrack)}
              >
                {isTrackTaken(selectedTrack) ? 'Taken (click to unmark)' : 'Mark as taken'}
              </button>
            </>
          }
        />
      )}

      {started && (
        <>
          <div className="floating-spacer" aria-hidden="true" />
          <div className="floating-cluster">
            {confirmingAdd && (
              <div className="floating-confirm">
                <span>
                  {newTrackCount > 0
                    ? `Add ${newTrackCount} track${newTrackCount !== 1 ? 's' : ''} to your draft pool?`
                    : 'All of these are already in your draft pool.'}
                </span>
                <div className="inline-confirm-actions">
                  {newTrackCount > 0 && (
                    <button className="confirm-yes" onClick={addAllToDraft}>Yes, add</button>
                  )}
                  <button className="confirm-no" onClick={() => setConfirmingAdd(false)}>Cancel</button>
                </div>
              </div>
            )}
            <CopyButton
              className="floating-action"
              label="Copy share link"
              getText={getShareUrl}
            />
            {matches.length > 0 && (
              <>
                <CopyButton
                  className="floating-action"
                  label="Copy plan"
                  getText={() => formatPlanForDiscord(matches, describeFilters(currentFilters), getShareUrl())}
                />
                {!confirmingAdd && (
                  <button className="floating-action" onClick={() => setConfirmingAdd(true)}>
                    + Add all to picks
                  </button>
                )}
              </>
            )}
            <button className="floating-action" onClick={() => setPicksOpen(true)}>
              My picks ({selectedKeys.length})
            </button>
            <button
              className={'floating-results' + (matches.length === 0 ? ' empty' : '')}
              onClick={scrollToResults}
              title="Jump to matching tracks"
            >
              Results <b>{matches.length}</b>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
