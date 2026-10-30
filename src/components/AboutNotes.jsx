import React from 'react'
import { CHANGELOG } from '../data/changelog.js'
import { ENABLE_SCHEDULE, ENABLE_UMA_KITS } from '../config/features.js'

// "About" content, shown at the bottom of the home page (#about).
export default function AboutNotes() {
  return (
    <div id="about">
      <section className="board-section">
        <h2>How it works</h2>
        <div className="about-notes">
          <p>
            <strong>Strategy Planner</strong> (this page) lets you explore a hypothetical set of tracks
            by distance, accel shape, surface, accel skill and accel inherit uma without touching your
            real pool. "Add All to My Picks" asks for confirmation first, since it's the one action
            that writes into your actual draft pool.
          </p>
          <p>
            <strong>Track Database</strong> lists every course with its distance, surface, threshold,
            and last-spurt timing, plus the skills that tend to matter there. Tick a track to add it
            to your draft pool.
          </p>
          <p>
            <strong>Draft Board</strong> looks at every track currently in your pool and recommends
            skills and umas based on what shows up most often across them. Tracks or umas marked
            "taken" are excluded from recommendations but stay visible (greyed out). Draft Notes is a
            plain autosaving textarea for opponent reads, reminders, etc.
          </p>
          {ENABLE_UMA_KITS && (
            <p>
              <strong>Uma Kit Library</strong> is the reference for every uma's actual skill kit, and
              where you save umas to "My Umas" on the Draft Board.
            </p>
          )}
          {ENABLE_SCHEDULE && (
            <p>
              <strong>Schedule</strong> lists upcoming banners, the race/event calendar, and pull plans.
            </p>
          )}
          <p className="muted small">
            Everything is stored locally in your browser (no account, no server) — clearing browser
            data or switching devices resets it. Use Export/Import on the Draft Board to back up or
            move your pool.
          </p>
        </div>
      </section>

      <section className="board-section">
        <h2>Changelog</h2>
        <div className="changelog-list">
          {CHANGELOG.map(entry => (
            <div className="changelog-entry" key={entry.version}>
              <div className="changelog-entry-head">
                <span className="changelog-version">v{entry.version}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <ul>
                {entry.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
