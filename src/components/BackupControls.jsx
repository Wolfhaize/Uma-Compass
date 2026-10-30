import React, { useRef, useState } from 'react'
import { downloadJson, readJsonFile } from '../utils/backup.js'

// type: the signature tag used to recognize this file on import (e.g. 'draft-pool', 'pull-plans')
// getExportData: () => plain-object payload to write out
// onImport: (data) => void — called with the validated payload after a successful import
// filenamePrefix: used to name the downloaded file
export default function BackupControls({ type, getExportData, onImport, filenamePrefix, label = 'data' }) {
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState(null) // { kind: 'error' | 'success', text }

  function handleExport() {
    downloadJson(type, getExportData(), filenamePrefix)
    setMessage({ kind: 'success', text: `${label} exported.` })
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    try {
      const data = await readJsonFile(file, type)
      onImport(data)
      setMessage({ kind: 'success', text: `${label} imported.` })
    } catch (err) {
      setMessage({ kind: 'error', text: err.message })
    }
  }

  return (
    <div className="backup-controls">
      <button type="button" className="backup-btn" onClick={handleExport}>Export {label}</button>
      <button type="button" className="backup-btn" onClick={handleImportClick}>Import {label}</button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="sr-only-input"
        onChange={handleFileChange}
      />
      {message && (
        <span className={'backup-message backup-message-' + message.kind}>{message.text}</span>
      )}
    </div>
  )
}
