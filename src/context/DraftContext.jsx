import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'

const DraftContext = createContext(null)

const STORAGE_KEY = 'draftCompass.selectedTracks.v1'
const UMA_STORAGE_KEY = 'draftCompass.selectedUmas.v1'
const TAKEN_TRACKS_KEY = 'draftCompass.takenTracks.v1'
const TAKEN_UMAS_KEY = 'draftCompass.takenUmas.v1'

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
  const [selectedUmaIds, setSelectedUmaIds] = useState(() => loadArray(UMA_STORAGE_KEY))
  const [takenTrackKeys, setTakenTrackKeys] = useState(() => loadArray(TAKEN_TRACKS_KEY))
  const [takenUmaIds, setTakenUmaIds] = useState(() => loadArray(TAKEN_UMAS_KEY))

  const persist = useCallback((keys) => {
    setSelectedKeys(keys)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)) } catch { /* ignore */ }
  }, [])

  const persistUmas = useCallback((ids) => {
    setSelectedUmaIds(ids)
    try { localStorage.setItem(UMA_STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
  }, [])

  const persistTakenTracks = useCallback((keys) => {
    setTakenTrackKeys(keys)
    try { localStorage.setItem(TAKEN_TRACKS_KEY, JSON.stringify(keys)) } catch { /* ignore */ }
  }, [])

  const persistTakenUmas = useCallback((ids) => {
    setTakenUmaIds(ids)
    try { localStorage.setItem(TAKEN_UMAS_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
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

  const toggleUma = useCallback((u) => {
    const id = u.cardId
    persistUmas(
      selectedUmaIds.includes(id)
        ? selectedUmaIds.filter(k => k !== id)
        : [...selectedUmaIds, id]
    )
  }, [selectedUmaIds, persistUmas])

  const isUmaSelected = useCallback((u) => selectedUmaIds.includes(u.cardId), [selectedUmaIds])

  const clearUmaSelection = useCallback(() => persistUmas([]), [persistUmas])

  const toggleTrackTaken = useCallback((t) => {
    const key = trackKey(t)
    persistTakenTracks(
      takenTrackKeys.includes(key)
        ? takenTrackKeys.filter(k => k !== key)
        : [...takenTrackKeys, key]
    )
  }, [takenTrackKeys, persistTakenTracks])

  const isTrackTaken = useCallback((t) => takenTrackKeys.includes(trackKey(t)), [takenTrackKeys])

  const toggleUmaTaken = useCallback((u) => {
    const id = u.cardId
    persistTakenUmas(
      takenUmaIds.includes(id)
        ? takenUmaIds.filter(k => k !== id)
        : [...takenUmaIds, id]
    )
  }, [takenUmaIds, persistTakenUmas])

  const isUmaTaken = useCallback((u) => takenUmaIds.includes(u.cardId), [takenUmaIds])

  const value = useMemo(() => ({
    selectedKeys, toggleTrack, isSelected, clearSelection, trackKey,
    selectedUmaIds, toggleUma, isUmaSelected, clearUmaSelection,
    takenTrackKeys, toggleTrackTaken, isTrackTaken,
    takenUmaIds, toggleUmaTaken, isUmaTaken,
  }), [
    selectedKeys, toggleTrack, isSelected, clearSelection,
    selectedUmaIds, toggleUma, isUmaSelected, clearUmaSelection,
    takenTrackKeys, toggleTrackTaken, isTrackTaken,
    takenUmaIds, toggleUmaTaken, isUmaTaken,
  ])

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useDraft() {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraft must be used within a DraftProvider')
  return ctx
}

export { trackKey }
