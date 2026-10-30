// Generic JSON export/import helpers.
//
// Every file this app writes is tagged with an `app` + `type` signature so
// that importing can recognize which kind of file it is (and reject files
// that don't match) instead of blindly trusting whatever JSON the user picks.

const APP_TAG = 'uma-compass'

export function downloadJson(type, payload, filenamePrefix) {
  const envelope = {
    app: APP_TAG,
    type,
    version: 1,
    exportedAt: new Date().toISOString(),
    data: payload,
  }
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `${filenamePrefix}-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Reads a File, verifies its signature matches `expectedType`, and resolves
// with the inner `data` payload. Rejects with a human-readable message on
// any mismatch so the caller can show it directly to the user.
export function readJsonFile(file, expectedType) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      let parsed
      try {
        parsed = JSON.parse(reader.result)
      } catch {
        return reject(new Error('That file is not valid JSON.'))
      }
      if (!parsed || parsed.app !== APP_TAG) {
        return reject(new Error('That file was not exported from Uma Compass.'))
      }
      if (parsed.type !== expectedType) {
        return reject(new Error(`That file is a "${parsed.type || 'unknown'}" export, not a "${expectedType}" one.`))
      }
      if (parsed.data === undefined || parsed.data === null) {
        return reject(new Error('That file has no data in it.'))
      }
      resolve(parsed.data)
    }
    reader.readAsText(file)
  })
}
