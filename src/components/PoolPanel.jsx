import React, { useMemo, useState, useEffect } from 'react'
import { TRACKS } from '../data/tracks.js'
import { useDraft, trackKey } from '../context/DraftContext.jsx'
import { ACCEL_FOCUS_LABELS, DISTANCE_ORDER, accelTags } from '../utils/recommend.js'
import { formatPicksForDiscord } from '../utils/discordExport.js'
import CopyButton from './CopyButton.jsx'

// Slide-out "My Picks" panel: the draft pool, with taken marking and copy.
export default function PoolPanel() {
  const { picksOpen, setPicksOpen, selectedKeys, toggleTrack, clearSelection, isTrackTaken, toggleTrackTaken } = useDraft()
  const [confirmClear, setConfirmClear] = useState(false)

  const picks = useMemo(() => {
    const byKey = new Map(TRACKS.map(t => [trackKey(t), t]))
    return selectedKeys
      .map(k => byKey.get(k))
      .filter(Boolean)
      .sort((a, b) => {
        const ai = DISTANCE_ORDER.indexOf(a.type), bi = DISTANCE_ORDER.indexOf(b.type)
        if (ai !== bi) return ai - bi
        return a.location.localeCompare(b.location) || Number(a.distance) - Number(b.distance)
      })
  }, [selectedKeys])

  useEffect(() => {
    if (!picksOpen) { setConfirmClear(false); return }
    const onKey = e => { if (e.key === 'Escape') setPicksOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picksOpen, setPicksOpen])

  if (!picksOpen) return null

  const takenCount = picks.filter(isTrackTaken).length
  const byDistance = DISTANCE_ORDER
    .map(d => ({ d, n: picks.filter(t => t.type === d && !isTrackTaken(t)).length }))
    .filter(x => x.n > 0)

  return (
    <>
      <div className="pool-overlay" onClick={() => setPicksOpen(false)} />
      <aside className="pool-panel" role="dialog" aria-label="My picks">
        <header className="pool-header">
          <h2>My Picks ({picks.length})</h2>
          <button className="pool-close" onClick={() => setPicksOpen(false)} aria-label="Close picks">×</button>
        </header>

        {picks.length === 0 ? (
          <p className="muted pool-empty">
            Nothing picked yet. Tick tracks in the planner or Track Database, or use “Add all to picks”.
          </p>
        ) : (
          <>
            <p className="muted small pool-summary">
              {picks.length - takenCount} available · {takenCount} taken
              {byDistance.length > 0 && <> — {byDistance.map(x => `${x.n} ${x.d}`).join(', ')} still available</>}
            </p>
            <ul className="pool-list">
              {picks.map(t => {
                const taken = isTrackTaken(t)
                return (
                  <li key={trackKey(t)} className={'pool-row' + (taken ? ' row-taken' : '')}>
                    <div className="pool-row-main">
                      <strong>{t.location} {t.distance}m</strong>
                      <span className="muted small">
                        {t.type} · {t.surface} · {accelTags(t).map(f => ACCEL_FOCUS_LABELS[f]).join(' / ')}
                      </span>
                    </div>
                    <button
                      className={'taken-toggle-btn' + (taken ? ' active' : '')}
                      onClick={() => toggleTrackTaken(t)}
                    >
                      {taken ? 'Taken' : 'Mark taken'}
                    </button>
                    <button className="pool-remove" onClick={() => toggleTrack(t)} aria-label={`Remove ${t.location} ${t.distance}m from picks`}>×</button>
                  </li>
                )
              })}
            </ul>
            <footer className="pool-footer">
              <CopyButton label="Copy picks" getText={() => formatPicksForDiscord(picks, isTrackTaken)} />
              {confirmClear ? (
                <span className="pool-clear-confirm">
                  Clear all picks?
                  <button className="confirm-yes" onClick={() => { clearSelection(); setConfirmClear(false) }}>Yes</button>
                  <button className="confirm-no" onClick={() => setConfirmClear(false)}>No</button>
                </span>
              ) : (
                <button className="reset" onClick={() => setConfirmClear(true)}>Clear all</button>
              )}
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
