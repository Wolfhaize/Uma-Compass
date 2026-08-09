// features.js
//
// Simple feature flags. Flip these when the underlying game data/feature is
// actually ready, rather than hunting down every place that would need to
// change.

// Skill "evolutions" (skills_evo in character-cards.json) upgrade a base
// skill into a stronger variant once conditions are met. We don't have real
// data/handling for the evolved ("new") skill ids yet - skillnames.json and
// skill_data.json only know about the original ("old") ids. Until evolutions
// are actually released/supported, keep this OFF: every uma's kit is built
// from the original skill ids only, with no "(evo)" tagging anywhere.
//
// When evolutions are ready to ship, flip this to true - kitSkillIds() and
// the UI will start treating the evolved id as the kit skill (tagged and
// weighted as upside) without any other code changes needed.
export const ENABLE_SKILL_EVOLUTIONS = false
