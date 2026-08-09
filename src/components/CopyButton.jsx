import React, { useState } from 'react'

export default function CopyButton({ getText, label = 'Copy for Discord', className = '' }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  async function handleClick() {
    const text = typeof getText === 'function' ? getText() : getText
    if (!text) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setError(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError(true)
      setTimeout(() => setError(false), 1800)
    }
  }

  return (
    <button type="button" className={`copy-btn${copied ? ' copied' : ''}${error ? ' errored' : ''} ${className}`} onClick={handleClick}>
      {copied ? '✓ Copied' : error ? 'Copy failed' : `📋 ${label}`}
    </button>
  )
}
