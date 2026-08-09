import React from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import Footer from './Footer.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/tracks', label: 'Track Database' },
  { to: '/draft-board', label: 'Draft Board' },
  { to: '/strategy', label: 'Strategy Planner' },
  { to: '/uma-kits', label: 'Uma Kit Library' },
  { to: '/tournaments', label: 'Tournaments' },
]

export default function Layout() {
  return (
    <div className="site">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav-inner">
          <Link to="/" className="site-title">Uma Compass</Link>
          <div className="nav-links">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
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
