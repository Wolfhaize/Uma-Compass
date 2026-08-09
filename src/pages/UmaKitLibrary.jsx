import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UMA_PROFILES from '../data/uma_profiles.json'
import SKILL_NAMES from '../data/skillnames.json'
import {
  describePhase, PHASE_NAMES,
  APTITUDE_GRADE_COLOR, APTITUDE_GROUPS, APTITUDE_KEY_LABEL, GROWTH_STAT_KEYS,
} from '../utils/umaProfiler.js'
import { recommendUmasForSkillQuery } from '../utils/skillLookup.js'
import { getIconUrl } from '../utils/iconUrl.js'
import { ENABLE_SKILL_EVOLUTIONS } from '../config/features.js'
import { useDraft } from '../context/DraftContext.jsx'

const PHASES = [0, 1, 2, 3]
const PHASE_SHORT = {
  0: `${PHASE_NAMES[0]} (Accel)`,
  1: `${PHASE_NAMES[1]} (Velocity)`,
  2: `${PHASE_NAMES[2]} (Accel)`,
  3: `${PHASE_NAMES[3]} (Velocity)`,
}

// Add new labels for specific trigger locations
const TRIGGER_LOCATION_LABEL = {
  any: 'Anywhere',
  last_straight: 'Final Straight',
  final_corner: 'Final Corner',
  final_corner_or_straight: 'Final Corner or Straight',
  final_corner_or_later: 'Final Corner or Later',
  corner: 'Corner',
  straight: 'Straight',
  back_straight: 'Back Straight',
  front_straight: 'Front Straight',
  uphill: 'Uphill',
  downhill: 'Downhill',
  distance: 'Fixed distance',
  instant: 'Instant',
  start: 'Race Start',
}

function segmentLabel(skill) {
  if (skill.hasData === false) return 'Unknown'
  
  // Use triggerLocation if available, fall back to corner for backward compatibility
  const location = skill.triggerLocation || skill.corner
  
  if (location === 'distance' && skill.distanceTrigger) {
    return `${TRIGGER_LOCATION_LABEL.distance} (${skill.distanceTrigger.isWindow ? '~' : ''}${skill.distanceTrigger.meters}m left)`
  }
  
  return TRIGGER_LOCATION_LABEL[location] || location || 'Unknown'
}

// Short abbreviations for the compact phase bar (full names shown on hover
// via the tooltip, and used everywhere else - table, filters, etc).
const PHASE_ABBR = { 0: 'ER', 1: 'MR', 2: 'LR', 3: 'LS' }

// Display-only number formatter: shows the real value (up to 4 decimal
// places) instead of rounding to 2, so e.g. 0.055 never collapses into 0.06
// and 0.015 never collapses into 0.02.
function formatNum(n) {
  if (n === undefined || n === null) return '0'
  const rounded = Math.round(n * 10000) / 10000
  return String(rounded)
}

// Corner/straight/no-restriction, rendered as clear words rather than the
// raw classifier token. 'any' (can fire anywhere, no corner/straight gate)
// reads as "Random" per user preference - "Anywhere" implied more certainty
// than these skills actually have. 'instant' (green stat skills, resolved
// once pre-race) and 'start' (reaction-time fixes, resolved at the start
// line) get their own explicit labels since they're not really "in the
// corner/straight sense" at all. 'distance' is a bare remain_distance
// trigger with no corner/straight keyword (e.g. Oguri Cap's Triumphant
// Pulse, "remain_distance<=201&>=199") - it's NOT random, it's pinned to an
// exact distance, so it gets its own label built from distanceTrigger
// rather than being lumped in with true RNG-gated skills.

// Phase display: numeric phases use PHASE_NAMES as before. 'always' means
// the classifier couldn't pin the skill to a specific phase (usually an
// RNG-gated proc with no deterministic phase condition) - shown as "Random"
// rather than "Always", since in practice that's what it means for the
// player: it could go off anywhere, not that it's continuously active.
function phaseLabel(p, hasLastSpurt) {
  if (p === 'always') return 'Random'
  if (typeof p === 'number') {
    // If this is a phase, and the skill also requires spurt-ready state
    if (hasLastSpurt) {
      return `${PHASE_NAMES[p]} (Can Full Spurt)`
    }
    return PHASE_NAMES[p]
  }
  return p
}

// Skills gated on a bare remain_distance window (no phase/corner/straight
// keyword) get a precise "fires with ~Xm left" label instead of forcing
// them into a phase name that may not actually match - remaining meters
// don't line up the same way across sprint vs long courses. Falls back to
// the normal phase list for everything else.
// Skills gated on a bare remain_distance window (no phase/corner/straight
// keyword) get a precise "fires with ~Xm left" label instead of forcing
// them into a phase name that may not actually match - remaining meters
// don't line up the same way across sprint vs long courses. Falls back to
// the normal phase list for everything else.
function whereItFiresLabel(skill) {
  if (skill.hasData === false) return 'Unknown'
  
  const parts = []
  
  // Handle distance trigger
  if (skill.distanceTrigger) {
    const { meters, isWindow } = skill.distanceTrigger
    parts.push(`${isWindow ? '~' : ''}Final ${meters}m`)
  }
  
  // Handle phases
  if (skill.phases && skill.phases.length > 0 && !skill.phases.includes('unknown')) {
    const phaseNames = skill.phases
      .filter(p => p !== 'always')
      .map(p => {
        const name = PHASE_NAMES[p]
        // Add Can Full Spurt indicator if this skill requires it
        if (skill.hasLastSpurt) {
          return `${name} (Can Full Spurt)`
        }
        return name
      })
    if (phaseNames.length) {
      parts.push(phaseNames.join(', '))
    }
  }
  
  // Handle "always" case
  if (skill.phases && skill.phases.includes('always')) {
    parts.push('Random')
  }
  
  // If no parts, show a default
  if (parts.length === 0) {
    parts.push('Unknown')
  }
  
  return parts.join(' · ')
}


const KIT_TAG_OPTIONS = [
  'Straight Accel',
  'Corner Accel',
  'Debuff',
  'Final Spurt',
  'Late Race Velocity',
  'Built-in Recovery',
]

const UNIQUE_TAG_OPTIONS = [
  'Straight Accel (Unique)',
  'Corner Accel (Unique)',
]

const GROWTH_THRESHOLDS = [10, 20, 30]

function Icon({ cardId, name, size = 56 }) {
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

function PhaseBar({ scores }) {
  const max = Math.max(1, ...PHASES.map(p => scores[p]))
  return (
    <div className="phase-bar">
      {PHASES.map(p => (
        <div key={p} className="phase-bar-col" data-phase={p} title={`${PHASE_SHORT[p]}: ${formatNum(scores[p])}`}>
          <div className="phase-bar-fill" style={{ height: `${Math.max(4, (scores[p] / max) * 100)}%` }} />
          <span className="phase-bar-label">{PHASE_ABBR[p]}</span>
        </div>
      ))}
    </div>
  )
}

// Single letter-grade badge, colored per APTITUDE_GRADE_COLOR. Used both in
// the full grouped breakdown (modal) and the compact strip (card).
function AptitudeBadge({ aptKey, grade, compact }) {
  const color = APTITUDE_GRADE_COLOR[grade] || APTITUDE_GRADE_COLOR.G
  return (
    <span
      className="apt-badge"
      style={{ background: color }}
      title={`${APTITUDE_KEY_LABEL[aptKey] || aptKey}: ${grade}`}
    >
      {!compact && <span className="apt-badge-label">{APTITUDE_KEY_LABEL[aptKey] || aptKey}</span>}
      {grade}
    </span>
  )
}

// Full aptitude breakdown, every grade shown (not just the best per group) -
// grouped into Surface / Distance / Style per skill_conditions.json's own
// aptitude categories, each badge colored by its own letter grade.
function AptitudeGroups({ aptitudes }) {
  return (
    <div className="apt-groups">
      {APTITUDE_GROUPS.map(group => (
        <div key={group.label} className="apt-group-row">
          <span className="apt-group-name">{group.label}</span>
          <span className="apt-group-badges">
            {group.keys.map(k => (
              <AptitudeBadge key={k} aptKey={k} grade={aptitudes[k] || 'G'} />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

// Compact one-line version for the card grid (before you click in) - same
// 10 grades, just smaller badges with no text label (grade letter only,
// full name still available on hover).
function AptitudeStrip({ aptitudes }) {
  const allKeys = APTITUDE_GROUPS.flatMap(g => g.keys)
  return (
    <div className="apt-strip">
      {allKeys.map(k => (
        <AptitudeBadge key={k} aptKey={k} grade={aptitudes[k] || 'G'} compact />
      ))}
    </div>
  )
}

// Growth-rate badges: only the datamine's per-uma "+X% stat growth under a
// condition" bonuses (0 values omitted so a card isn't cluttered with
// "Speed +0"). Uniques with no datamined growth entry show nothing at all
// rather than a misleading "+0 everywhere".
function GrowthBadges({ growth, growthCondition, compact }) {
  if (!growth) return compact ? null : <span className="growth-badge-none">No growth data</span>
  const entries = GROWTH_STAT_KEYS.map(k => [k, growth[k] || 0]).filter(([, v]) => v > 0)
  if (!entries.length) return compact ? null : <span className="growth-badge-none">No growth data</span>
  return (
    <div className="growth-badges" title={growthCondition ? `Condition: ${growthCondition}` : undefined}>
      {entries.map(([stat, val]) => (
        <span key={stat} className="growth-badge">
          <span className="growth-badge-stat">{stat}</span>+{val}%
        </span>
      ))}
    </div>
  )
}

function skillValueLabel(skill) {
  if (skill.hasData === false) return 'No data'
  const parts = []
  if (skill.velocityValue) parts.push(`Velocity +${formatNum(skill.velocityValue)}`)
  if (skill.currentSpeedValue) parts.push(`Current Speed +${formatNum(skill.currentSpeedValue)}`)
  if (skill.accelValue) parts.push(`Accel +${formatNum(skill.accelValue)}`)
  if (skill.recoveryValue) parts.push(`Recovery +${formatNum(skill.recoveryValue)}`)
  if (skill.laneMoveValue) parts.push(`Lane move +${formatNum(skill.laneMoveValue)}`)
  if (skill.reactionValue) parts.push(`Start reaction +${formatNum(skill.reactionValue)}`)
  if (skill.greenStats?.length) parts.push(skill.greenStats.map(g => `${g.stat} +${g.value}`).join(', '))
  if (skill.debuffBreakdown?.length) {
    parts.push(skill.debuffBreakdown.map(d => `${d.stat} debuff -${formatNum(d.value)}`).join(', '))
  } else if (skill.hasDebuff) {
    parts.push('Debuff')
  }

  return parts.length ? parts.join(' · ') : '—'
}

// isUnique gets the existing ★ marker. isGold gets a small gold star,
// visually distinguishing gold skills from white ones (which get nothing
// extra) without changing the layout.
function skillNameLabel(skill) {
  if (skill.isUnique) return '★'
  if (skill.isGold) return '✦'
  return ''
}

function UmaModal({ profile, onClose }) {
  const { isUmaSelected, toggleUma, isUmaTaken, toggleUmaTaken } = useDraft()
  if (!profile) return null
  const selected = isUmaSelected(profile)
  const taken = isUmaTaken(profile)
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Icon cardId={profile.cardId} name={profile.name} size={72} />
          <div>
            <h2 style={{ margin: 0 }}>{profile.name}</h2>
            <p className="muted small" style={{ margin: '2px 0 0' }}>{profile.title}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button className={'draft-toggle-btn' + (selected ? ' active' : '')} style={{ width: 'auto' }} onClick={() => toggleUma(profile)}>
            {selected ? '✓ Saved' : '+ Save Uma'}
          </button>
          <button className={'taken-toggle-btn' + (taken ? ' active' : '')} onClick={() => toggleUmaTaken(profile)}>
            {taken ? 'Taken ✓' : 'Mark as taken'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
          <div>
            <p className="muted small" style={{ margin: '0 0 4px' }}>Phase strength</p>
            <PhaseBar scores={profile.phaseScores} />
          </div>
          <div>
            <p className="muted small" style={{ margin: '0 0 4px' }}>
              Aptitudes <span style={{ fontWeight: 400 }}>(all grades — best per group: Distance {profile.bestDistance.grade}, Style {profile.bestStyle.grade}, Surface {profile.bestSurface.grade})</span>
            </p>
            <AptitudeGroups aptitudes={profile.aptitudes} />
          </div>
          <div>
            <p className="muted small" style={{ margin: '0 0 4px' }}>Growth rate</p>
            <GrowthBadges growth={profile.growth} growthCondition={profile.growthCondition} />
            {profile.growthVariants?.length > 1 && (
              <p className="muted small" style={{ margin: '6px 0 0', maxWidth: 260 }}>
                This uma also has {profile.growthVariants.length - 1} other outfit growth split{profile.growthVariants.length - 1 === 1 ? '' : 's'} ({profile.growthVariants.filter(v => v.variant !== 'Base').map(v => v.variant).join(', ')}). The numbers above are for the base outfit.
              </p>
            )}
          </div>
        </div>

        <div className="chips" style={{ marginTop: 10 }}>
          {[...profile.tags, ...profile.uniqueTags].map(t => <span key={t} className="chip">{t}</span>)}
          {profile.tags.length === 0 && profile.uniqueTags.length === 0 && (
            <span className="muted small">No standout kit shapes detected.</span>
          )}
        </div>

        <h3 style={{ margin: '16px 0 6px' }}>Kit skills</h3>
        {profile.skills.some(s => s.hasData === false) && (
          <p className="muted small" style={{ margin: '0 0 8px' }}>
            Skills marked "Unknown" (dashed, faded) are missing effect data for now.
          </p>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Phase(s)</th>
                <th>Where it fires</th>
                <th>Position requirement</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {profile.skills.map(s => (
                <tr key={s.id} className={s.hasData === false ? 'skill-row-nodata' : (s.isGold ? 'skill-row-gold' : undefined)}>
                  <td>
                    {s.name}
                    {skillNameLabel(s) && <span className={s.isUnique ? 'skill-marker' : 'skill-marker skill-marker-gold'}> {skillNameLabel(s)}</span>}
                    {ENABLE_SKILL_EVOLUTIONS && s.isEvo ? ' (evo)' : ''}
                  </td>
                  <td>{whereItFiresLabel(s)}</td>
                  <td>{segmentLabel(s)}</td>
                  <td className={s.isUnique && s.positionRequirement ? 'skill-position-req' : undefined}>
                    {s.hasData === false ? 'Unknown' : (s.positionRequirement?.label || '—')}
                  </td>
                  <td>{skillValueLabel(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UmaCard({ profile, onSelect }) {
  const { isUmaSelected, toggleUma, isUmaTaken, toggleUmaTaken } = useDraft()
  const selected = isUmaSelected(profile)
  const taken = isUmaTaken(profile)
  return (
    <div className={'option-card uma-card' + (taken ? ' card-taken' : '')}>
      <button className="uma-card-inner-btn" style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }} onClick={() => onSelect(profile)}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Icon cardId={profile.cardId} name={profile.name} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <span className="option-card-title">{profile.name}</span>
            <span className="option-card-desc">{profile.title}</span>
          </div>
          <PhaseBar scores={profile.phaseScores} />
        </div>
        <AptitudeStrip aptitudes={profile.aptitudes} />
        <GrowthBadges growth={profile.growth} growthCondition={profile.growthCondition} compact />
        <div className="chips" style={{ marginTop: 8 }}>
          {[...profile.tags, ...profile.uniqueTags].length
            ? [...profile.tags, ...profile.uniqueTags].map(t => <span key={t} className="chip">{t}</span>)
            : <span className="muted small">No standout kit shapes detected.</span>}
        </div>
      </button>
      <div className="uma-card-toggle-row" onClick={e => e.stopPropagation()}>
        <button className={'taken-toggle-btn' + (taken ? ' active' : '')} onClick={() => toggleUmaTaken(profile)}>
          {taken ? 'Taken ✓' : 'Mark as taken'}
        </button>
        <input
          type="checkbox"
          className="uma-card-checkbox"
          checked={selected}
          onChange={() => toggleUma(profile)}
          aria-label={`Save ${profile.name} to My Umas`}
          title={selected ? 'Remove from My Umas' : 'Save to My Umas'}
        />
      </div>
    </div>
  )
}

export default function UmaKitLibrary() {
  const [query, setQuery] = useState('')
  const [umaSearch, setUmaSearch] = useState('')
  const [activeKitTags, setActiveKitTags] = useState([])
  const [activeUniqueTags, setActiveUniqueTags] = useState([])
  const [sortPhase, setSortPhase] = useState(null)
  const [selected, setSelected] = useState(null)
  // { Speed: {threshold, dir} | undefined, Stam: ..., ... } - dir is 'gte'
  // (stat >= threshold, i.e. "above") or 'lt' ("below" that threshold).
  // Absent/undefined for a stat means no filter applied for it.
  const [growthFilters, setGrowthFilters] = useState({})

  const skillResults = useMemo(() => {
    if (!query.trim()) return []
    return recommendUmasForSkillQuery(query, SKILL_NAMES, UMA_PROFILES, 5)
  }, [query])

  function toggleKitTag(tag) {
    setActiveKitTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }
  function toggleUniqueTag(tag) {
    setActiveUniqueTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }
  // Clicking the already-active threshold/direction for a stat clears that
  // stat's filter; clicking a different one replaces it (one filter per
  // stat at a time - "above 10 AND above 20" for the same stat is
  // meaningless, but "Speed above 10 AND Stam above 10" across stats is
  // exactly the combo the growth filter is for, so different stats stay
  // independent and combine with AND).
  function setGrowthFilter(stat, threshold, dir) {
    setGrowthFilters(prev => {
      const current = prev[stat]
      const next = { ...prev }
      if (current && current.threshold === threshold && current.dir === dir) {
        delete next[stat]
      } else {
        next[stat] = { threshold, dir }
      }
      return next
    })
  }
  const activeGrowthStatCount = Object.keys(growthFilters).length

  const filtered = useMemo(() => {
    let list = UMA_PROFILES
    if (activeKitTags.length) list = list.filter(p => activeKitTags.every(t => p.tags.includes(t)))
    if (activeUniqueTags.length) list = list.filter(p => activeUniqueTags.every(t => p.uniqueTags.includes(t)))
    const q = umaSearch.trim().toLowerCase()
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q))

    const growthStats = Object.entries(growthFilters)
    if (growthStats.length) {
      list = list.filter(p => {
        if (!p.growth) return false // no datamined growth entry - can't verify, so excluded
        return growthStats.every(([stat, { threshold, dir }]) => {
          const v = p.growth[stat] || 0
          return dir === 'gte' ? v >= threshold : v < threshold
        })
      })
    }

    if (sortPhase !== null) {
      return [...list].sort((a, b) => b.phaseScores[sortPhase] - a.phaseScores[sortPhase])
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [activeKitTags, activeUniqueTags, umaSearch, sortPhase, growthFilters])

  const { selectedUmaIds } = useDraft()

  return (
    <div className="app">
      <header className="track-hub-header">
        <div>
          <h1>Uma Kit Library</h1>
          <p className="subtitle">
            Every kit skill classified by race phase, accel-vs-velocity, and corner/straight focus —
            so recommendations come from what an uma's kit actually does, not just its name.
          </p>
        </div>
        {selectedUmaIds.length > 0 && (
          <div className="draft-pool-row">
            <Link to="/draft-board" className="draft-pool-pill">
              🐎 {selectedUmaIds.length} uma{selectedUmaIds.length !== 1 ? 's' : ''} saved →
            </Link>
          </div>
        )}
      </header>

      <section className="board-section">
        <h2>Search by skill</h2>
        <p className="muted small">
          Type a skill name (or part of one) — e.g. "pump some iron" — to see which umas naturally carry it.
        </p>
        <input
          className="text-input"
          type="text"
          placeholder="Search a skill name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', maxWidth: 420, padding: '8px 10px', marginTop: 4 }}
        />
        {query.trim() && (
          <div style={{ marginTop: 14 }}>
            {skillResults.length === 0 && <p className="muted small">No skill names match that.</p>}
            {skillResults.map(r => (
              <div key={r.skillId} className="board-section" style={{ marginTop: 10 }}>
                <h3 style={{ margin: '0 0 6px' }}>{r.skillName}</h3>
                {r.umas.length === 0 && <p className="muted small">No umas carry this skill natively.</p>}
                <div className="chips">
                  {r.umas.map(u => (
                    <span key={u.cardId} className="chip">
                      {u.name}{u.isGold ? ' ✦' : ''} — {u.title}{u.isUnique ? ' (unique)' : ''}{ENABLE_SKILL_EVOLUTIONS && u.isEvo ? ' (evo)' : ''}
                      {' '}· {skillValueLabel(u)}
                      {u.isUnique && u.positionRequirement ? ` · Position: ${u.positionRequirement.label}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="board-section">
        <h2>Kit shape</h2>
        <p className="muted small">Filter by what an uma's whole kit (unique + innate + awakening) can do.</p>
        <div className="option-row option-row-wide">
          {KIT_TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              className={'option-btn' + (activeKitTags.includes(tag) ? ' active' : '')}
              onClick={() => toggleKitTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="board-section">
        <h2>Unique skill shape</h2>
        <p className="muted small">Same idea, but only looking at the uma's unique skill itself (corner acceleration uniques matter a lot when late race starts on a corner).</p>
        <div className="option-row option-row-wide">
          {UNIQUE_TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              className={'option-btn' + (activeUniqueTags.includes(tag) ? ' active' : '')}
              onClick={() => toggleUniqueTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="board-section">
        <h2>Growth rate</h2>
        <p className="muted small">
          Filter by unique stat-growth bonuses (e.g. "Speed above 10 and Stam above 10"). Pick a threshold and
          direction per stat — stats combine with AND, clicking an active button again clears that stat.
          Umas with no growth data are excluded once any growth filter is active.
        </p>
        <div className="growth-filter-grid">
          {GROWTH_STAT_KEYS.map(stat => {
            const active = growthFilters[stat]
            return (
              <div key={stat} className="growth-filter-row">
                <span className="growth-filter-stat">{stat}</span>
                {GROWTH_THRESHOLDS.map(t => (
                  <button
                    key={`${stat}-gte-${t}`}
                    className={'growth-filter-btn' + (active?.threshold === t && active?.dir === 'gte' ? ' active' : '')}
                    onClick={() => setGrowthFilter(stat, t, 'gte')}
                  >
                    {t}+
                  </button>
                ))}
                {GROWTH_THRESHOLDS.map(t => (
                  <button
                    key={`${stat}-lt-${t}`}
                    className={'growth-filter-btn' + (active?.threshold === t && active?.dir === 'lt' ? ' active' : '')}
                    onClick={() => setGrowthFilter(stat, t, 'lt')}
                  >
                    &lt;{t}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        {activeGrowthStatCount > 0 && (
          <p className="muted small" style={{ marginTop: 6 }}>
            Active: {Object.entries(growthFilters).map(([stat, f]) => `${stat} ${f.dir === 'gte' ? '≥' : '<'} ${f.threshold}`).join(', ')}
            {' '}<button className="growth-filter-btn" onClick={() => setGrowthFilters({})}>Clear all</button>
          </p>
        )}
      </section>

      <section className="board-section">
        <h2>Phase strength</h2>
        <p className="muted small">Optional: sort the whole kit by how strong it is in one race phase. Leave off to just browse by kit shape.</p>
        <div className="option-row" style={{ marginTop: 4 }}>
          <button
            className={'option-btn' + (sortPhase === null ? ' active' : '')}
            onClick={() => setSortPhase(null)}
          >
            None
          </button>
          {PHASES.map(p => (
            <button
              key={p}
              className={'option-btn' + (sortPhase === p ? ' active' : '')}
              onClick={() => setSortPhase(p)}
            >
              {PHASE_SHORT[p]}
            </button>
          ))}
        </div>
        {sortPhase !== null && <p className="muted small" style={{ marginTop: 6 }}>{describePhase(sortPhase)}</p>}
      </section>

      <section className="board-section">
        <div className="track-hub-header" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Umas ({filtered.length})</h2>
        </div>
        <input
          className="text-input"
          type="text"
          placeholder="Search umas by name or outfit..."
          value={umaSearch}
          onChange={e => setUmaSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 420, padding: '8px 10px', marginBottom: 12 }}
        />
        <div className="board-grid">
          {filtered.slice(0, 60).map(p => <UmaCard key={p.cardId} profile={p} onSelect={setSelected} />)}
        </div>
        {filtered.length === 0 && <p className="muted small">No umas match that combination.</p>}
        {filtered.length > 60 && <p className="muted small">Showing top 60 of {filtered.length} — narrow with search/tags above to see more precisely.</p>}
      </section>

      <UmaModal profile={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
