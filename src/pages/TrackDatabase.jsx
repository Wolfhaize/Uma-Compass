import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRACKS, LOCATIONS, SURFACES, TYPES, HANDEDS } from '../data/tracks.js'
import Attribution from '../components/Attribution.jsx'
import { useDraft } from '../context/DraftContext.jsx'
import TrackDetailModal from '../components/TrackDetailModal.jsx'

const emptyFilter = { location: '', surface: '', type: '', handed: '' }

function Chip({ children }) {
  return <span className="chip">{children}</span>
}

export default function TrackDatabase() {
  const [filter, setFilter] = useState(emptyFilter)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('location')
  const [sortDir, setSortDir] = useState(1)
  const [selected, setSelected] = useState(null)
  const { isSelected, toggleTrack, selectedKeys, clearSelection, isTrackTaken, toggleTrackTaken } = useDraft()

  const filtered = useMemo(() => {
    let rows = TRACKS.filter(t => {
      if (filter.location && t.location !== filter.location) return false
      if (filter.surface && t.surface !== filter.surface) return false
      if (filter.type && t.type !== filter.type) return false
      if (filter.handed && t.handed !== filter.handed) return false
      if (query) {
        const q = query.toLowerCase()
        const hay = [t.location, t.distance, t.type, t.surface, t.handed, t.threshold,
          ...t.skills, ...t.accels].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return -1 * sortDir
      if (av > bv) return 1 * sortDir
      return 0
    })
    return rows
  }, [filter, query, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(1) }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return ''
    return sortDir === 1 ? ' ▲' : ' ▼'
  }

  return (
    <div className="app">
      <header className="track-hub-header">
        <div>
          <h1>Track Database</h1>
          <p className="subtitle">{filtered.length} of {TRACKS.length} tracks shown</p>
        </div>
        {selectedKeys.length > 0 && (
          <div className="draft-pool-row">
            <Link to="/draft-board" className="draft-pool-pill">
              🏇 {selectedKeys.length} in Draft Pool →
            </Link>
            <button
              className="clear-pool-btn"
              onClick={clearSelection}
              title="Clear all selected tracks"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      <div className="attribution-group">
        <Attribution label="SLS & Friends Draft Cheat Sheet" href="https://docs.google.com/spreadsheets/d/1p1cVBGqiIVG0ytMgox9y7irRJKJjQKDogW3axuGh_sI/edit?gid=0#gid=0" />
        <Attribution label="Umalator (course geometry reference)" href="https://kachi-dev.github.io/uma-tools/umalator-global/" />
      </div>

      <div className="controls">
        <input
          className="search"
          type="text"
          placeholder="Search location, distance, skill, accel..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select value={filter.location} onChange={e => setFilter(f => ({ ...f, location: e.target.value }))}>
          <option value="">All Locations</option>
          {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filter.surface} onChange={e => setFilter(f => ({ ...f, surface: e.target.value }))}>
          <option value="">All Surfaces</option>
          {SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.handed} onChange={e => setFilter(f => ({ ...f, handed: e.target.value }))}>
          <option value="">All Handedness</option>
          {HANDEDS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        {(filter.location || filter.surface || filter.type || filter.handed || query) && (
          <button className="reset" onClick={() => { setFilter(emptyFilter); setQuery('') }}>Reset</button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-draft">Draft</th>
              <th onClick={() => toggleSort('location')}>Location{sortIndicator('location')}</th>
              <th onClick={() => toggleSort('distance')}>Distance{sortIndicator('distance')}</th>
              <th onClick={() => toggleSort('type')}>Type{sortIndicator('type')}</th>
              <th onClick={() => toggleSort('surface')}>Surface{sortIndicator('surface')}</th>
              <th onClick={() => toggleSort('handed')}>Handed{sortIndicator('handed')}</th>
              <th onClick={() => toggleSort('threshold')}>Threshold Stat{sortIndicator('threshold')}</th>
              <th onClick={() => toggleSort('lastSpurtStart')}>Last Spurt Start{sortIndicator('lastSpurtStart')}</th>
              <th>Skills / Accels</th>
              <th>Taken</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const taken = isTrackTaken(t)
              return (
              <tr key={i} className={(isSelected(t) ? 'row-selected' : '') + (taken ? ' row-taken' : '')}>
                <td className="col-draft" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected(t)}
                    onChange={() => toggleTrack(t)}
                    aria-label={`Add ${t.location} ${t.distance}m to draft pool`}
                  />
                </td>
                <td onClick={() => setSelected(t)}>{t.location}</td>
                <td onClick={() => setSelected(t)}>{t.distance}</td>
                <td onClick={() => setSelected(t)}>{t.type}</td>
                <td onClick={() => setSelected(t)}>{t.surface}</td>
                <td onClick={() => setSelected(t)}>{t.handed}</td>
                <td onClick={() => setSelected(t)}>{t.threshold}</td>
                <td onClick={() => setSelected(t)}>{t.lastSpurtStart}m ({t.beforeAfter})</td>
                <td className="skills-cell" onClick={() => setSelected(t)}>
                  {t.skills.slice(0, 3).map((s, j) => <Chip key={j}>{s}</Chip>)}
                  {t.skills.length > 3 && <span className="muted">+{t.skills.length - 3} more</span>}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <button
                    className={'taken-toggle-btn' + (taken ? ' active' : '')}
                    onClick={() => toggleTrackTaken(t)}
                  >
                    {taken ? 'Taken ✓' : 'Mark taken'}
                  </button>
                </td>
              </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="empty">No tracks match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <TrackDetailModal
          track={selected}
          onClose={() => setSelected(null)}
          draftControls={
            <>
              <button className={'draft-toggle-btn' + (isSelected(selected) ? ' active' : '')} onClick={() => toggleTrack(selected)}>
                {isSelected(selected) ? '✓ In Draft Pool' : '+ Add to Draft Pool'}
              </button>
              <button
                className={'taken-toggle-btn' + (isTrackTaken(selected) ? ' active' : '')}
                onClick={() => toggleTrackTaken(selected)}
              >
                {isTrackTaken(selected) ? 'Taken ✓ (click to unmark)' : 'Mark as taken'}
              </button>
            </>
          }
        />
      )}
    </div>
  )
}
