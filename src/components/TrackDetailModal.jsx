import React from 'react'
import TrackVisual from './TrackVisual.jsx'
import CopyButton from './CopyButton.jsx'

function Chip({ children }) {
  return <span className="chip">{children}</span>
}

function trackSummaryText(t) {
  const lines = [
    `**${t.location} — ${t.distance}m (${t.type})**`,
    `Surface: ${t.surface} · Handed: ${t.handed} · Threshold: ${t.threshold}`,
    `Pos. Keep End: ${t.posKeepEnd}m · Late Race: ${t.spurtStart}m · Last Spurt: ${t.lastSpurtStart}m (${t.beforeAfter})`,
    `Corners: ${t.corners} · Straights: ${t.straights}`,
  ]
  if (t.skills?.length) lines.push(`Skills: ${t.skills.join(', ')}`)
  if (t.accels?.length) lines.push(`Recommended: ${t.accels.join(', ')}`)
  return lines.join('\n')
}

export default function TrackDetailModal({ track: t, onClose, draftControls }) {
  if (!t) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{t.location} — {t.distance}m ({t.type})</h2>

        <TrackVisual track={t} />

        <div className="detail-grid">
          <div><b>Surface</b><span>{t.surface}</span></div>
          <div><b>Handed</b><span>{t.handed}</span></div>
          <div><b>Threshold Stat</b><span>{t.threshold}</span></div>
          <div><b>Position Keep End</b><span>{t.posKeepEnd}m</span></div>
          <div><b>Late Race Begins</b><span>{t.spurtStart}m</span></div>
          <div><b>Accel Point</b><span>{t.spurtDetails}</span></div>
          <div><b>Last Spurt Start</b><span>{t.lastSpurtStart}m</span></div>
          <div><b>Straight Before/After Final Corner</b><span>{t.beforeAfter}</span></div>
          <div><b># Corners</b><span>{t.corners}</span></div>
          <div><b># Straights</b><span>{t.straights}</span></div>
        </div>

        <h3>Potential Skills</h3>
        <div className="chips">{t.skills.map((s, i) => <Chip key={i}>{s}</Chip>)}</div>

        <h3>Recommended Accels / Pot Umas</h3>
        <div className="chips">{t.accels.length ? t.accels.map((s, i) => <Chip key={i}>{s}</Chip>) : <span className="muted">None listed</span>}</div>

        <div className="modal-actions-stack">
          {draftControls}
          <CopyButton label="Copy track summary" getText={() => trackSummaryText(t)} />
        </div>
      </div>
    </div>
  )
}
