import React from 'react'

export default function StandingsTable({ standings, highlightTop = 0, title }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Pts</th>
            <th>Races</th>
            <th>1st</th>
            <th>2nd</th>
            <th>3rd</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.playerId} className={
              (i === 0 ? 'standings-row-gold' : i === 1 ? 'standings-row-silver' : i === 2 ? 'standings-row-bronze' : '') +
              (highlightTop && i < highlightTop ? ' standings-row-qualified' : '') +
              (!s.active ? ' row-taken' : '')
            }>
              <td>{i + 1}</td>
              <td>{s.name}{!s.active && <span className="muted small"> (out)</span>}</td>
              <td><b>{s.points}</b></td>
              <td>{s.races}</td>
              <td>{s.firsts}</td>
              <td>{s.seconds}</td>
              <td>{s.thirds}</td>
            </tr>
          ))}
          {!standings.length && <tr><td colSpan={7} className="empty">No results recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
