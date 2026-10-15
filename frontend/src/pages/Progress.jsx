import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { findPlace, getSavedRegion } from '../places.js'
import { computeStats, getAllMistakes, useHistory } from '../progress.js'
import { fill, useRegions } from '../regions-data.js'
import { withNode } from '../with-node.jsx'
import Delta from '../components/Delta.jsx'
import TrendChart from '../components/TrendChart.jsx'
import { ChartIcon, CheckIcon, ClockIcon, ExamIcon, FlameIcon, ReviewIcon } from '../components/Icons.jsx'

const RECENT = 5
const RANGES = [10, 30]
// smaller changes than this count as "steady"
const STEADY = 3

function percentOf(item) {
  return Math.round((item.score / item.total) * 100)
}

function average(list) {
  return list.reduce((sum, h) => sum + percentOf(h), 0) / list.length
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m + ':' + String(s).padStart(2, '0')
}

function Progress() {
  const { user } = useAuth()
  const { lang, t: all } = useLang()
  const t = all.progress
  const regions = useRegions()
  const regionId = getSavedRegion()
  const rules = regions?.[regionId]
  const passPercent = rules ? Math.round((rules.pass_correct / rules.questions) * 100) : 80

  const history = useHistory()
  const mistakes = getAllMistakes().filter((q) => q.region === regionId)
  const [range, setRange] = useState(RANGES[0])

  if (history === null) {
    return <div className="page"><p className="muted progress-loading">{all.practice.loading}</p></div>
  }

  const stats = computeStats(history)
  if (!stats) {
    return (
      <div className="page">
        <div className="exam-card exam-start">
          <span className="icon-box icon-box-lg"><ChartIcon /></span>
          <h1>{t.title}</h1>
          <p className="notice">{t.empty}</p>
          <Link to="/practice" className="btn-primary">{t.start}</Link>
        </div>
      </div>
    )
  }

  // mistakes practice is not a real exam, so it does not count toward readiness
  const exams = history.filter((h) => h.mode !== 'mistakes')
  const recent = exams.slice(-RECENT)
  const readiness = recent.length
    ? Math.round(recent.reduce((sum, h) => sum + percentOf(h), 0) / recent.length)
    : 0
  let level = 'notYet'
  if (readiness >= passPercent) level = 'ready'
  else if (readiness >= passPercent - 10) level = 'almost'

  const passed = (item) => item.passed ?? percentOf(item) >= passPercent

  // each real exam with its number and the change from the exam before it
  const numbered = exams.map((item, i) => ({
    ...item,
    number: i + 1,
    percent: percentOf(item),
    passed: passed(item),
    change: i > 0 ? percentOf(item) - percentOf(exams[i - 1]) : null,
  }))
  const byDate = new Map(numbered.map((item) => [item.date, item]))
  const chart = range === 'all' ? numbered : numbered.slice(-range)

  const last = numbered[numbered.length - 1]
  const groupSize = Math.min(RECENT, Math.floor(exams.length / 2))
  const groupNow = groupSize >= 2 ? average(exams.slice(-groupSize)) : null
  const groupBefore = groupSize >= 2 ? average(exams.slice(-groupSize * 2, -groupSize)) : null
  const groupChange = groupNow !== null ? groupNow - groupBefore : null
  let trend = 'steady'
  if (groupChange >= STEADY) trend = 'improving'
  else if (groupChange <= -STEADY) trend = 'dropping'
  const passedCount = numbered.filter((item) => item.passed).length

  return (
    <div className="page progress-page">
      <div className="progress-head">
        <h1>{t.title}</h1>
        <p className="muted">
          {user ? t.subtitleAccount : <>{t.subtitle} <Link to="/login?next=/progress">{t.saveIt}</Link></>}
        </p>
      </div>

      <div className="progress-top">
        <div className={'readiness readiness-' + level}>
          <h2>{t.readiness}</h2>
          <div className={'score-ring' + (level === 'ready' ? ' score-pass' : '')} style={{ '--pct': readiness }}>
            <div className="score-ring-inner">
              <span className="score-percent">{readiness}%</span>
            </div>
          </div>
          <p className="readiness-text">{t[level]}</p>
          <p className="muted">{fill(t.basedOn, recent.length)} · {t.passLine} {passPercent}%</p>
        </div>

        <div className="progress-side">
          <div className="progress-tiles">
            <div><ExamIcon size={20} /><strong>{stats.exams}</strong><span>{all.practice.statExams}</span></div>
            <div><CheckIcon /><strong>{stats.best}%</strong><span>{all.practice.statBest}</span></div>
            <div><ChartIcon /><strong>{stats.average}%</strong><span>{all.practice.statAverage}</span></div>
            <div><FlameIcon /><strong>{stats.streak}</strong><span>{all.practice.statStreak}</span></div>
          </div>
          <div className="mistakes-box">
            <span className="icon-box"><ReviewIcon /></span>
            <div>
              <strong>{t.mistakes}</strong>
              <p className="muted">{mistakes.length ? fill(t.mistakesText, mistakes.length) : t.noMistakes}</p>
            </div>
            {mistakes.length > 0 && <Link to="/practice" className="btn-next">{t.review}</Link>}
          </div>
        </div>
      </div>

      {last && (
        <div className="progress-panel">
          <h2>{t.compareTitle}</h2>
          <div className="compare">
            <div className="compare-card">
              <span className="compare-label">{t.lastExam}</span>
              <strong className="compare-value">{last.percent}%</strong>
              <p className="muted">
                {last.change === null
                  ? t.firstExam
                  : withNode(t.vsPrevious, '{n}', <Delta value={last.change} />)}
              </p>
            </div>
            <div className={'compare-card compare-' + trend}>
              <span className="compare-label">{fill(t.lastGroup, groupSize >= 2 ? groupSize : RECENT)}</span>
              {groupNow !== null ? (
                <>
                  <strong className="compare-value">{Math.round(groupNow)}%</strong>
                  <p className="muted">
                    {withNode(fill(t.vsGroup, groupSize), '{d}', <Delta value={groupChange} />)}
                  </p>
                  <p className="compare-trend">{t[trend]}</p>
                </>
              ) : (
                <>
                  <strong className="compare-value">—</strong>
                  <p className="muted">{t.needMore}</p>
                </>
              )}
            </div>
            <div className="compare-card">
              <span className="compare-label">{t.passRate}</span>
              <strong className="compare-value">{Math.round((passedCount / numbered.length) * 100)}%</strong>
              <p className="muted">{fill(t.passedOf, numbered.length).replace('{a}', passedCount)}</p>
            </div>
          </div>
        </div>
      )}

      {chart.length > 0 && (
        <div className="progress-panel">
          <div className="panel-head">
            <h2>{t.chart}</h2>
            {numbered.length > RANGES[0] && (
              <div className="range-tabs" role="group" aria-label={t.chart}>
                {[...RANGES.filter((r) => r < numbered.length), 'all'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={'range-tab' + (range === r ? ' is-active' : '')}
                    aria-pressed={range === r}
                    onClick={() => setRange(r)}
                  >
                    {r === 'all' ? t.rangeAll : fill(t.rangeLast, r)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <TrendChart items={chart} passPercent={passPercent} lang={lang} t={t} all={all} />
        </div>
      )}

      <div className="progress-panel">
        <h2>{t.history}</h2>
        <ul className="history">
          {[...history].reverse().slice(0, 20).map((item) => {
            const place = findPlace(item.region)
            const exam = byDate.get(item.date)
            return (
              <li key={item.date}>
                <span className={'history-dot' + (passed(item) ? ' history-pass' : '')} />
                <div className="history-main">
                  <strong>
                    {exam && <span className="history-number">#{exam.number}</span>}
                    {item.mode === 'mistakes' ? t.mistakeMode : place.region.name}
                  </strong>
                  <span className="muted">
                    {new Date(item.date).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {item.seconds ? <> · <ClockIcon /> {formatTime(item.seconds)}</> : null}
                  </span>
                </div>
                <div className="history-percent">
                  <span className="history-bar">
                    <span
                      className={passed(item) ? 'is-pass' : ''}
                      style={{ width: Math.max(percentOf(item), 2) + '%' }}
                    />
                  </span>
                  <span className="history-score">{percentOf(item)}% · {item.score}/{item.total}</span>
                </div>
                <span className="history-change">
                  {exam && exam.change !== null ? <Delta value={exam.change} /> : null}
                </span>
                <span className={'result-badge' + (passed(item) ? ' result-pass' : '')}>
                  {passed(item) ? all.practice.passed : all.practice.failed}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default Progress
