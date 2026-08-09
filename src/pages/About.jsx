import React from 'react'
import { CHANGELOG } from '../data/changelog.js'

export default function About() {
  return (
    <div className="app">
      <header>
        <h1>About</h1>
        <p className="subtitle">How this thing works, and what's changed over time.</p>
      </header>

      <section className="board-section">
        <h2>How it works</h2>
        <div className="about-notes">
          <p>
            <strong>Track Database</strong> lists every course with its distance, surface, threshold,
            and last-spurt timing, plus the skills that tend to matter there.
          </p>
          <p>
            <strong>Draft Pool</strong> — tick a track (or save an uma from the Uma Kit Library) to
            add it to your pool. Selections persist in your browser's local storage, so they'll still
            be there next time you open the site on the same device/browser. They won't follow you to
            a different device.
          </p>
          <p>
            <strong>Draft Board</strong> looks at every track currently in your pool and recommends
            skills and umas based on what shows up most often across them, plus kit matches — umas
            whose own skill kit naturally covers something your track pool wants. Tracks or umas marked
            "taken" are excluded from these recommendations, but stay visible (greyed out) for reference.
          </p>
          <p>
            <strong>Strategy Planner</strong> lets you explore a hypothetical set of tracks (by distance
            / accel focus) without touching your real pool. "Add All to My Picks" asks for confirmation
            first, since it's the one action that writes into your actual draft pool.
          </p>
          <p>
            <strong>Draft Notes</strong> on the Draft Board is just a plain textarea for anything that
            doesn't fit neatly into tracks or umas — opponent reads, reminders, etc. It autosaves as
            you type.
          </p>
          <p className="muted small">
            Everything here is stored locally in your browser (no account, no server-side database) —
            clearing your browser data or switching browsers/devices will reset it.
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
