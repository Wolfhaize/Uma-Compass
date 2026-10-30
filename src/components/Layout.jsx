import React from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import Footer from './Footer.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Strategy Planner', end: true },
  { to: '/tracks', label: 'Track Database' },
]

export default function Layout() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="site">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav-inner">
          <Link to="/" className="site-title" onClick={() => setOpen(false)}>
            <img src="/tazuna-modified.png" alt="Uma Compass Logo" className="site-logo" />
          Uma Compass</Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primary-nav-links"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(o => !o)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>
          <div className={'nav-links' + (open ? ' nav-links-open' : '')} id="primary-nav-links">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="site-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
