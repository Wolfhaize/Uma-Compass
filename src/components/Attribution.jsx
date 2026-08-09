import React from 'react'

// Edit the `href` values below to point at the original source for each tool.
export default function Attribution({ label, href = '#' }) {
  return (
    <div className="attribution">
      Source data compiled from{' '}
      <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
      {' '}— all credit to the original author(s).
    </div>
  )
}
