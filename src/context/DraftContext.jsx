import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'

const DraftContext = createContext(null)

const STORAGE_KEY = 'draftCompass.selectedTracks.v1'
const TAKEN_TRACKS_KEY = 'draftCompass.takenTracks.v1'

function loadArray(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function trackKey(t) {
  return `${t.location}__${t.distance}__${t.surface}`
}

export function DraftProvider({ children }) {
  const [selectedKeys, setSelectedKeys] = useState(() => loadArray(STORAGE_KEY))
  const [takenTrackKeys, setTakenTrackKeys] = useState(() => loadArray(TAKEN_TRACKS_KEY))
  const [picksOpen, setPicksOpen] = useState(false) // "My Picks" slide-out panel

  const persist = useCallback((keys) => {
    setSelectedKeys(keys)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)) } catch { /* ignore */ }
  }, [])

  const persistTakenTracks = useCallback((keys) => {
    setTakenTrackKeys(keys)
    try { localStorage.setItem(TAKEN_TRACKS_KEY, JSON.stringify(keys)) } catch { /* ignore */ }
  }, [])

  const toggleTrack = useCallback((t) => {
    const key = trackKey(t)
    persist(
      selectedKeys.includes(key)
        ? selectedKeys.filter(k => k !== key)
        : [...selectedKeys, key]
    )
  }, [selectedKeys, persist])

  const isSelected = useCallback((t) => selectedKeys.includes(trackKey(t)), [selectedKeys])

  const clearSelection = useCallback(() => persist([]), [persist])

  const toggleTrackTaken = useCallback((t) => {
    const key = trackKey(t)
    persistTakenTracks(
      takenTrackKeys.includes(key)
        ? takenTrackKeys.filter(k => k !== key)
        : [...takenTrackKeys, key]
    )
  }, [takenTrackKeys, persistTakenTracks])

  const isTrackTaken = useCallback((t) => takenTrackKeys.includes(trackKey(t)), [takenTrackKeys])

  const value = useMemo(() => ({
    selectedKeys, toggleTrack, isSelected, clearSelection, trackKey,
    takenTrackKeys, toggleTrackTaken, isTrackTaken,
    picksOpen, setPicksOpen,
  }), [
    selectedKeys, toggleTrack, isSelected, clearSelection,
    takenTrackKeys, toggleTrackTaken, isTrackTaken,
    picksOpen,
  ])

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useDraft() {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraft must be used within a DraftProvider')
  return ctx
}

export { trackKey }
