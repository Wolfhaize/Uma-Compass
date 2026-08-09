// umaProfiler.js
//
// Turns a character-cards.json entry into a "kit profile": how strong its
// naturally-available skill kit is in each of the 4 race phases, plus tags
// for the shapes of skills that matter for track fit, and its
// aptitude-derived best distances/surfaces/styles.

import { classifySkill, phaseAlignmentScore } from './skillClassifier.js'
import { ENABLE_SKILL_EVOLUTIONS } from '../config/features.js'

const APTITUDE_KEYS = ['turf', 'dirt', 'short', 'mile', 'medium', 'long', 'front', 'pace', 'late', 'end']
const GRADE_RANK = { S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 }

// Letter-grade -> color, used to badge every aptitude (not just the best
// one) wherever aptitudes are rendered. S reuses the gold accent already
// used for gold skills; A-G follow the requested orange/pink/green/
// light-blue/purple/grey scheme, with F given a slightly different grey
// than G so two low grades sitting next to each other don't visually merge.
export const APTITUDE_GRADE_COLOR = {
  S: '#d4af37',
  A: '#e08a3c',
  B: '#e06aa0',
  C: '#4caf6e',
  D: '#4fa8d8',
  E: '#9b6fd6',
  F: '#8a8f98',
  G: '#6b7078',
}

export const APTITUDE_GROUPS = [
  { label: 'Surface', keys: ['turf', 'dirt'] },
  { label: 'Distance', keys: ['short', 'mile', 'medium', 'long'] },
  { label: 'Style', keys: ['front', 'pace', 'late', 'end'] },
]

export const APTITUDE_KEY_LABEL = {
  turf: 'Turf', dirt: 'Dirt',
  short: 'Sprint', mile: 'Mile', medium: 'Medium', long: 'Long',
  front: 'Front', pace: 'Pace', late: 'Late', end: 'End',
}

// Growth-rate bonuses ("+X% stat growth") come straight from each card's
// own `stat_bonus` array in character-cards.json, in the fixed order
// [speed, stamina, power, guts, wisdom]. This is per-CARD (costume), which
// is what we want - previously these were looked up by character NAME in
// uma_growth_conditions.json, which meant every outfit sharing a name
// incorrectly got the same growth numbers. Reading stat_bonus directly off
// the card fixes that: each costume gets its own correct values.
export const GROWTH_STAT_KEYS = ['Speed', 'Stam', 'Power', 'Guts', 'Wit']

function normalizeUmaName(name) {
  return (name || '').trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
}

// Reads a card's own growth bonuses off its stat_bonus array. This is the
// source of truth for growth - accurate per costume, no name lookup needed.
export function resolveGrowth(card) {
  const bonus = card?.stat_bonus || []
  const growth = {}
  GROWTH_STAT_KEYS.forEach((k, i) => { growth[k] = bonus[i] || 0 })
  return growth
}

// uma_growth_conditions.json holds CONDITIONAL growth bonuses ("+X% stat
// growth under some condition", e.g. certain fan-count or event triggers).
// That data is keyed by character NAME, not card id, since the datamine
// doesn't say which specific costume a seasonal variant belongs to - so we
// keep it as separate supplementary info (growthCondition/growthVariants)
// rather than mixing it into the base per-card growth above.
export function resolveGrowthCondition(name, growthByName) {
  if (!growthByName) return { growthCondition: null, growthVariants: [] }
  const entries = growthByName[normalizeUmaName(name)]
  if (!entries || !entries.length) return { growthCondition: null, growthVariants: [] }
  const base = entries.find(e => e.variant === 'Base') || entries[0]
  return { growthCondition: base.condition || null, growthVariants: entries }
}

// Builds the { normalizedName: entries[] } lookup resolveGrowthCondition
// expects, straight from the raw uma_growth_conditions.json shape.
export function indexGrowthByName(rawGrowthConditions) {
  const out = {}
  for (const [name, entries] of Object.entries(rawGrowthConditions || {})) {
    out[normalizeUmaName(name)] = entries
  }
  return out
}

// A non-unique recovery skill only "counts" as a real (gold-tier) recovery
// skill if its heal/consumption-reduction value clears this bar. Below it
// are the filler white skills (e.g. modifier 150 -> value 0.015) that every
// third uma has and that don't meaningfully change how a track plays.
const GOLD_RECOVERY_VALUE_THRESHOLD = 0.03 // modifier >= ~300
const DEBUFF_VALUE_THRESHOLD = 0.03 // modifier > ~300, i.e. a "gold-tier" debuff

export function aptitudeMap(card) {
  const out = {}
  APTITUDE_KEYS.forEach((k, i) => { out[k] = card.aptitude?.[i] ?? 'G' })
  return out
}

function bestOf(apts, keys) {
  let bestRank = -1
  let best = []
  for (const k of keys) {
    const rank = GRADE_RANK[apts[k]] || 0
    if (rank > bestRank) { bestRank = rank; best = [k] }
    else if (rank === bestRank) best.push(k)
  }
  return { keys: best, grade: Object.entries(GRADE_RANK).find(([, r]) => r === bestRank)?.[0] || 'G' }
}

// Skill ids a card "naturally" has access to: its unique, its innate
// (default-learned) skills, and its white/awakening skills. Evolved
// ("skills_evo") variants are included too since they replace a base skill
// once conditions are met, but tagged separately so callers can weight them
// as upside rather than guaranteed kit.
export function kitSkillIds(card) {
  const baseCore = [
    ...(card.skills_unique || []),
    ...(card.skills_innate || []),
    ...(card.skills_awakening_en || card.skills_awakening || []),
  ].map(String)

  if (!ENABLE_SKILL_EVOLUTIONS) {
    // Evolutions aren't supported yet - fold each evolution's original
    // ("old") skill id into core kit as normal, and report no evo upside.
    const oldIds = (card.skills_evo || []).map(e => String(e.old))
    return { core: [...new Set([...baseCore, ...oldIds])], evo: [] }
  }

  const evo = (card.skills_evo || []).map(e => String(e.new))
  return { core: [...new Set(baseCore)], evo: [...new Set(evo)] }
}

function classifyKit(card, skillDataById, skillNamesById) {
  const { core, evo } = kitSkillIds(card)
  const allIds = [...new Set([...core, ...evo])]
  const uniqueIds = new Set((card.skills_unique || []).map(String))

  return allIds.map(id => {
    const data = skillDataById[id]
    const rarity = data?.rarity
    // Call classifySkill FIRST to get the classified object
    const classified = classifySkill(id, data)
    return {
      id,
      name: skillNamesById[id]?.[0] || skillNamesById[id] || id,
      isEvo: evo.includes(id) && !core.includes(id),
      isUnique: uniqueIds.has(id),
      isGold: !uniqueIds.has(id) && rarity === 2,
      isWhite: !uniqueIds.has(id) && rarity === 1,
      hasLastSpurt: classified.hasLastSpurt || false,
      ...classified,
    }
  })
}

// --- Tag rules ------------------------------------------------------------
// straightAccel / cornerAccel: an accel (or hybrid) skill/unique that can
//   fire in phase 2 (late race), split by whether it needs a corner or not.
// debuff: any debuff skill/unique, anywhere - no phase/corner restriction.
// finalSpurt: a velocity (or hybrid) skill/unique that can fire in phase 3.
// builtInRecovery: EITHER a unique with a recovery component, OR any
//   non-unique skill with a recovery component clearing the gold-tier bar.
function tagsFromSkillList(skills) {
  const straightAccel = skills.some(s => s.hasAccel && s.phases.includes(2) && s.corner !== 'corner')
  const cornerAccel = skills.some(s => s.hasAccel && s.phases.includes(2) && s.corner === 'corner')
  const debuff = skills.some(s => s.hasDebuff && (s.isUnique || (s.debuffValue || 0) > DEBUFF_VALUE_THRESHOLD))
  const finalSpurt = skills.some(s => s.hasVelocity && s.phases.includes(3))
  const lateRaceVelocity = skills.some(s => s.hasVelocity && s.phases.includes(2))
  const builtInRecovery = skills.some(s => s.hasRecovery && (s.isUnique || s.recoveryValue >= GOLD_RECOVERY_VALUE_THRESHOLD))
  return { straightAccel, cornerAccel, debuff, finalSpurt, lateRaceVelocity, builtInRecovery }
}

export function buildUmaProfile(card, skillDataById, skillNamesById, growthByName) {
  const classified = classifyKit(card, skillDataById, skillNamesById)
  const uniqueOnly = classified.filter(s => s.isUnique)

  const phaseScores = { 0: 0, 1: 0, 2: 0, 3: 0 }
  for (const skill of classified) {
    const weight = skill.isEvo ? 0.5 : 1
    for (const phase of [0, 1, 2, 3]) {
      phaseScores[phase] += weight * phaseAlignmentScore(skill, phase)
    }
  }

  const kit = tagsFromSkillList(classified)
  const unique = tagsFromSkillList(uniqueOnly)

  const tags = []
  if (kit.straightAccel) tags.push('Straight Accel')
  if (kit.cornerAccel) tags.push('Corner Accel')
  if (kit.debuff) tags.push('Debuff')
  if (kit.finalSpurt) tags.push('Final Spurt')
  if (kit.lateRaceVelocity) tags.push('Late Race Velocity')
  if (kit.builtInRecovery) tags.push('Built-in Recovery')

  const uniqueTags = []
  if (unique.straightAccel) uniqueTags.push('Straight Accel (Unique)')
  if (unique.cornerAccel) uniqueTags.push('Corner Accel (Unique)')

  const apts = aptitudeMap(card)
  const bestDistance = bestOf(apts, ['short', 'mile', 'medium', 'long'])
  const bestSurface = bestOf(apts, ['turf', 'dirt'])
  const bestStyle = bestOf(apts, ['front', 'pace', 'late', 'end'])
  const growth = resolveGrowth(card)
  const { growthCondition, growthVariants } = resolveGrowthCondition(card.name_en, growthByName)

  return {
    cardId: card.card_id,
    charId: card.char_id,
    name: card.name_en,
    title: card.title_en_gl || card.title,
    aptitudes: apts,
    bestDistance,
    bestSurface,
    bestStyle,
    phaseScores,
    tags,
    uniqueTags,
    growth,
    growthCondition,
    growthVariants,
    skills: classified,
  }
}

export function buildAllProfiles(cards, skillDataById, skillNamesById, rawGrowthConditions) {
  const growthByName = indexGrowthByName(rawGrowthConditions)
  return cards.map(c => buildUmaProfile(c, skillDataById, skillNamesById, growthByName))
}

export function rankByPhase(profiles, phase, limit = 10) {
  return [...profiles]
    .sort((a, b) => b.phaseScores[phase] - a.phaseScores[phase])
    .slice(0, limit)
}

export const PHASE_NAMES = {
  0: 'Early Race',
  1: 'Mid Race',
  2: 'Late Race',
  3: 'Last Spurt',
}

export function describePhase(phase) {
  const labels = {
    0: 'Early Race (wants acceleration)',
    1: 'Mid Race (wants velocity)',
    2: 'Late Race (wants acceleration)',
    3: 'Last Spurt (wants velocity)',
  }
  return labels[phase]
}
