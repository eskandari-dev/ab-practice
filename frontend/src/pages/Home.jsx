import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lang-context.js'
import { LANGUAGES } from '../languages.js'
import { COUNTRIES, countryName, findPlace, getSavedRegion, saveRegion } from '../places.js'
import { questions } from '../questions.js'
import {
  ArrowIcon, ChartIcon, CheckIcon, ExamIcon, FlameIcon, GlobeIcon, PinIcon, ReviewIcon, WalletIcon,
} from '../components/Icons.jsx'

const featureIcons = [ExamIcon, GlobeIcon, WalletIcon, ReviewIcon, ChartIcon, FlameIcon]
const previewQuestion = questions[1]

function Home() {
  const { lang, setLang, t } = useLang()
  const navigate = useNavigate()
  const [regionId, setRegionId] = useState(getSavedRegion)
  const [tryAnswer, setTryAnswer] = useState(null)
  const { country, region } = findPlace(regionId)

  function changeCountry(code) {
    const next = COUNTRIES.find((c) => c.code === code)
    const ready = next.regions.find((r) => r.ready)
    setRegionId((ready || next.regions[0]).id)
  }

  function startPractice() {
    saveRegion(regionId)
    navigate('/practice')
  }

  function pickRegion(id) {
    setRegionId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <span className="badge fade-up">{t.home.badge}</span>
          <h1 className="fade-up delay-1">
            {t.home.title} <span className="highlight">{t.home.titleHighlight}</span>
          </h1>
          <p className="hero-text fade-up delay-2">{t.home.subtitle}</p>

          <form
            className="picker fade-up delay-3"
            onSubmit={(e) => {
              e.preventDefault()
              startPractice()
            }}
          >
            <p className="picker-title"><PinIcon /> {t.home.pickerTitle}</p>
            <div className="picker-fields">
              <label className="field">
                <span>{t.home.language}</span>
                <select value={lang} onChange={(e) => setLang(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.home.country}</span>
                <select value={country.code} onChange={(e) => changeCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{countryName(c.code, lang)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.home.region}</span>
                <select value={region.id} onChange={(e) => setRegionId(e.target.value)}>
                  {country.regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.ready ? r.name : r.name + ' · ' + t.home.soon}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="btn-primary" disabled={!region.ready}>
              {t.home.start} <ArrowIcon />
            </button>
            {!region.ready && <p className="picker-hint">{t.home.soonHint}</p>}
          </form>

          <ul className="trust fade-up delay-4">
            {t.home.trust.map((item) => (
              <li key={item}><CheckIcon /> {item}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual fade-up delay-2">
          <div className="preview-card">
            <div className="preview-top">
              <span className="try-title">{t.home.tryTitle}</span>
              <span className="preview-place"><PinIcon /> Alberta</span>
            </div>
            <p className="preview-question">{previewQuestion[lang] || previewQuestion.en}</p>
            {(previewQuestion.options[lang] || previewQuestion.options.en).map((option, index) => (
              <button
                className={
                  'preview-answer' +
                  (tryAnswer !== null && index === previewQuestion.correct ? ' preview-correct' : '') +
                  (tryAnswer === index && index !== previewQuestion.correct ? ' preview-wrong' : '')
                }
                key={option}
                onClick={() => setTryAnswer(index)}
                disabled={tryAnswer !== null}
              >
                <span className="answer-letter">{'ABC'[index]}</span>
                {option}
              </button>
            ))}
            {tryAnswer !== null && (
              <div className="try-result">
                <p>{tryAnswer === previewQuestion.correct ? t.home.tryCorrect : t.home.tryWrong}</p>
                <button className="btn-next" onClick={() => (region.ready ? startPractice() : pickRegion(regionId))}>
                  {t.home.tryNext}
                </button>
              </div>
            )}
          </div>
          <div className="float-chip chip-score" aria-hidden="true">
            <span className="chip-ring">92%</span>
            <span>{t.home.previewScore}</span>
          </div>
          <div className="float-chip chip-langs" aria-hidden="true"><GlobeIcon /> 中文 · العربية · Español</div>
        </div>
      </section>

      <section className="lang-strip fade-up delay-4">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            className={'lang-chip' + (l.code === lang ? ' lang-chip-active' : '')}
            onClick={() => setLang(l.code)}
            lang={l.code}
          >
            {l.name}
          </button>
        ))}
      </section>

      <section className="stats">
        {t.home.stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <span className="eyebrow">{t.home.howEyebrow}</span>
        <h2 className="section-title">{t.home.howTitle}</h2>
        <div className="steps">
          {t.home.steps.map((step, index) => (
            <div className="step" key={step.title}>
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">{t.home.regionsEyebrow}</span>
        <h2 className="section-title">{t.home.regionsTitle}</h2>
        <p className="section-text">{t.home.regionsText}</p>
        <div className="countries">
          {COUNTRIES.map((c) => {
            const live = c.regions.some((r) => r.ready)
            return (
              <div className={'country-card' + (live ? ' country-live' : '')} key={c.code}>
                <div className="country-head">
                  <span className="country-code">{c.code}</span>
                  <h3>{countryName(c.code, lang)}</h3>
                  <span className={'status' + (live ? ' status-live' : '')}>
                    {live ? t.home.available : t.home.soon}
                  </span>
                </div>
                <div className="region-chips">
                  {c.regions.map((r) =>
                    r.ready ? (
                      <button key={r.id} className="region-chip region-ready" onClick={() => pickRegion(r.id)}>
                        <CheckIcon /> {r.name}
                      </button>
                    ) : (
                      <span key={r.id} className="region-chip">{r.name}</span>
                    ),
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">{t.home.featuresEyebrow}</span>
        <h2 className="section-title">{t.home.featuresTitle}</h2>
        <div className="features">
          {[...t.home.features, ...t.home.moreFeatures].map((f, index) => {
            const Icon = featureIcons[index]
            return (
              <div className="feature-card" key={f.title}>
                <span className="icon-box"><Icon /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title">{t.home.faqTitle}</h2>
        <div className="faq">
          {t.home.faq.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>{t.home.ctaTitle}</h2>
        <p>{t.home.ctaText}</p>
        <button className="btn-light" onClick={() => (region.ready ? startPractice() : pickRegion(regionId))}>
          {t.home.start} <ArrowIcon />
        </button>
      </section>
    </div>
  )
}

export default Home
