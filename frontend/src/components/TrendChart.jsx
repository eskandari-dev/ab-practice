import { useId, useState } from 'react'
import { fill } from '../regions-data.js'
import { ClockIcon } from './Icons.jsx'

const GRID = [0, 25, 50, 75, 100]

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m + ':' + String(s).padStart(2, '0')
}

// items: [{ number, percent, passed, score, total, seconds, date }] oldest first
function TrendChart({ items, passPercent, lang, t, all }) {
  const gradientId = useId()
  const [active, setActive] = useState(null)

  // keep points away from the edges so the first and last ones are not cut off
  const xOf = (i) => (items.length === 1 ? 50 : 3 + (i / (items.length - 1)) * 94)
  const points = items.map((item, i) => [xOf(i), 100 - item.percent])
  const line = points.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' ')
  const area = points.length > 1
    ? `M${points[0][0]},100 ` + points.map(([x, y]) => `L${x},${y}`).join(' ') + ` L${points[points.length - 1][0]},100 Z`
    : ''

  // with many exams only some numbers fit under the chart
  const labelEvery = Math.ceil(items.length / 10)
  const shown = items[active]

  return (
    <div className="trend" dir="ltr">
      <div className="trend-y" aria-hidden="true">
        {GRID.map((g) => <span key={g} style={{ bottom: g + '%' }}>{g}%</span>)}
      </div>

      <div className="trend-body">
        <div className="trend-plot" onMouseLeave={() => setActive(null)}>
          {GRID.map((g) => <div key={g} className="trend-grid" style={{ bottom: g + '%' }} />)}
          <div className="trend-pass" style={{ bottom: passPercent + '%' }}>
            <span>{t.passLine} {passPercent}%</span>
          </div>

          <svg className="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.28 }} />
                <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {area && <path d={area} fill={`url(#${gradientId})`} />}
            {points.length > 1 && <path d={line} className="trend-line" vectorEffect="non-scaling-stroke" />}
          </svg>

          {items.map((item, i) => (
            <button
              key={item.number}
              type="button"
              className={'trend-point' + (item.passed ? ' is-pass' : '') + (active === i ? ' is-active' : '')}
              style={{ left: xOf(i) + '%', bottom: item.percent + '%' }}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={fill(t.examNumber, item.number) + ': ' + item.percent + '%'}
            />
          ))}

          {shown && (
            <div
              className={
                'trend-tip' +
                (xOf(active) < 18 ? ' tip-left' : '') +
                (xOf(active) > 82 ? ' tip-right' : '') +
                (shown.percent > 70 ? ' tip-below' : '')
              }
              style={{ left: xOf(active) + '%', bottom: shown.percent + '%' }}
              role="status"
            >
              <strong>{fill(t.examNumber, shown.number)}</strong>
              <span className="trend-tip-date">
                {new Date(shown.date).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
              </span>
              <span className="trend-tip-score">
                {shown.percent}% <small>({shown.score}/{shown.total})</small>
              </span>
              {shown.seconds ? <span className="trend-tip-time"><ClockIcon /> {formatTime(shown.seconds)}</span> : null}
              <span className={'result-badge' + (shown.passed ? ' result-pass' : '')}>
                {shown.passed ? all.practice.passed : all.practice.failed}
              </span>
            </div>
          )}
        </div>

        <div className="trend-x" aria-hidden="true">
          {items.map((item, i) =>
            i % labelEvery === 0 || i === items.length - 1 ? (
              <span key={item.number} style={{ left: xOf(i) + '%' }}>{item.number}</span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  )
}

export default TrendChart
