import React, { useMemo, useState } from 'react'
import UMA_PROFILES from '../../data/uma_profiles.json'
import { UmaIcon } from './UmaPicker.jsx'
import { placementsFromFinishOrder } from '../../utils/tournamentEngine.js'

const PLACE_LABEL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']

export default function MatchResultModal({ match, players, onSubmit, onClose }) {
  const roster = useMemo(() => match.playerIds.map(pid => players.find(p => p.id === pid)).filter(Boolean), [match, players])
  const allUmas = useMemo(() => roster.flatMap(p => (p.umas.length ? p.umas : [null]).map(cardId => ({
    playerId: p.id,
    playerName: p.name,
    umaId: cardId,
    profile: cardId ? UMA_PROFILES.find(u => u.cardId === cardId) : null,
  }))), [roster])

  const [order, setOrder] = useState(() => {
    if (!match.finishOrder) return []
    // rehydrate from stored finish order, matched back to allUmas entries
    return match.finishOrder
      .map(e => allUmas.find(u => u.umaId === e.umaId && u.playerId === e.playerId))
      .filter(Boolean)
  })

  const usedKeys = new Set(order.map(o => `${o.playerId}:${o.umaId}`))
  const distinctPlayersSoFar = new Set(order.map(o => o.playerId))
  const canSubmit = distinctPlayersSoFar.size === roster.length

  function click(entry) {
    const key = `${entry.playerId}:${entry.umaId}`
    if (usedKeys.has(key)) return
    setOrder(prev => [...prev, entry])
  }
  function undo() { setOrder(prev => prev.slice(0, -1)) }
  function reset() { setOrder([]) }

  const previewPlacements = useMemo(() => {
    if (!canSubmit) return []
    return placementsFromFinishOrder(order.map(o => ({ umaId: o.umaId, playerId: o.playerId })), match.playerIds)
  }, [order, canSubmit, match.playerIds])

  function submit() {
    if (!canSubmit) return
    onSubmit(order.map(o => ({ umaId: o.umaId, playerId: o.playerId })))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        <h2>{match.label || (match.stage === 'group' ? 'Group Race' : match.stage === 'league' ? 'League Race' : 'Race')} — Round {match.round}</h2>
        <p className="muted small">Click each uma in the order it crossed the finish line. You only need to go far enough to identify all {roster.length} players (a player's placement is where their first uma finishes) — but logging the full field keeps a clean record.</p>

        <div className="race-columns">
          {roster.map(p => (
            <div className="race-column" key={p.id}>
              <p className="race-column-name">{p.name}</p>
              {(p.umas.length ? p.umas : [null]).map((cardId, i) => {
                const entry = allUmas.find(u => u.playerId === p.id && u.umaId === cardId && (cardId !== null ? true : true))
                const key = `${p.id}:${cardId}`
                const used = usedKeys.has(key)
                const placeIdx = order.findIndex(o => `${o.playerId}:${o.umaId}` === key)
                const profile = cardId ? UMA_PROFILES.find(u => u.cardId === cardId) : null
                return (
                  <button
                    type="button"
                    key={i}
                    className={'race-uma-btn' + (used ? ' used' : '')}
                    onClick={() => click({ playerId: p.id, playerName: p.name, umaId: cardId, profile })}
                    disabled={used}
                  >
                    <UmaIcon cardId={cardId} name={profile?.name || '?'} size={30} />
                    <span className="race-uma-name">{profile?.name || 'Unassigned ace'}</span>
                    {used && <span className="race-uma-place">{PLACE_LABEL[placeIdx] || `${placeIdx + 1}th`}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="race-order-strip">
          <b>Finish order:</b>
          {order.length === 0 && <span className="muted small">Nothing recorded yet — click umas above, fastest first.</span>}
          {order.map((o, i) => (
            <span className="chip" key={`${o.playerId}:${o.umaId}:${i}`}>{PLACE_LABEL[i] || `${i + 1}th`} · {o.profile?.name || 'Unassigned'} ({o.playerName})</span>
          ))}
        </div>

        {canSubmit && (
          <div className="race-preview">
            <b>Player placement preview:</b>
            <div className="chips" style={{ marginTop: 6, marginBottom: 0 }}>
              {previewPlacements.map(p => {
                const pl = players.find(pp => pp.id === p.playerId)
                return <span className="chip" key={p.playerId}>{PLACE_LABEL[p.place - 1] || `${p.place}th`} — {pl?.name}</span>
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="reset" onClick={reset} disabled={!order.length}>Reset</button>
          <button className="reset" onClick={undo} disabled={!order.length}>Undo last</button>
          <button className="primary-btn" onClick={submit} disabled={!canSubmit}>
            {match.status === 'completed' ? 'Save corrected result' : 'Submit result'}
          </button>
        </div>
      </div>
    </div>
  )
}
