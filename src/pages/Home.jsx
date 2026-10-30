import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import StrategyPlanner from './StrategyPlanner.jsx'
import AboutNotes from '../components/AboutNotes.jsx'

// Home = the Strategy Planner, with About / changelog underneath.
export default function Home() {
  const { hash } = useLocation()

  // Footer "Changelog & Notes" links to /#about; scroll there.
  useEffect(() => {
    if (hash === '#about') {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash])

  return (
    <>
      <StrategyPlanner />
      <div className="app">
        <AboutNotes />
      </div>
    </>
  )
}
