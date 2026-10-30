import React, { useMemo, useState, useEffect } from 'react'
import {
  CARAT_BANNERS,
  CLUB_RANKS,
  TEAM_TRIALS_RANKS,
  CHAMPIONS_MEETING_RANKS,
  LEAGUE_OF_HEROES_RANKS,
} from '../data/carat_data.js'
import { projectCarats, SINGLE_PULL_COST, TEN_PULL_COST } from '../utils/caratProjection.js'
import BackupControls from '../components/BackupControls.jsx'

const CALC_STORAGE_KEY = 'draftCompass.caratCalc.v1'

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(str) {
  const d = parseDate(str)
  if (!d) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function toInputDate(d) {
  return d.toISOString().slice(0, 10)
}

function loadCalc() {
  try {
    const raw = localStorage.getItem(CALC_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCalc(state) {
  try { localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Schedule section — banner calendar
// ---------------------------------------------------------------------------

function BannerCalendar() {
  const [showPast, setShowPast] = useState(false)
  const today = new Date()

  const rows = useMemo(() => {
    return CARAT_BANNERS
      .map(b => ({ ...b, _start: parseDate(b.start), _end: parseDate(b.end) }))
      .filter(b => showPast || !b._end || b._end >= today)
      .sort((a, b) => (a._start || 0) - (b._start || 0))
  }, [showPast])

  return (
    <>
      <div className="option-row">
        <button
          className={'option-btn' + (!showPast ? ' active' : '')}
          onClick={() => setShowPast(false)}
        >
          Upcoming
        </button>
        <button
          className={'option-btn' + (showPast ? ' active' : '')}
          onClick={() => setShowPast(true)}
        >
          All (incl. past)
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Banner</th>
              <th>Featured</th>
              <th>Start</th>
              <th>End</th>
              <th>Free Pulls</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b, i) => (
              <tr key={i}>
                <td>{b.name}</td>
                <td>{b.umas.join(', ')}</td>
                <td>{formatDate(b.start)}</td>
                <td>{formatDate(b.end)}</td>
                <td>{b.freePulls || '—'}</td>
                <td>{b.predicted ? <span className="chip">Predicted</span> : null}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="empty">Nothing to show.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Banner list pulled from umacaratcalculator.com. "Predicted" banners are estimates based on
        the JP schedule offset and may shift as the real EN date is confirmed.
      </p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Pull Plan section — carat calculator
// ---------------------------------------------------------------------------

function CaratCalculator() {
  const saved = useMemo(loadCalc, [])
  const [currentCarats, setCurrentCarats] = useState(saved?.currentCarats ?? 0)
  const [clubRankId, setClubRankId] = useState(saved?.clubRankId ?? CLUB_RANKS[0].name)
  const [teamTrialsRankId, setTeamTrialsRankId] = useState(saved?.teamTrialsRankId ?? TEAM_TRIALS_RANKS[0].name)
  const [cmRankId, setCmRankId] = useState(saved?.cmRankId ?? CHAMPIONS_MEETING_RANKS[CHAMPIONS_MEETING_RANKS.length - 1].name)
  const [lohRankId, setLohRankId] = useState(saved?.lohRankId ?? LEAGUE_OF_HEROES_RANKS[0].name)
  const [dailyMisc, setDailyMisc] = useState(saved?.dailyMisc ?? 0)
  const [targetBannerName, setTargetBannerName] = useState(saved?.targetBannerName ?? '')
  const [customDate, setCustomDate] = useState(saved?.customDate ?? '')

  useEffect(() => {
    saveCalc({ currentCarats, clubRankId, teamTrialsRankId, cmRankId, lohRankId, dailyMisc, targetBannerName, customDate })
  }, [currentCarats, clubRankId, teamTrialsRankId, cmRankId, lohRankId, dailyMisc, targetBannerName, customDate])

  const today = useMemo(() => new Date(), [])

  const upcomingBanners = useMemo(() => {
    return CARAT_BANNERS
      .map(b => ({ ...b, _start: parseDate(b.start) }))
      .filter(b => b._start && b._start >= today)
      .sort((a, b) => a._start - b._start)
  }, [today])

  const targetDate = useMemo(() => {
    if (customDate) {
      const d = new Date(customDate)
      if (!Number.isNaN(d.getTime())) return d
    }
    const banner = upcomingBanners.find(b => b.name === targetBannerName)
    return banner ? banner._start : null
  }, [customDate, targetBannerName, upcomingBanners])

  const clubIncome = CLUB_RANKS.find(r => r.name === clubRankId)?.income ?? 0
  const teamTrialsIncome = TEAM_TRIALS_RANKS.find(r => r.name === teamTrialsRankId)?.income ?? 0
  const cmIncome = CHAMPIONS_MEETING_RANKS.find(r => r.name === cmRankId)?.income ?? 0
  const lohIncome = LEAGUE_OF_HEROES_RANKS.find(r => r.name === lohRankId)?.income ?? 0

  const result = useMemo(() => {
    if (!targetDate) return null
    return projectCarats({
      currentCarats: Number(currentCarats) || 0,
      today,
      targetDate,
      clubIncome,
      teamTrialsIncome,
      cmIncome,
      lohIncome,
      dailyMisc: Number(dailyMisc) || 0,
      banners: CARAT_BANNERS,
    })
  }, [targetDate, currentCarats, clubIncome, teamTrialsIncome, cmIncome, lohIncome, dailyMisc, today])

  return (
    <>
      <div className="inline-form" style={{ flexWrap: 'wrap' }}>
        <label className="field">
          <span className="small muted">Current carats</span>
          <input
            type="number"
            min="0"
            value={currentCarats}
            onChange={e => setCurrentCarats(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="small muted">Club rank</span>
          <select value={clubRankId} onChange={e => setClubRankId(e.target.value)}>
            {CLUB_RANKS.map(r => <option key={r.name} value={r.name}>{r.name} ({r.income}/mo)</option>)}
          </select>
        </label>

        <label className="field">
          <span className="small muted">Team Trials finish</span>
          <select value={teamTrialsRankId} onChange={e => setTeamTrialsRankId(e.target.value)}>
            {TEAM_TRIALS_RANKS.map(r => <option key={r.name} value={r.name}>{r.name} ({r.income})</option>)}
          </select>
        </label>

        <label className="field">
          <span className="small muted">Champions Meeting finish</span>
          <select value={cmRankId} onChange={e => setCmRankId(e.target.value)}>
            {CHAMPIONS_MEETING_RANKS.map(r => <option key={r.name} value={r.name}>{r.name} ({r.income})</option>)}
          </select>
        </label>

        <label className="field">
          <span className="small muted">League of Heroes finish</span>
          <select value={lohRankId} onChange={e => setLohRankId(e.target.value)}>
            {LEAGUE_OF_HEROES_RANKS.map(r => <option key={r.name} value={r.name}>{r.name} ({r.income})</option>)}
          </select>
        </label>

        <label className="field">
          <span className="small muted">Other daily income (optional)</span>
          <input
            type="number"
            min="0"
            value={dailyMisc}
            onChange={e => setDailyMisc(e.target.value)}
          />
        </label>
      </div>

      <div className="inline-form" style={{ marginTop: 8 }}>
        <label className="field" style={{ flex: 2 }}>
          <span className="small muted">Project up to banner</span>
          <select
            value={targetBannerName}
            onChange={e => { setTargetBannerName(e.target.value); setCustomDate('') }}
          >
            <option value="">(pick an upcoming banner)</option>
            {upcomingBanners.map((b, i) => (
              <option key={i} value={b.name}>{b.name} — {formatDate(b.start)}</option>
            ))}
          </select>
        </label>
        <span className="small muted">or</span>
        <label className="field">
          <span className="small muted">Custom target date</span>
          <input
            type="date"
            value={customDate}
            min={toInputDate(today)}
            onChange={e => { setCustomDate(e.target.value); setTargetBannerName('') }}
          />
        </label>
      </div>

      {!targetDate && (
        <p className="muted small" style={{ marginTop: 12 }}>
          Pick a banner or a custom date above to see your projected carats.
        </p>
      )}

      {result && (
        <div className="board-section pull-plan-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>
            Projection to {formatDate(targetDate.toISOString())} ({result.days} days from today)
          </h3>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr><td>Starting carats</td><td>{Number(currentCarats).toLocaleString()}</td></tr>
                <tr><td>Club income ({result.breakdown.club.payouts} payouts)</td><td>+{result.breakdown.club.total.toLocaleString()}</td></tr>
                <tr><td>Team Trials income ({result.breakdown.teamTrials.payouts} payouts)</td><td>+{result.breakdown.teamTrials.total.toLocaleString()}</td></tr>
                <tr><td>Champions Meeting income ({result.breakdown.championsMeeting.payouts} payouts)</td><td>+{result.breakdown.championsMeeting.total.toLocaleString()}</td></tr>
                <tr><td>League of Heroes income ({result.breakdown.leagueOfHeroes.payouts} payouts)</td><td>+{result.breakdown.leagueOfHeroes.total.toLocaleString()}</td></tr>
                {Number(dailyMisc) > 0 && (
                  <tr><td>Other daily income</td><td>+{result.breakdown.misc.total.toLocaleString()}</td></tr>
                )}
                <tr>
                  <td>Free pulls from banners in range ({result.breakdown.freePulls.banners.length} banners)</td>
                  <td>+{result.breakdown.freePulls.total.toLocaleString()}</td>
                </tr>
                <tr className="total-row"><td><strong>Projected total</strong></td><td><strong>{result.projectedTotal.toLocaleString()}</strong></td></tr>
                <tr><td>Single pulls affordable ({SINGLE_PULL_COST}/pull)</td><td>{result.singlePullsAffordable.toLocaleString()}</td></tr>
                <tr><td>10-pulls affordable ({TEN_PULL_COST}/10-pull)</td><td>{result.tenPullsAffordable.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
          {result.breakdown.freePulls.banners.length > 0 && (
            <div className="chips" style={{ marginTop: 8 }}>
              {result.breakdown.freePulls.banners.map((b, i) => (
                <span className="chip" key={i}>{b.name} (+{b.freePulls})</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="board-section" style={{ marginTop: 16 }}>
        <h2>Backup</h2>
        <p className="muted small">Save your calculator inputs as a file, or load ones you exported earlier.</p>
        <BackupControls
          type="carat-calc"
          label="carat calculator settings"
          filenamePrefix="uma-compass-carat-calc"
          getExportData={() => ({ currentCarats, clubRankId, teamTrialsRankId, cmRankId, lohRankId, dailyMisc, targetBannerName, customDate })}
          onImport={(data) => {
            if (!data || typeof data !== 'object') return
            if ('currentCarats' in data) setCurrentCarats(data.currentCarats)
            if ('clubRankId' in data) setClubRankId(data.clubRankId)
            if ('teamTrialsRankId' in data) setTeamTrialsRankId(data.teamTrialsRankId)
            if ('cmRankId' in data) setCmRankId(data.cmRankId)
            if ('lohRankId' in data) setLohRankId(data.lohRankId)
            if ('dailyMisc' in data) setDailyMisc(data.dailyMisc)
            if ('targetBannerName' in data) setTargetBannerName(data.targetBannerName)
            if ('customDate' in data) setCustomDate(data.customDate)
          }}
        />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

export default function Schedule() {
  return (
    <div className="app">
      <header>
        <h1>Schedule</h1>
        <p className="subtitle">Upcoming banners and a carat calculator for planning your pulls.</p>
      </header>

      <section className="board-section">
        <h2>Banner Schedule</h2>
        <p className="muted small">
          Uma banners (with featured characters) and free-pull bonuses, pulled from the live
          umacaratcalculator.com dataset.
        </p>
        <BannerCalendar />
      </section>

      <section className="board-section">
        <h2>Pull Plan — Carat Calculator</h2>
        <p className="muted small">
          Enter your current carats and recurring income sources, then pick a banner (or a custom
          date) to see how many carats you'll have saved up and how many pulls that gets you.
        </p>
        <CaratCalculator />
      </section>
    </div>
  )
}
