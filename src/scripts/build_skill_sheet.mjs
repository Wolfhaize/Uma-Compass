// build_skill_sheet.mjs
//
// Derives a complete, categorized skill reference (src/data/skill_sheet_full.json)
// from the raw game data files:
//   - skillnames.json    id -> [display name, ...]
//   - skill_data.json    id -> { alternatives: [{ condition, baseDuration, effects[], precondition }], rarity, wisdomCheck }
//   - skill_conditions.json  glossary of condition variable names -> descriptions
//
// Effect `type` codes and their meaning were confirmed straight from umalator's
// own compiled source (the effect-type label table it uses to render skill
// details), not guessed:
//   1 SpeedUp, 2 StaminaUp, 3 PowerUp, 4 GutsUp, 5 WisdomUp, 9 Recovery,
//   10 MultiplyStartDelay, 14 SetStartDelay, 21 CurrentSpeed,
//   22 CurrentSpeedWithNaturalDeceleration, 27 TargetSpeed, 28 LaneMovementSpeed,
//   31 Accel, 37 ActivateRandomGold, 42 ExtendEvolvedDuration
//
// All effect `modifier` values share one raw scale: divide by 10000 to get the
// real unit value (m/s, m/s^2, or fraction-of-100 for percentages). This was
// verified against known cheat-sheet numbers (e.g. Corner Adept: modifier 1500,
// type 27 -> "Increase Target Speed 0.15"; Swinging Maestro: modifier 550,
// type 9 -> "Stamina Recovery 5.5%"). `baseDuration` uses the same /10000 scale
// to get seconds (e.g. 24000 -> 2.4s, matching the cheat sheet).
//
// Category rules (Speed / Accel / Stamina / Unique):
//   - Unique: skill id is a bare 5-digit id (e.g. "10071" Warning Shot!) —
//     this id shape is specifically how umalator's own data (and its
//     "(inherited)" 90xxx counterparts) identifies a character's own unique
//     skill, confirmed against its inherited-skill name table.
//   - Otherwise: Accel if any effect has type 31; else Stamina if any effect
//     has type 2 (StaminaUp) or 9 (Recovery); else Speed (covers TargetSpeed,
//     CurrentSpeed, SpeedUp, lane movement, stat-ups, and any effect type we
//     don't have a specific bucket for).

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

const names = JSON.parse(readFileSync(path.join(dataDir, 'skillnames.json'), 'utf8'))
const skillData = JSON.parse(readFileSync(path.join(dataDir, 'skill_data.json'), 'utf8'))
const conditions = JSON.parse(readFileSync(path.join(dataDir, 'skill_conditions.json'), 'utf8'))

const CONDITION_LABEL = new Map(conditions.map(c => [c.name, c.desc]))

const EFFECT_LABEL = {
  1: 'Speed Up', 2: 'Stamina Up', 3: 'Power Up', 4: 'Guts Up', 5: 'Wisdom Up',
  9: 'Recovery', 10: 'Start Delay ×', 14: 'Set Start Delay',
  21: 'Current Speed', 22: 'Current Speed (w/ decel)', 27: 'Target Speed',
  28: 'Lane Move Speed', 31: 'Acceleration', 37: 'Activate Random Gold Skill',
  42: 'Skill Duration Up',
}

function humanizeVarName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const OP_LABEL = { '>=': '\u2265', '<=': '\u2264', '==': '=', '!=': '\u2260', '>': '>', '<': '<' }

// Turn a single atomic clause like "distance_rate>=50" into a readable phrase.
function renderClause(clause) {
  const m = clause.match(/^([a-zA-Z_]+)(>=|<=|==|!=|>|<)(-?[\w.]+)$/)
  if (!m) return clause
  const [, varName, op, value] = m
  const label = humanizeVarName(varName)
  return `${label} ${OP_LABEL[op] || op} ${value}`
}

// A condition string is AND-clauses joined by "&", with "@" separating
// alternative OR'd conditions (any one whole AND-group can trigger the skill).
function renderCondition(cond) {
  if (!cond) return ''
  return cond.split('@')
    .map(group => group.split('&').map(renderClause).join(' and '))
    .join('  OR  ')
}

function formatEffect(eff) {
  const value = eff.modifier / 10000
  const label = EFFECT_LABEL[eff.type] || `Effect Type ${eff.type}`
  if (eff.type === 9) return { label, text: `+${(value * 100).toFixed(1)}% HP` }
  if (eff.type === 31) return { label, text: `${value >= 0 ? '+' : ''}${value.toFixed(2)} m/s\u00b2` }
  if ([1, 21, 22, 27, 28].includes(eff.type)) return { label, text: `${value >= 0 ? '+' : ''}${value.toFixed(2)} m/s` }
  if ([2, 3, 4, 5].includes(eff.type)) return { label, text: `${value >= 0 ? '+' : ''}${Math.round(value * 10000)} pts` }
  return { label, text: `${value >= 0 ? '+' : ''}${value}` }
}

function categorize(id, effects) {
  if (/^\d{5}$/.test(id)) return 'unique'
  const types = new Set(effects.map(e => e.type))
  if (types.has(31)) return 'accel'
  if (types.has(2) || types.has(9)) return 'stamina'
  return 'speed'
}

const RARITY_LABEL = { 1: 'Normal', 2: 'Rare', 3: 'Unique', 4: 'Evolved', 5: 'Gold', 6: 'Gold' }

const out = []
for (const [id, alt] of Object.entries(skillData)) {
  const nameArr = names[id]
  if (!nameArr || !nameArr[0]) continue
  const name = nameArr[0]
  const alternatives = alt.alternatives || []
  if (!alternatives.length) continue

  // Use the first alternative for the headline effect/condition/duration; some
  // skills have multiple alternative trigger conditions with the same effect,
  // in which case we merge the readable condition text across all of them.
  const allEffects = alternatives[0].effects || []
  const category = categorize(id, allEffects)
  const effectsFormatted = allEffects.map(formatEffect)
  const conditionText = alternatives.map(a => renderCondition(a.condition)).filter(Boolean).join('  OR  ')
  const baseDurationSec = (alternatives[0].baseDuration || 0) / 10000

  out.push({
    id,
    name,
    category,
    rarity: alt.rarity,
    rarityLabel: RARITY_LABEL[alt.rarity] || String(alt.rarity),
    effects: effectsFormatted,
    conditionText,
    baseDurationSec,
    isJPOnly: /[\u3040-\u30ff\u4e00-\u9fff]/.test(name),
  })
}

out.sort((a, b) => a.name.localeCompare(b.name))

writeFileSync(
  path.join(dataDir, 'skill_sheet_full.json'),
  JSON.stringify(out, null, 2) + '\n',
)

const counts = out.reduce((m, s) => ((m[s.category] = (m[s.category] || 0) + 1), m), {})
console.log(`Wrote ${out.length} skills ->`, counts)
