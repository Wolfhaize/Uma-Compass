import React, { useState } from 'react'
import { getCourseGeometry } from '../utils/courseData.js'

// Umalator-style horizontal strip diagram: not a top-down course map, but
// a proportional "timeline" of the race distance with stacked bands for
// elevation, straights/corners, race phases, and a distance ruler. Uses
// real per-course geometry (course_data.json) when we have a match for
// this track; falls back to a lighter schematic built from theory data
// when we don't.

// Phase colors, keyed by phase label. Boundaries use the game's fixed
// phase fractions (1/6, 2/3, 5/6 of distance), verified against each
// track's real spurtStart/lastSpurtStart checkpoints where available.
const PHASE_COLORS = {
  'Opening Leg': '#0a5c46',
  'Middle Leg': '#5c5008',
  'Final Leg': '#5e2044',
  'Last Spurt': '#4a1730',
}

// Build phase segments (in meters) from the game's fixed phase fractions.
// Opening Leg ends at 1/6 of distance, Middle Leg ends at 2/3 (== spurtStart),
// Final Leg ends at 5/6 (== lastSpurtStart). These are fixed engine
// boundaries, not per-track data, and are NOT the same thing as
// posKeepEnd (Position Keep End is an unrelated strategy stat and must
// never be used as the opening-leg/mid-race boundary). spurtStart and
// lastSpurtStart are still read from the track when present since they
// verify against real per-track data, but fall back to the same fixed
// fractions if missing.
function buildPhases(track, distance) {
  const spurtStart = Number(track.spurtStart)
  const lastSpurtStart = Number(track.lastSpurtStart)

  const p0End = distance / 6
  const p1End = Number.isFinite(spurtStart) ? spurtStart : distance * (2 / 3)
  const p2End = Number.isFinite(lastSpurtStart) ? lastSpurtStart : distance * (5 / 6)

  const bounds = [0, p0End, p1End, p2End, distance]
  const labels = ['Opening Leg', 'Middle Leg', 'Final Leg', 'Last Spurt']
  return labels.map((label, i) => ({
    label,
    start: bounds[i],
    end: bounds[i + 1],
    fill: PHASE_COLORS[label],
  })).filter(ph => ph.end > ph.start)
}

function GeometryVisual({ track, geometry }) {
  const { distance, corners, straights, slopes = [] } = geometry
  const [hover, setHover] = useState(null)

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHover(Math.round(frac * distance))
  }

  const segments = [
    ...straights.map(s => ({ ...s, kind: 'straight' })),
    ...corners.map(c => ({ start: c.start, end: c.start + c.length, kind: 'corner' })),
  ].sort((a, b) => a.start - b.start)

  const phases = buildPhases(track, distance)

  // Hill shapes: a stepped elevation profile (uphill rises, downhill
  // dips, staying at the new level until the next slope) so hills read
  // as actual hills, not flat blocks. We're not attempting to make the
  // height proportional to the real grade value anymore — every hill
  // uses the same fixed rise so the shapes stay clean — but the
  // start/end x-position of each hill is exact, matched to its real
  // start/length in meters. Each hill's color is clipped strictly to
  // that hill's own x-range and its own terrain shape, so it never
  // bleeds into the flat baseline before/after it.
  const BAND_TOP = 8, BAND_BASE = 92, BAND_H = BAND_BASE - BAND_TOP
  const sortedSlopes = [...slopes].sort((a, b) => a.start - b.start)
  const toX = m => (m / distance) * 1000

  const RISE = BAND_H * 0.55
  let level = 0
  const elevPoints = [{ m: 0, y: 0 }]
  const segRanges = [] // { m0, y0, m1, y1, up }
  sortedSlopes.forEach(s => {
    const m0 = s.start, m1 = s.start + s.length
    if (m0 > elevPoints[elevPoints.length - 1].m) {
      elevPoints.push({ m: m0, y: level }) // flat plateau up to this slope's start
    }
    const newLevel = level + (s.slope > 0 ? -RISE : RISE)
    elevPoints.push({ m: m1, y: newLevel })
    segRanges.push({ m0, y0: level, m1, y1: newLevel, up: s.slope > 0 })
    level = newLevel
  })
  elevPoints.push({ m: distance, y: level })

  const toY = y => BAND_BASE + y
  const terrainPath = `M0,${BAND_BASE} ` +
    elevPoints.map(p => `L${toX(p.m)},${toY(p.y)}`).join(' ') +
    ` L1000,${BAND_BASE} Z`

  return (
    <div className="track-visual">
      <svg
        viewBox="0 0 1000 266"
        className="track-visual-svg tv-strip"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        preserveAspectRatio="none"
      >
        {/* elevation band: green terrain shape, flat by default */}
        <rect x="0" y="0" width="1000" height="100" fill="var(--panel)" />
        <path d={terrainPath} fill="#1f8f52" opacity="0.35" />
        <path
          d={`M0,${BAND_BASE} ` + elevPoints.map(p => `L${toX(p.m)},${toY(p.y)}`).join(' ')}
          fill="none" stroke="#2fae63" strokeWidth="2"
        />
        {/* uphill/downhill sections: color is clipped to this hill's
            exact x-range so it only ever covers that hill's own shape,
            never the flat ground before/after it */}
        <defs>
          {segRanges.map((s, i) => (
            <clipPath id={`hillclip-${i}`} key={i}>
              <rect x={toX(s.m0)} y={BAND_TOP} width={Math.max(toX(s.m1) - toX(s.m0), 0.5)} height={BAND_H} />
            </clipPath>
          ))}
        </defs>
        {segRanges.map((s, i) => {
          const color = s.up ? '#d3931f' : '#2bb8a3'
          return (
            <g key={i} clipPath={`url(#hillclip-${i})`}>
              <path d={terrainPath} fill={color} opacity="0.65" />
              <path
                d={`M0,${BAND_BASE} ` + elevPoints.map(p => `L${toX(p.m)},${toY(p.y)}`).join(' ')}
                fill="none" stroke={color} strokeWidth="3"
              />
            </g>
          )
        })}
        {segRanges.map((s, i) => {
          const color = s.up ? '#d3931f' : '#2bb8a3'
          return (
            <g key={`edge-${i}`}>
              <line x1={toX(s.m0)} y1={BAND_TOP} x2={toX(s.m0)} y2={BAND_BASE} stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1={toX(s.m1)} y1={BAND_TOP} x2={toX(s.m1)} y2={BAND_BASE} stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
            </g>
          )
        })}
        <line x1="0" y1={BAND_BASE} x2="1000" y2={BAND_BASE} stroke="var(--border)" strokeWidth="1" />
        <line x1="0" y1="100" x2="1000" y2="100" stroke="var(--border)" strokeWidth="1" />

        {/* straight/corner band */}
        <rect x="0" y="106" width="1000" height="52" fill="var(--panel)" />
        {segments.map((s, i) => {
          const x = (s.start / distance) * 1000
          const w = ((s.end - s.start) / distance) * 1000
          const isCorner = s.kind === 'corner'
          return (
            <g key={i}>
              <rect
                x={x} y="106" width={w} height="52"
                fill={isCorner ? (i % 2 ? '#c76d13' : '#d97d1f') : (i % 2 ? '#1c7fc9' : '#2a8fd9')}
                opacity="0.85"
              />
              {w > 55 && (
                <text x={x + w / 2} y="136" textAnchor="middle" fontSize="18" fill="#fff" opacity="0.9">
                  {isCorner ? 'Corner' : 'Straight'}
                </text>
              )}
            </g>
          )
        })}
        <line x1="0" y1="158" x2="1000" y2="158" stroke="var(--border)" strokeWidth="1" />

        {/* phase band, boundaries taken from the game's fixed phase fractions */}
        {phases.map(ph => {
          const x = (ph.start / distance) * 1000
          const w = ((ph.end - ph.start) / distance) * 1000
          return (
            <g key={ph.label}>
              <rect x={x} y="168" width={w} height="52" fill={ph.fill} opacity="0.9" />
              {w > 70 && (
                <text x={x + w / 2} y="198" textAnchor="middle" fontSize="16" fill="#fff" opacity="0.9">
                  {ph.label}
                </text>
              )}
            </g>
          )
        })}
        <line x1="0" y1="220" x2="1000" y2="220" stroke="var(--border)" strokeWidth="1" />

        {/* distance ruler: labeled every 200m, matched exactly to the track's real distance */}
        <rect x="0" y="228" width="1000" height="38" fill="var(--panel)" />
        {Array.from({ length: Math.floor(distance / 200) + 1 }, (_, i) => i * 200)
          .concat(distance % 200 !== 0 ? [distance] : [])
          .map((m, idx, arr) => {
            const x = (m / distance) * 1000
            const isFirst = m === 0
            const isLast = idx === arr.length - 1
            return (
              <g key={m}>
                <line x1={x} y1="228" x2={x} y2="238" stroke="var(--muted)" strokeWidth={isFirst || isLast ? 2 : 1} opacity="0.6" />
                <text
                  x={x} y="260" fontSize="14"
                  textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                  fill="var(--muted)"
                >
                  {m}m
                </text>
              </g>
            )
          })}

        {/* 777m remaining marker: crucial accel-point reference (e.g. Oguri Cap) */}
        {distance > 777 && (() => {
          const rx = ((distance - 777) / distance) * 1000
          return (
            <g>
              <line x1={rx} y1="0" x2={rx} y2="246" stroke="#ff5fd1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.9" />
              <polygon points={`${rx - 6},0 ${rx + 6},0 ${rx},10`} fill="#ff5fd1" />
              <text x={rx} y="24" textAnchor="middle" fontSize="14" fill="#ff5fd1" fontWeight="700">777m left</text>
            </g>
          )
        })()}

        {/* hover readout */}
        {hover !== null && (
          <g>
            <line x1={(hover / distance) * 1000} y1="0" x2={(hover / distance) * 1000} y2="246" stroke="var(--gold, #d4af37)" strokeWidth="2" />
            <text x={(hover / distance) * 1000 + 6} y="16" fontSize="16" fill="var(--gold, #d4af37)">{hover}m</text>
          </g>
        )}
      </svg>

      <div className="track-visual-legend">
        <div className="tv-legend-item"><span className="tv-dot" style={{ background: '#2a8fd9' }} />Straight</div>
        <div className="tv-legend-item"><span className="tv-dot" style={{ background: '#d97d1f' }} />Corner</div>
        {slopes.length > 0 && (
          <>
            <div className="tv-legend-item"><span className="tv-dot" style={{ background: '#d3931f' }} />Uphill</div>
            <div className="tv-legend-item"><span className="tv-dot" style={{ background: '#2bb8a3' }} />Downhill</div>
          </>
        )}
        <div className="tv-legend-meta">{corners.length} corner{corners.length !== 1 ? 's' : ''} · {straights.length} straight{straights.length !== 1 ? 's' : ''} · {track.handed}-handed</div>
      </div>
      <p className="tv-note">Real course geometry (corners, straights, elevation) — hover the strip for exact distance.</p>
    </div>
  )
}

// Fallback for tracks we don't have course_data.json geometry for: a
// lighter oval schematic built purely from theory checkpoints.
function FallbackVisual({ track }) {
  const distance = Number(track.distance) || 0
  const cx = 200, cy = 110, rx = 130, ry = 70, half = 90

  function trackPoint(frac, cx, cy, rx, ry, half) {
    const f = ((frac % 1) + 1) % 1
    const total = 2 * half + Math.PI * rx * 2
    let d = f * total
    if (d < half * 2) return { x: cx - half + d, y: cy + ry }
    d -= half * 2
    const arcLen = Math.PI * rx
    if (d < arcLen) {
      const t = (d / arcLen) * Math.PI
      return { x: cx + half + rx * Math.sin(t), y: cy + ry * Math.cos(t) }
    }
    d -= arcLen
    if (d < half * 2) return { x: cx + half - d, y: cy - ry }
    d -= half * 2
    const t = (d / arcLen) * Math.PI
    return { x: cx - half - rx * Math.sin(t), y: cy - ry * Math.cos(t) }
  }

  const markers = [
    { key: 'posKeepEnd', label: 'Pos. Keep Ends', color: '#6ea8fe' },
    { key: 'spurtStart', label: 'Late Race', color: '#2bb8a3' },
    { key: 'lastSpurtStart', label: 'Last Spurt', color: '#d4af37' },
  ].map(m => ({ ...m, frac: Number(track[m.key]) / distance }))
    .filter(m => Number.isFinite(m.frac))

  return (
    <div className="track-visual">
      <svg viewBox="0 0 400 220" className="track-visual-svg">
        <rect x={cx - half} y={cy - ry - 26} width={half * 2} height={(ry + 26) * 2}
          rx={ry + 26} ry={ry + 26} fill="none" stroke="var(--border)" strokeWidth="34" opacity="0.5" />
        <rect x={cx - half} y={cy - ry} width={half * 2} height={ry * 2}
          rx={ry} ry={ry} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="6 6" opacity="0.6" />
        <line x1={cx + half - 4} y1={cy + ry - 14} x2={cx + half - 4} y2={cy + ry + 14} stroke="var(--text)" strokeWidth="3" />
        <text x={cx + half - 4} y={cy + ry + 30} textAnchor="middle" className="tv-label">Finish</text>
        <circle cx={cx - half} cy={cy + ry} r="5" fill="var(--gold, #d4af37)" />
        <text x={cx - half} y={cy + ry + 30} textAnchor="middle" className="tv-label">Start</text>
        {markers.map(m => {
          const p = trackPoint(-Math.max(0, Math.min(1, m.frac)), cx, cy, rx, ry, half)
          return <circle key={m.key} cx={p.x} cy={p.y} r="7" fill={m.color} stroke="var(--panel)" strokeWidth="2" />
        })}
        {distance > 777 && (() => {
          const p = trackPoint(-Math.max(0, Math.min(1, (distance - 777) / distance)), cx, cy, rx, ry, half)
          return <circle cx={p.x} cy={p.y} r="7" fill="#ff5fd1" stroke="var(--panel)" strokeWidth="2" />
        })()}
      </svg>
      <div className="track-visual-legend">
        {markers.map(m => (
          <div className="tv-legend-item" key={m.key}>
            <span className="tv-dot" style={{ background: m.color }} />
            {m.label}: <b>{track[m.key]}m</b>
          </div>
        ))}
        {distance > 777 && (
          <div className="tv-legend-item">
            <span className="tv-dot" style={{ background: '#ff5fd1' }} />
            777m Remaining: <b>{distance - 777}m</b>
          </div>
        )}
        <div className="tv-legend-item tv-legend-meta">
          {track.corners} corner{Number(track.corners) !== 1 ? 's' : ''} · {track.straights} straight{Number(track.straights) !== 1 ? 's' : ''} · {track.handed}-handed
        </div>
      </div>
      <p className="tv-note">Schematic diagram from theory data — no detailed course geometry on file for this track.</p>
    </div>
  )
}

export default function TrackVisual({ track }) {
  const geometry = getCourseGeometry(track)
  if (geometry) return <GeometryVisual track={track} geometry={geometry} />
  return <FallbackVisual track={track} />
}
