import { Link } from 'react-router-dom'
import { useLang } from '../lang-context.js'
import { findPlace, getSavedRegion } from '../places.js'
import { getAllMistakes, getHistory, getStats } from '../progress.js'
import { fill, useRegions } from '../regions-data.js'
import { ChartIcon, CheckIcon, ClockIcon, ExamIcon, FlameIcon, ReviewIcon } from '../components/Icons.jsx'

const RECENT = 5
const CHART_SIZE = 12

function percentOf(item) {
  return Math.round((item.score / item.total) * 100)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m + ':' + String(s).padStart(2, '0')
}

function Progress() {
  const { lang, t: all } = useLang()
  const t = all.progress
  const regions = useRegions()
  const regionId = getSavedRegion()
  const rules = regions?.[regionId]
  const passPercent = rules ? Math.round((rules.pass_correct / rules.questions) * 100) : 80

  const history = getHistory()
  const stats = getStats()
  const mistakes = getAllMistakes().filter((q) => q.region === regionId)

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

  const chart = exams.slice(-CHART_SIZE)
  const passed = (item) => item.passed ?? percentOf(item) >= passPercent

  return (
    <div className="page progress-page">
      <div className="progress-head">
        <h1>{t.title}</h1>
        <p className="muted">{t.subtitle}</p>
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

      {chart.length > 0 && (
        <div className="progress-panel">
          <h2>{t.chart}</h2>
          <div className="chart">
            <div className="chart-line" style={{ bottom: passPercent + '%' }}>
              <span>{t.passLine} {passPercent}%</span>
            </div>
            {chart.map((item) => (
              <div className="chart-col" key={item.date}>
                <div
                  className={'chart-bar' + (passed(item) ? ' chart-pass' : '')}
                  style={{ height: Math.max(percentOf(item), 3) + '%' }}
                  title={percentOf(item) + '%'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="progress-panel">
        <h2>{t.history}</h2>
        <ul className="history">
          {[...history].reverse().slice(0, 20).map((item) => {
            const place = findPlace(item.region)
            return (
              <li key={item.date}>
                <span className={'history-dot' + (passed(item) ? ' history-pass' : '')} />
                <div className="history-main">
                  <strong>{item.mode === 'mistakes' ? t.mistakeMode : place.region.name}</strong>
                  <span className="muted">
                    {new Date(item.date).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {item.seconds ? <> · <ClockIcon /> {formatTime(item.seconds)}</> : null}
                  </span>
                </div>
                <span className="history-score">{item.score}/{item.total}</span>
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
