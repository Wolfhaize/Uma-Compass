import React from 'react'
import { Link } from 'react-router-dom'

const AUTHOR_NAME = 'Wolfhaize'
const REPO_URL = 'https://github.com/Wolfhaize/Uma-Compass'
const DISCORD_URL = 'https://discord.gg/XD4w2PSAz7'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span className="footer-credit">
          Built by <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{AUTHOR_NAME}</a>
        </span>
        <div className="footer-links">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">Report an issue</a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord</a>
          <Link to="/about">Changelog &amp; Notes</Link>
        </div>
      </div>
    </footer>
  )
}
