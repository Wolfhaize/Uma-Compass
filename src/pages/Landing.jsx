import React from 'react'
import { Link } from 'react-router-dom'
import { useDraft } from '../context/DraftContext.jsx'
import { TrackIcon, BoardIcon, CompassIcon, UmaIcon, CalendarIcon } from '../components/icons.jsx'

const PANELS = [
  { to: '/tracks', title: 'Track Database', desc: 'Browse every track, filter by location/surface/type, and build your draft pool.', Icon: TrackIcon },
  { to: '/draft-board', title: 'Draft Board', desc: 'See your selected tracks, recommended umas and accels, and manage your picks.', Icon: BoardIcon },
  { to: '/strategy', title: 'Strategy Planner', desc: 'Filter by distance and accel focus to find the tracks and skills that matter.', Icon: CompassIcon },
  { to: '/uma-kits', title: 'Uma Kit Library', desc: 'Reference every uma\'s kit and save your own roster of picks.', Icon: UmaIcon },
  { to: '/schedule', title: 'Schedule', desc: 'Upcoming banners, a race/event calendar, and pull plans you can save.', Icon: CalendarIcon },
]

export default function Landing() {
  const { selectedKeys } = useDraft()
  const hasPool = selectedKeys.length > 0

  return (
    <div className="landing">
      <div className="landing-panel">
        <div className="landing-hero">
          <h1>Uma Compass</h1>
          <p className="subtitle">Your toolkit for drafts, tracks, kits, strategy, and pull planning.</p>
          <p className="landing-start-nudge">
            New here? {hasPool
              ? <>Head to your <Link to="/draft-board">Draft Board</Link> to see picks and recommendations.</>
              : <>Start at the <Link to="/tracks">Track Database</Link> to build a pool, or use the <Link to="/strategy">Strategy Planner</Link> if you already know your gameplan.</>}
          </p>
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
      </div>
    </div>
  )
}
