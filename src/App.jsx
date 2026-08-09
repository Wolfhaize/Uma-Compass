import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import TrackDatabase from './pages/TrackDatabase.jsx'
import DraftBoard from './pages/DraftBoard.jsx'
import StrategyPlanner from './pages/StrategyPlanner.jsx'
import UmaKitLibrary from './pages/UmaKitLibrary.jsx'
import About from './pages/About.jsx'
import Tournaments from './pages/Tournaments.jsx'
import TournamentDetail from './pages/TournamentDetail.jsx'
import Landing from './pages/Landing.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/tracks" element={<TrackDatabase />} />
        <Route path="/draft-board" element={<DraftBoard />} />
        <Route path="/strategy" element={<StrategyPlanner />} />
        <Route path="/uma-kits" element={<UmaKitLibrary />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}
