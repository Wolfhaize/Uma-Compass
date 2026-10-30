// caratProjection.js
//
// Projects future carat totals from a starting balance + recurring income
// sources (club, team trials, champions meeting, league of heroes) plus any
// one-off banner free-pull bonuses, using the real banner schedule pulled
// from umacaratcalculator.com.
//
// A single "single pull" costs 150 carats, a 10-pull costs 1500.
export const SINGLE_PULL_COST = 150
export const TEN_PULL_COST = 1500

// Monthly cadence assumptions (days). These are approximations of Uma
// Musume Pretty Derby's global live-service cadence and are only used to
// spread recurring income across the days between "today" and a target date.
const CLUB_INTERVAL_DAYS = 30 // club rank payout, ~monthly
const TEAM_TRIALS_INTERVAL_DAYS = 14 // team trials, roughly biweekly rotation
const CM_INTERVAL_DAYS = 60 // champions meeting, roughly every 2 months
const LOH_INTERVAL_DAYS = 14 // league of heroes, roughly biweekly

/**
 * @param {object} opts
 * @param {number} opts.currentCarats - carats on hand right now
 * @param {Date} opts.today
 * @param {Date} opts.targetDate - date to project up to
 * @param {number} opts.clubIncome - carats per club payout (from CLUB_RANKS)
 * @param {number} opts.teamTrialsIncome - carats per team trials payout
 * @param {number} opts.cmIncome - carats per champions meeting finish
 * @param {number} opts.lohIncome - carats per league of heroes finish
 * @param {number} opts.dailyMisc - other daily income the player wants to add (missions, login, etc)
 * @param {Array<{start:string,end:string,freePulls:number}>} opts.banners - banner list
 */
export function projectCarats({
  currentCarats,
  today,
  targetDate,
  clubIncome = 0,
  teamTrialsIncome = 0,
  cmIncome = 0,
  lohIncome = 0,
  dailyMisc = 0,
  banners = [],
}) {
  const days = Math.max(0, Math.round((targetDate - today) / (1000 * 60 * 60 * 24)))

  const clubPayouts = Math.floor(days / CLUB_INTERVAL_DAYS)
  const teamTrialsPayouts = Math.floor(days / TEAM_TRIALS_INTERVAL_DAYS)
  const cmPayouts = Math.floor(days / CM_INTERVAL_DAYS)
  const lohPayouts = Math.floor(days / LOH_INTERVAL_DAYS)

  const fromClub = clubPayouts * clubIncome
  const fromTeamTrials = teamTrialsPayouts * teamTrialsIncome
  const fromCM = cmPayouts * cmIncome
  const fromLoH = lohPayouts * lohIncome
  const fromMisc = days * dailyMisc

  // Free pulls from banners land inside the window are converted to their
  // carat-equivalent (150 per pull) so they show up in the same total.
  const bannersInWindow = banners.filter(b => {
    const start = new Date(b.start)
    return start >= today && start <= targetDate
  })
  const fromFreePulls = bannersInWindow.reduce((sum, b) => sum + (b.freePulls || 0) * SINGLE_PULL_COST, 0)

  const totalIncome = fromClub + fromTeamTrials + fromCM + fromLoH + fromMisc + fromFreePulls
  const projectedTotal = currentCarats + totalIncome

  return {
    days,
    breakdown: {
      club: { payouts: clubPayouts, total: fromClub },
      teamTrials: { payouts: teamTrialsPayouts, total: fromTeamTrials },
      championsMeeting: { payouts: cmPayouts, total: fromCM },
      leagueOfHeroes: { payouts: lohPayouts, total: fromLoH },
      misc: { total: fromMisc },
      freePulls: { banners: bannersInWindow, total: fromFreePulls },
    },
    totalIncome,
    projectedTotal,
    singlePullsAffordable: Math.floor(projectedTotal / SINGLE_PULL_COST),
    tenPullsAffordable: Math.floor(projectedTotal / TEN_PULL_COST),
  }
}
