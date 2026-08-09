import React, { useMemo, useState } from 'react'
import UMA_PROFILES from '../../data/uma_profiles.json'
import { getIconUrl } from '../../utils/iconUrl.js'

export function UmaIcon({ cardId, name, size = 36 }) {
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
    <img className="uma-icon" src={url} alt={name} style={{ width: size, height: size }} onError={() => setFailed(true)} />
  )
}

export function UmaBadge({ cardId, name }) {
  const profile = useMemo(() => UMA_PROFILES.find(p => p.cardId === cardId), [cardId])
  return (
    <span className="uma-mini-badge" title={profile?.title || ''}>
      <UmaIcon cardId={cardId} name={name || profile?.name} size={22} />
      <span>{name || profile?.name || 'Unknown'}</span>
    </span>
  )
}

// Up to 3-uma picker used when signing a player up. Controlled: umaIds is an
// array of cardId, onChange receives the next array.
export default function UmaPicker({ umaIds, onChange, max = 3 }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedProfiles = useMemo(
    () => umaIds.map(id => UMA_PROFILES.find(p => p.cardId === id)).filter(Boolean),
    [umaIds]
  )

  const results = useMemo(() => {
    if (!open) return []
    const q = query.trim().toLowerCase()
    let list = UMA_PROFILES
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q))
    return list.slice(0, 24)
  }, [query, open])

  function toggle(cardId) {
    if (umaIds.includes(cardId)) {
      onChange(umaIds.filter(id => id !== cardId))
    } else {
      if (umaIds.length >= max) return
      onChange([...umaIds, cardId])
    }
  }

  return (
    <div className="uma-picker">
      <div className="uma-picker-selected">
        {selectedProfiles.map(p => (
          <span className="uma-mini-badge uma-mini-badge-removable" key={p.cardId}>
            <UmaIcon cardId={p.cardId} name={p.name} size={24} />
            <span>{p.name}</span>
            <button type="button" className="uma-mini-remove" onClick={() => toggle(p.cardId)} title="Remove">×</button>
          </span>
        ))}
        {Array.from({ length: Math.max(0, max - selectedProfiles.length) }).map((_, i) => (
          <span className="uma-mini-badge uma-mini-badge-empty" key={`empty-${i}`}>ace slot {selectedProfiles.length + i + 1}</span>
        ))}
        <button type="button" className="uma-picker-toggle" onClick={() => setOpen(o => !o)}>
          {open ? 'Close' : (umaIds.length ? 'Edit team' : 'Select umas')}
        </button>
      </div>
      {open && (
        <div className="uma-picker-panel">
          <input
            className="uma-picker-search"
            placeholder="Search umas by name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <div className="uma-picker-grid">
            {results.map(p => {
              const selected = umaIds.includes(p.cardId)
              const disabled = !selected && umaIds.length >= max
              return (
                <button
                  type="button"
                  key={p.cardId}
                  className={'uma-picker-option' + (selected ? ' active' : '') + (disabled ? ' disabled' : '')}
                  onClick={() => !disabled && toggle(p.cardId)}
                  disabled={disabled}
                >
                  <UmaIcon cardId={p.cardId} name={p.name} size={32} />
                  <span className="uma-picker-option-name">{p.name}</span>
                  {selected && <span className="uma-picker-check">✓</span>}
                </button>
              )
            })}
            {!results.length && <p className="muted small">No umas match "{query}".</p>}
          </div>
        </div>
      )}
    </div>
  )
}
