// skillLookup.js
//
// "I want a uma that gets me Let's Pump Some Iron!" -> resolve a fuzzy
// skill-name query to skill id(s), then to the umas whose kit contains it.
// Backed by skillnames.json (id -> display name) + the precomputed uma
// profiles (id -> which umas carry it, and how).

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[☆★♡○◎×!！.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Find skill ids whose display name matches the query (substring, then
// falls back to a loose token-overlap match if nothing hits directly).
export function findSkillIdsByName(query, skillNamesById, limit = 8) {
  const q = normalize(query)
  if (!q) return []
  const entries = Object.entries(skillNamesById).map(([id, v]) => ({ id, name: Array.isArray(v) ? v[0] : v }))

  const exact = entries.filter(e => normalize(e.name) === q)
  if (exact.length) return exact.slice(0, limit)

  const substring = entries.filter(e => normalize(e.name).includes(q))
  if (substring.length) return substring.slice(0, limit)

  const qTokens = q.split(' ').filter(t => t.length > 2)
  const tokenMatches = entries
    .map(e => ({ ...e, hits: qTokens.filter(t => normalize(e.name).includes(t)).length }))
    .filter(e => e.hits > 0)
    .sort((a, b) => b.hits - a.hits)
  return tokenMatches.slice(0, limit)
}

// Given a resolved skill id, which uma profiles (from umaProfiler output)
// carry it, and is it core kit or an evo upside?
export function umasWithSkill(skillId, profiles) {
  const id = String(skillId)
  return profiles
    .map(p => ({ profile: p, skill: p.skills.find(s => s.id === id) }))
    .filter(x => x.skill)
    .sort((a, b) => (a.skill.isEvo === b.skill.isEvo ? 0 : a.skill.isEvo ? 1 : -1))
}

// One-shot: "pump some iron" -> [{ skillId, skillName, umas: [...] }]
export function recommendUmasForSkillQuery(query, skillNamesById, profiles, limit = 5) {
  const matches = findSkillIdsByName(query, skillNamesById, limit)
  return matches.map(m => ({
    skillId: m.id,
    skillName: m.name,
    umas: umasWithSkill(m.id, profiles).map(x => ({
      cardId: x.profile.cardId,
      name: x.profile.name,
      title: x.profile.title,
      isEvo: x.skill.isEvo,
      isUnique: x.skill.isUnique,
      isGold: x.skill.isGold,
      isWhite: x.skill.isWhite,
      hasData: x.skill.hasData,
      phases: x.skill.phases,
      corner: x.skill.corner,
      primaryType: x.skill.primaryType,
      distanceTrigger: x.skill.distanceTrigger,
      positionRequirement: x.skill.positionRequirement,
      velocityValue: x.skill.velocityValue,
      accelValue: x.skill.accelValue,
      recoveryValue: x.skill.recoveryValue,
      laneMoveValue: x.skill.laneMoveValue,
    })),
  }))
}
