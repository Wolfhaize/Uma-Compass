import React, { useMemo, useState } from 'react'
import Attribution from '../components/Attribution.jsx'
import ALL_SKILLS from '../data/skill_sheet_full.json'

const TABS = [
  { key: 'speed', label: 'Speed' },
  { key: 'accel', label: 'Accel' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'unique', label: 'Unique' },
]

const RARITY_CLASS = {
  Normal: 'rarity-normal',
  Rare: 'rarity-rare',
  Unique: 'rarity-unique',
  Evolved: 'rarity-evolved',
  Gold: 'rarity-gold',
}

function SkillTable({ data }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.conditionText.toLowerCase().includes(q) ||
      s.effects.some(e => e.label.toLowerCase().includes(q))
    )
  }, [data, query])

  return (
    <>
      <input
        className="text-input"
        type="text"
        placeholder="Search skill name, effect, or condition..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', maxWidth: 420, padding: '8px 10px', margin: '4px 0 6px' }}
      />
      <p className="muted small" style={{ margin: '0 0 14px' }}>{filtered.length} skill{filtered.length !== 1 ? 's' : ''}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Rarity</th>
              <th>Effect</th>
              <th>Duration</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>{s.name}{s.isJPOnly && <span className="muted small"> (JP)</span>}</td>
                <td><span className={'chip rarity-chip ' + (RARITY_CLASS[s.rarityLabel] || '')}>{s.rarityLabel}</span></td>
                <td className="small">
                  {s.effects.map((e, i) => (
                    <div key={i}>{e.label} {e.text}</div>
                  ))}
                  {!s.effects.length && <span className="muted">—</span>}
                </td>
                <td className="small">{s.baseDurationSec ? `${s.baseDurationSec}s` : '—'}</td>
                <td className="small">{s.conditionText || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="empty">No skills match that search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function SkillSheet() {
  const [tab, setTab] = useState('speed')

  const byCategory = useMemo(() => {
    const groups = { speed: [], accel: [], stamina: [], unique: [] }
    for (const s of ALL_SKILLS) {
      if (groups[s.category]) groups[s.category].push(s)
    }
    return groups
  }, [])

  return (
    <div className="app">
      <header>
        <h1>Skill Sheet</h1>
        <p className="subtitle">
          Every skill in the game, pulled straight from the raw skill data and split into Speed, Accel,
          Stamina, and character Unique skills. Search each table by name, effect, or trigger condition.
        </p>
      </header>

      <Attribution label="SLS & Friends Draft Cheat Sheet" href="https://docs.google.com/spreadsheets/d/1p1cVBGqiIVG0ytMgox9y7irRJKJjQKDogW3axuGh_sI/edit?gid=0#gid=0" />

      <div className="option-row" style={{ margin: '14px 0' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={'option-btn' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="muted small">({byCategory[t.key].length})</span>
          </button>
        ))}
      </div>

      <section className="board-section">
        <SkillTable data={byCategory[tab]} />
      </section>
    </div>
  )
}
