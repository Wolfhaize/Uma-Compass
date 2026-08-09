import React from 'react'
import { Link } from 'react-router-dom'
import { TrackIcon, BoardIcon, CompassIcon, UmaIcon, TrophyIcon } from '../components/icons.jsx'

const PANELS = [
  { to: '/tracks', title: 'Track Database', desc: 'Browse every track, filter by location/surface/type, and build your draft pool.', Icon: TrackIcon },
  { to: '/draft-board', title: 'Draft Board', desc: 'See your selected tracks, recommended umas and accels, and manage your picks.', Icon: BoardIcon },
  { to: '/strategy', title: 'Strategy Planner', desc: 'Filter by distance and accel focus to find the tracks and skills that matter.', Icon: CompassIcon },
  { to: '/uma-kits', title: 'Uma Kit Library', desc: 'Reference every uma\'s kit and save your own roster of picks.', Icon: UmaIcon },
  { to: '/tournaments', title: 'Tournaments', desc: 'Run brackets, groups, or leagues for server-wide 3v3v3 competitions.', Icon: TrophyIcon },
]

const AUTHOR_NAME = 'Wolfhaize'
const REPO_URL = 'https://github.com/Wolfhaize/Uma-Compass'
const DISCORD_URL = 'https://discord.gg/XD4w2PSAz7'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-panel">
        <div className="landing-hero">
          <h1>Uma Compass</h1>
          <p className="subtitle">Your toolkit for drafts, tracks, kits, strategy, and tournaments.</p>
        </div>

        <div className="landing-grid">
          {PANELS.map(({ to, title, desc, Icon }) => (
            <Link to={to} className="landing-card" key={to}>
              <span className="landing-card-icon"><Icon /></span>
              <span className="landing-card-title">{title}</span>
              <p className="landing-card-desc">{desc}</p>
            </Link>
          ))}
        </div>

        {/* <div className="landing-footer">
          <span className="footer-credit">
            Built by <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{AUTHOR_NAME}</a>
          </span>
          <div className="footer-links">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">Report an issue</a>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord</a>
            <Link to="/about">Changelog &amp; Notes</Link>
          </div>
        </div> */}
      </div>
    </div>
  )
}
