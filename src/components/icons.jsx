import React from 'react'

const base = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function TrackIcon(props) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="6.5" />
      <ellipse cx="12" cy="12" rx="4.2" ry="3" />
    </svg>
  )
}

export function BoardIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5v-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4.5" />
    </svg>
  )
}

export function CompassIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-6 2 2-6 6-2z" />
    </svg>
  )
}

export function UmaIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 20l1.2-6.5a4 4 0 0 1 1.6-2.6L11 8.2 9.6 5.4a1 1 0 0 1 1.5-1.3l3 2.7c1.6.3 3.4 1.5 4.4 3.2.6 1 .9 2.1.9 3.2v2.3l1.6 1a1 1 0 0 1-.5 1.8h-2.1l-.9 1.7" />
      <circle cx="15.5" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TrophyIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 4 9.9L7 11M17 5h2.5A2.5 2.5 0 0 1 20 9.9L17 11" />
      <path d="M12 13v3M9 20h6M9.5 20c0-1.7.7-2.7 2.5-3 1.8.3 2.5 1.3 2.5 3" />
    </svg>
  )
}
