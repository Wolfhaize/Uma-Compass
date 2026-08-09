// Add new entries to the TOP of this array. Newest first.
// date format: 'YYYY-MM-DD'
export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-08-09',
    notes: [
      'UI/UX: smaller base font sizes, top+bottom scrollbar on wide brackets, clearer Finals/Semifinals/Quarterfinals round labels, cleaned up delete-tournament button styling, beta tag in the browser tab.',
      'Tournaments: end/reopen a tournament without deleting it, a champion banner once finals are done, richer activity log detail, and Discord copy exports that now include uma names.',
      'Tracks & kits: added a 777m-remaining marker to track visuals, a Turf/Dirt filter in Strategy Planner, and an accuracy disclaimer + gametora link on the Uma Kit Library.',
      'Project housekeeping: real GitHub/Discord/Umalator links throughout, GPLv3 license added, docs cleaned up, and general code cleanup.',
    ],
  },
  {
    version: '1.1.0-prev',
    date: '2026-07-17',
    notes: [
      'Added a "My Umas" pool (save umas from the Uma Kit Library, mirrors the track pool).',
      'Draft Board now shows saved umas and flags recommended umas you already have.',
      'Added "Mark as taken" for tracks and umas — greys them out and excludes them from Draft Board recommendations.',
      'Added a freeform notes box to the Draft Board (autosaves).',
      'Strategy Planner now asks for confirmation before bulk-adding to your real draft pool.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-15',
    notes: [
      'Initial release: Track Database, Draft Board, Strategy Planner, Uma Kit Library, Skill Sheet.',
    ],
  },
]