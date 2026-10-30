import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import StrategyPlanner from './pages/StrategyPlanner.jsx'
import TrackDatabase from './pages/TrackDatabase.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StrategyPlanner />} />
        <Route path="/tracks" element={<TrackDatabase />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
