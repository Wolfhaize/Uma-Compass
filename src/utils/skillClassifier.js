// skillClassifier.js
//
// Turns raw skill_data.json into a structured classification:
// - Which race phase(s) a skill fires in
// - Whether it provides acceleration, velocity, recovery, or debuff
// - Where it triggers (corner, straight, final corner, final straight, etc.)
// - How reliable it is (deterministic vs RNG-gated)
//
// Race phases:
//   0 - Early race  -> wants ACCELERATION
//   1 - Mid race    -> wants VELOCITY
//   2 - Late race   -> wants ACCELERATION
//   3 - Final spurt -> wants VELOCITY

export const SkillType = {
  SpeedUp: 1,
  StaminaUp: 2,
  PowerUp: 3,
  GutsUp: 4,
  WisdomUp: 5,
  Recovery: 9,
  CurrentSpeed: 21,
  CurrentSpeedWithNaturalDeceleration: 22,
  TargetSpeed: 27,
  Accel: 31,
  ActivateRandomGold: 37,
}

export const EFFECT_FAMILY = {
  [SkillType.SpeedUp]: 'green',
  [SkillType.StaminaUp]: 'green',
  [SkillType.PowerUp]: 'green',
  [SkillType.GutsUp]: 'green',
  [SkillType.WisdomUp]: 'green',
  6: 'other',
  8: 'other',
  [SkillType.Recovery]: 'hp',
  10: 'reaction',
  13: 'other',
  [SkillType.CurrentSpeed]: 'speed_debuff',
  // Current Speed (with natural decay) is a distinct stat from Target Speed
  // (type 27) - it's an instant burst that bleeds off on its own rather
  // than a sustained target-speed increase, so it gets its own family/
  // bucket instead of being merged into 'velocity'. See e.g. Taiki
  // Shuttle's unique (110101), which stacks both a Target Speed AND a
  // Current Speed effect on the same activation.
  [SkillType.CurrentSpeedWithNaturalDeceleration]: 'current_speed',
  [SkillType.TargetSpeed]: 'velocity',
  28: 'lane_move',
  [SkillType.Accel]: 'accel',
  35: 'other',
  [SkillType.ActivateRandomGold]: 'other',
}

// Human-readable stat label for a debuff effect, keyed by the bucketed
// sourceFamily it came from (which type it was before the pos/neg split).
// Per the actual type ids in skill_data.json: Current Speed debuffs (type
// 21) and Accel debuffs (type 31) share the same numeric families as their
// positive counterparts - only the sign/target flips them into 'debuff'.
export const DEBUFF_STAT_LABEL = {
  speed_debuff: 'Current Speed',
  current_speed: 'Current Speed',
  velocity: 'Target Speed',
  accel: 'Accel',
  hp: 'Stamina',
}

export const GREEN_STAT_NAME = {
  [SkillType.SpeedUp]: 'Speed',
  [SkillType.StaminaUp]: 'Stamina',
  [SkillType.PowerUp]: 'Power',
  [SkillType.GutsUp]: 'Guts',
  [SkillType.WisdomUp]: 'Wisdom',
}

const RANDOM_TOKENS = [
  'phase_random', 'phase_laterhalf_random', 'phase_firsthalf_random',
  'phase_firstquarter_random', 'phase_corner_random', 'phase_straight_random',
  'phase_first_half_straight_random', 'phase_latter_half_straight_random',
  'corner_random', 'all_corner_random', 'is_finalcorner_random',
  'distance_rate_after_random', 'straight_random', 'last_straight_random',
  'up_slope_random', 'up_slope_random_later_half', 'down_slope_random',
  'run_at_full_speed_random', 'random_lot',
]

const PHASE_EXACT_KEYS = new Set([
  'phase_random', 'phase_laterhalf_random', 'phase_firsthalf_random',
  'phase_firstquarter_random', 'phase_corner_random', 'phase_straight_random',
  'phase_first_half_straight_random', 'phase_latter_half_straight_random',
  'phase_firsthalf', 'phase_laterhalf', 'phase_firstquarter',
])

const CORNER_KEYS = new Set([
  'corner_random', 'all_corner_random', 'phase_corner_random',
])

const STRAIGHT_KEYS = new Set([
  'straight_random', 'last_straight_random', 'phase_straight_random',
  'phase_first_half_straight_random', 'phase_latter_half_straight_random',
  'is_last_straight', 'is_last_straight_onetime', 'straight_front_type',
])

const RUNNING_STYLE_NAME = { 1: 'Front Runner', 2: 'Pace Chaser', 3: 'Late Surger', 4: 'End Closer' }

export function parseCondition(condition) {
  if (!condition) return []
  // Some skill conditions encode multiple OR'd trigger alternatives joined
  // by '@' (e.g. "phase>=2&corner!=0&is_finalcorner==0&...@phase==1&corner
  // !=0&is_finalcorner==1&..."). These are genuinely different activation
  // windows, not one combined AND condition - so parsing every clause from
  // every '@' segment together is wrong: a later segment's is_finalcorner
  // ==1 would bleed into an earlier segment's explicit is_finalcorner==0
  // and flip the derived trigger location. We classify off the first
  // (primary) segment only, matching how these skills are conventionally
  // described (e.g. Mejiro Dober's Moving Past, and Beyond is a "late race,
  // any corner but not the final one" skill, not a "final corner" skill -
  // its second @ segment is a secondary/earlier fallback window).
  const primarySegment = condition.split('@')[0]
  return primarySegment
    .split('&')
    .map(s => s.trim())
    .filter(Boolean)
    .map(clause => {
      const m = clause.match(/^([a-z_]+)(>=|<=|==|!=|>|<)(-?\d+)$/)
      if (!m) return { raw: clause }
      const [, key, op, value] = m
      return { key, op, value: Number(value) }
    })
}

function roundToTen(v) { return Math.round(v / 10) * 10 }

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function derivePhases(clauses) {
  const phases = new Set()
  let explicitPhase = false
  const hasExplicitPhaseClause = clauses.some(c => c.key === 'phase' || PHASE_EXACT_KEYS.has(c.key))

  for (const c of clauses) {
    if (c.raw === 'always') {
      phases.add('always')
      continue
    }

    if (c.key === 'phase') {
      explicitPhase = true
      const v = c.value
      if (c.op === '==') phases.add(v)
      else if (c.op === '>=') for (let p = v; p <= 3; p++) phases.add(p)
      else if (c.op === '<=') for (let p = 0; p <= v; p++) phases.add(p)
      else if (c.op === '>') for (let p = v + 1; p <= 3; p++) phases.add(p)
      else if (c.op === '<') for (let p = 0; p < v; p++) phases.add(p)
      continue
    }

    if (PHASE_EXACT_KEYS.has(c.key)) {
      explicitPhase = true
      phases.add(c.value)
      continue
    }

    // is_finalcorner -> Late Race (phase 2)
    if (['is_finalcorner', 'is_finalcorner_laterhalf', 'is_finalcorner_random'].includes(c.key) && c.value !== 0) {
      phases.add(2)
      continue
    }

    // is_lastspurt -> character spurt mode, can happen in Late Race or Last Spurt
    if (c.key === 'is_lastspurt' && c.value !== 0) {
      // This is a stamina state (see hasLastSpurt below for the display
      // marker), not a race-phase clock, so it doesn't set explicitPhase.
      // But per skill_conditions.json: last-spurt mode can only turn on
      // "after entering the Late-Race", so a skill gated on is_lastspurt
      // with no other phase clause can't fire any earlier than phase 2 -
      // add that as a floor rather than leaving it phase-less/"Random"
      // (e.g. Encroaching Shadow, "running_style==4&is_lastspurt==1&corner==0").
      if (!hasExplicitPhaseClause) phases.add(2)
      continue
    }

    // is_last_straight -> Final Straight = Last Spurt (phase 3)
    if (['is_last_straight', 'is_last_straight_onetime'].includes(c.key) && c.value !== 0) {
      phases.add(3)
      continue
    }

    // lastspurt is a stamina condition, not a phase - don't map it
    if (c.key === 'lastspurt') continue

    // remain_distance -> map remaining distance to phase
    if (c.key === 'remain_distance' && (c.op === '<=' || c.op === '<')) {
      const rounded = roundToTen(c.value)
      if (rounded <= 200) phases.add(3)
      else if (rounded <= 400) phases.add(2)
      else if (rounded <= 800) phases.add(1)
      else phases.add(0)
      continue
    }

    // distance_rate -> map race progression to phase
    if (c.key === 'distance_rate' && (c.op === '>=' || c.op === '>')) {
      if (c.value >= 80) phases.add(3)
      else if (c.value >= 60) phases.add(2)
      else if (c.value >= 30) phases.add(1)
      else phases.add(0)
    }
  }

  if (!explicitPhase && phases.size === 0) phases.add('always')
  return phases
}

export function deriveCornerFocus(clauses) {
  // Priority matters here: a skill can combine "is_finalcorner==1" (final
  // corner OR BEYOND - which includes the straight after it) with an
  // explicit "corner==0" (NOT currently on a corner). That combination
  // narrows the skill down to specifically the straight after the final
  // corner (e.g. King Halo's Wedding unique, "is_finalcorner==1&corner==0",
  // or Admire Vega's unique) - so an explicit corner==0 always wins over
  // any corner-ish flag, regardless of clause order in the condition
  // string. We scan every clause first instead of returning on the first
  // match, so order in the raw condition can't flip the result.
  let sawCornerZero = false
  let sawCornerFlag = false
  let sawStraightFlag = false

  for (const c of clauses) {
    if (c.key === 'corner') {
      if (c.op === '==' && c.value === 0) sawCornerZero = true
      else if (c.op === '!=' && c.value === 0) sawCornerFlag = true
      else if (c.op === '>=' && c.value >= 1) sawCornerFlag = true
      else if (c.op === '>' && c.value >= 0) sawCornerFlag = true
      continue
    }
    if (['is_finalcorner', 'is_finalcorner_laterhalf', 'is_finalcorner_random'].includes(c.key) && c.value !== 0) {
      sawCornerFlag = true
      continue
    }
    if (CORNER_KEYS.has(c.key)) { sawCornerFlag = true; continue }
    if (STRAIGHT_KEYS.has(c.key)) { sawStraightFlag = true; continue }
  }

  if (sawCornerZero) return 'straight'
  if (sawCornerFlag) return 'corner'
  if (sawStraightFlag) return 'straight'
  return 'any'
}

export function deriveReliability(condition, clauses) {
  if (condition === 'always') return 1
  const isRandom = RANDOM_TOKENS.some(tok => condition.includes(tok))
  const hasDeterministicGate = clauses.some(c => c.key && !RANDOM_TOKENS.includes(c.key))
  if (isRandom && !hasDeterministicGate) return 0.45
  if (isRandom) return 0.65
  return 0.9
}

export function deriveDistanceTrigger(clauses) {
  let lo = null, hi = null
  for (const c of clauses) {
    if (c.key !== 'remain_distance') continue
    if (c.op === '<=' || c.op === '<') hi = hi === null ? c.value : Math.min(hi, c.value)
    if (c.op === '>=' || c.op === '>') lo = lo === null ? c.value : Math.max(lo, c.value)
    if (c.op === '==') { lo = c.value; hi = c.value }
  }
  if (lo === null && hi === null) return null
  const center = lo !== null && hi !== null ? (lo + hi) / 2 : (hi !== null ? hi : lo)
  const meters = roundToTen(center)
  return { meters, isWindow: lo !== null && hi !== null && hi - lo <= 10, lo, hi }
}

export function derivePositionRequirement(clauses) {
  let orderMin = null, orderMax = null
  let rateMin = null, rateMax = null
  const styles = new Set()

  for (const c of clauses) {
    if (c.key === 'order') {
      if (c.op === '<=' || c.op === '<') orderMax = orderMax === null ? c.value : Math.min(orderMax, c.value)
      if (c.op === '>=' || c.op === '>') orderMin = orderMin === null ? c.value : Math.max(orderMin, c.value)
      if (c.op === '==') { orderMin = c.value; orderMax = c.value }
    }
    if (c.key === 'order_rate') {
      if (c.op === '<=' || c.op === '<') rateMax = rateMax === null ? c.value : Math.min(rateMax, c.value)
      if (c.op === '>=' || c.op === '>') rateMin = rateMin === null ? c.value : Math.max(rateMin, c.value)
      if (c.op === '==') { rateMin = c.value; rateMax = c.value }
    }
    if (c.key === 'running_style' && c.op === '==' && RUNNING_STYLE_NAME[c.value]) {
      styles.add(RUNNING_STYLE_NAME[c.value])
    }
  }

  if (orderMin === null && orderMax === null && rateMin === null && rateMax === null && styles.size === 0) {
    return null
  }

  const parts = []
  if (orderMin !== null && orderMax !== null && orderMin === orderMax) {
    parts.push(`${ordinal(orderMin)} place`)
  } else if (orderMin !== null && orderMax !== null) {
    parts.push(`${ordinal(orderMin)}-${ordinal(orderMax)} place`)
  } else if (orderMax !== null) {
    parts.push(`${ordinal(orderMax)} place or better`)
  } else if (orderMin !== null) {
    parts.push(`${ordinal(orderMin)} place or worse`)
  }
  if (rateMin !== null && rateMax !== null && rateMin === rateMax) {
    parts.push(`exactly ${rateMax}% back in the field`)
  } else if (rateMax !== null) {
    parts.push(`top ${rateMax}% of the field`)
    if (rateMin !== null) parts.push(`(no closer than top ${rateMin}%)`)
  } else if (rateMin !== null) {
    parts.push(`back ${100 - rateMin}% of the field`)
  }
  if (styles.size) parts.push(`${[...styles].join('/')} only`)

  return {
    orderMin, orderMax, rateMin, rateMax,
    styles: [...styles],
    label: parts.join(', '),
  }
}

function bucketEffect(e) {
  const family = EFFECT_FAMILY[e.type] || 'other'
  const isSelf = e.target === 1
  const value = e.modifier / 10000

  if (family === 'velocity' || family === 'accel' || family === 'current_speed') {
    if (e.modifier < 0 || !isSelf) return { bucket: 'debuff', value: Math.abs(value), sourceFamily: family }
    if (family === 'current_speed') return { bucket: 'currentSpeed', value, sourceFamily: family }
    return { bucket: family, value, sourceFamily: family }
  }
  if (family === 'lane_move') {
    return { bucket: 'laneMove', value, sourceFamily: family }
  }
  if (family === 'speed_debuff') {
    return { bucket: 'debuff', value: Math.abs(value), sourceFamily: 'speed_debuff' }
  }
  if (family === 'reaction') {
    return { bucket: 'reaction', value, sourceFamily: family }
  }
  if (family === 'hp') {
    if (isSelf && e.modifier > 0) return { bucket: 'recovery', value, sourceFamily: family }
    return { bucket: 'debuff', value: Math.abs(value), sourceFamily: family }
  }
  if (family === 'green') {
    return { bucket: 'green', value, sourceFamily: family, statName: GREEN_STAT_NAME[e.type] }
  }
  return { bucket: 'other', value, sourceFamily: family }
}

export function classifyAlternative(alt) {
  const clauses = parseCondition(alt.condition)
  const phases = derivePhases(clauses)
  const corner = deriveCornerFocus(clauses)
  const reliability = deriveReliability(alt.condition, clauses)
  const distanceTrigger = deriveDistanceTrigger(clauses)
  const positionRequirement = derivePositionRequirement(clauses)

  let triggerLocation = 'any'
  let hasFinalCorner = false
  let hasLastStraight = false
  let hasCornerRestriction = false
  let hasStraightRestriction = false
  let hasLastSpurt = false

  for (const c of clauses) {
    if (['is_finalcorner', 'is_finalcorner_laterhalf', 'is_finalcorner_random'].includes(c.key) && c.value !== 0) {
      hasFinalCorner = true
    }
    if (['is_last_straight', 'is_last_straight_onetime'].includes(c.key) && c.value !== 0) {
      hasLastStraight = true
    }
    if (c.key === 'corner' && c.op === '!=' && c.value === 0) {
      hasCornerRestriction = true
    }
    if (c.key === 'corner' && c.op === '==' && c.value === 0) {
      hasStraightRestriction = true
    }

     if (c.key === 'is_lastspurt' && c.value !== 0) {
      hasLastSpurt = true
    }

    if (c.key === 'straight_front_type' && c.value === 2) {
      triggerLocation = 'back_straight'
    }
    if (c.key === 'straight_front_type' && c.value === 1) {
      triggerLocation = 'front_straight'
    }
    if (c.key === 'slope' && c.value === 1) {
      triggerLocation = 'uphill'
    }
    if (c.key === 'slope' && c.value === 2) {
      triggerLocation = 'downhill'
    }
    if (c.key === 'all_corner_random' || c.key === 'corner_random') {
      triggerLocation = 'corner'
    }
    if (c.key === 'straight_random') {
      triggerLocation = 'straight'
    }
  }

  // Determine final trigger location based on condition combination
  if (hasFinalCorner) {
    if (hasCornerRestriction) {
      triggerLocation = 'final_corner'
    } else if (hasStraightRestriction) {
      triggerLocation = 'final_straight'
    } else if (hasLastStraight) {
      triggerLocation = 'final_corner_or_straight'
    } else {
      triggerLocation = 'final_corner_or_later'
    }
  } else if (hasLastStraight) {
    triggerLocation = 'last_straight'
  } else if (triggerLocation === 'any' && corner !== 'any') {
    // No is_finalcorner/is_last_straight/etc keyword fired above, but there
    // was still a bare corner==0 or corner!=0 restriction (e.g. Encroaching
    // Shadow, "running_style==4&is_lastspurt==1&corner==0") - that's a real
    // straight/corner gate, just not tied to a specific corner/straight, so
    // it should show as plain "Straight"/"Corner" rather than "Anywhere".
    triggerLocation = corner
  }

  if (triggerLocation === 'any' && distanceTrigger) {
    triggerLocation = 'distance'
  }
  if (corner === 'distance') triggerLocation = 'distance'

  const effects = (alt.effects || []).map(e => ({ ...e, ...bucketEffect(e) }))
  const velocity = effects.filter(e => e.bucket === 'velocity')
  const accel = effects.filter(e => e.bucket === 'accel')
  const currentSpeed = effects.filter(e => e.bucket === 'currentSpeed')
  const recovery = effects.filter(e => e.bucket === 'recovery')
  const debuff = effects.filter(e => e.bucket === 'debuff')
  const green = effects.filter(e => e.bucket === 'green')
  const reaction = effects.filter(e => e.bucket === 'reaction')
  const laneMove = effects.filter(e => e.bucket === 'laneMove')

  let primaryType = 'other'
  if ((velocity.length || currentSpeed.length) && accel.length) primaryType = 'hybrid'
  else if (velocity.length || currentSpeed.length) primaryType = 'velocity'
  else if (accel.length) primaryType = 'accel'
  else if (recovery.length) primaryType = 'recovery'
  else if (reaction.length) primaryType = 'reaction'
  else if (debuff.length) primaryType = 'debuff'
  else if (green.length) primaryType = 'green'
  else if (laneMove.length) primaryType = 'position'

  let timing = null
  if (primaryType === 'green') {
    phases.clear()
    phases.add(0)
    triggerLocation = 'instant'
    timing = 'instant'
  } else if (primaryType === 'reaction') {
    phases.clear()
    phases.add(0)
    triggerLocation = 'start'
    timing = 'start'
  }

  const sum = list => list.reduce((s, e) => s + Math.abs(e.value), 0)
  const totalModifier = (alt.effects || []).reduce((s, e) => s + Math.abs(e.modifier || 0), 0)
  const greenStats = green.map(e => ({ stat: e.statName, value: e.value }))

  // Per-stat debuff breakdown (Speed/Current Speed/Accel/Stamina), summed
  // when a single skill debuffs the same stat via more than one effect.
  const debuffBreakdown = []
  for (const e of debuff) {
    const stat = DEBUFF_STAT_LABEL[e.sourceFamily] || 'Other'
    const existing = debuffBreakdown.find(d => d.stat === stat)
    if (existing) existing.value += e.value
    else debuffBreakdown.push({ stat, value: e.value })
  }

  return {
    phases: [...phases],
    corner,
    triggerLocation,
    hasLastSpurt,
    timing,
    reliability,
    primaryType,
    totalModifier,
    distanceTrigger,
    positionRequirement,
    condition: alt.condition,
    hasVelocity: velocity.length > 0 || currentSpeed.length > 0,
    hasAccel: accel.length > 0,
    hasCurrentSpeed: currentSpeed.length > 0,
    hasRecovery: recovery.length > 0,
    hasDebuff: debuff.length > 0,
    hasLaneMove: laneMove.length > 0,
    hasGreen: green.length > 0,
    hasReaction: reaction.length > 0,
    velocityValue: sum(velocity),
    accelValue: sum(accel),
    currentSpeedValue: sum(currentSpeed),
    recoveryValue: sum(recovery),
    debuffValue: sum(debuff),
    debuffBreakdown,
    laneMoveValue: sum(laneMove),
    reactionValue: sum(reaction),
    greenStats,
    effects,
  }
}

export function classifySkill(skillId, entry) {
  if (!entry || !entry.alternatives || entry.alternatives.length === 0) {
    return {
      id: skillId,
      phases: ['unknown'],
      corner: 'unknown',
      triggerLocation: 'unknown',
      timing: null,
      reliability: 0,
      primaryType: 'unknown',
      totalModifier: 0,
      distanceTrigger: null,
      positionRequirement: null,
      hasLastSpurt: false,
      hasVelocity: false,
      hasAccel: false,
      hasCurrentSpeed: false,
      hasRecovery: false,
      hasDebuff: false,
      hasLaneMove: false,
      hasGreen: false,
      hasReaction: false,
      velocityValue: 0,
      accelValue: 0,
      currentSpeedValue: 0,
      recoveryValue: 0,
      debuffValue: 0,
      debuffBreakdown: [],
      laneMoveValue: 0,
      reactionValue: 0,
      greenStats: [],
      effects: [],
      rarity: entry?.rarity ?? 0,
      hasData: false,
    }
  }
  const base = classifyAlternative(entry.alternatives[0])
  return {
    id: skillId,
    rarity: entry.rarity,
    hasLastSpurt: base.hasLastSpurt,
    wisdomCheck: entry.wisdomCheck,
    hasData: true,
    ...base,
  }
}

export const PHASE_WANTS = { 0: 'accel', 1: 'velocity', 2: 'accel', 3: 'velocity' }

export function phaseAlignmentScore(classification, phase) {
  const { phases, primaryType, reliability, totalModifier } = classification
  if (primaryType !== 'velocity' && primaryType !== 'accel' && primaryType !== 'hybrid') return 0
  if (!phases.includes(phase) && !phases.includes('always')) return 0

  const wants = PHASE_WANTS[phase]
  let typeMatch = 0
  if (primaryType === wants) typeMatch = 1
  else if (primaryType === 'hybrid') typeMatch = 0.5
  else typeMatch = 0

  const magnitude = Math.min(1, totalModifier / 4000)
  return typeMatch * reliability * (0.5 + 0.5 * magnitude)
}