import { Link } from 'react-router-dom'
import { useLang } from '../lang-context.js'
import { questions } from '../questions.js'
import { ArrowIcon, CheckIcon, ExamIcon, GlobeIcon, WalletIcon } from '../components/Icons.jsx'

const featureIcons = [ExamIcon, GlobeIcon, WalletIcon]
const previewQuestion = questions[1]

function Home() {
  const { lang, t } = useLang()

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <span className="badge fade-up">{t.home.badge}</span>
          <h1 className="fade-up delay-1">
            {t.home.title} <span className="highlight">{t.home.titleHighlight}</span>
          </h1>
          <p className="hero-text fade-up delay-2">{t.home.subtitle}</p>
          <div className="hero-actions fade-up delay-3">
            <Link to="/practice" className="btn-primary">
              {t.home.start} <ArrowIcon />
            </Link>
            <Link to="/pricing" className="btn-secondary">{t.home.seePricing}</Link>
          </div>
          <ul className="trust fade-up delay-4">
            {t.home.trust.map((item) => (
              <li key={item}><CheckIcon /> {item}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual fade-up delay-2" aria-hidden="true">
          <div className="preview-card">
            <div className="preview-top">
              <span className="progress">7 / 20</span>
              <span className="preview-dots"><i /><i /><i /></span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '35%' }} />
            </div>
            <p className="preview-question">{previewQuestion[lang]}</p>
            {previewQuestion.options[lang].map((option, index) => (
              <div
                className={'preview-answer' + (index === previewQuestion.correct ? ' preview-correct' : '')}
                key={option}
              >
                <span className="answer-letter">{'ABC'[index]}</span>
                {option}
              </div>
            ))}
          </div>
          <div className="float-chip chip-score">
            <span className="chip-ring">92%</span>
            <span>{t.home.previewScore}</span>
          </div>
          <div className="float-chip chip-langs">EN · فا · DE</div>
        </div>
      </section>

      <section className="stats fade-up delay-3">
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
        <span className="eyebrow">{t.home.featuresEyebrow}</span>
        <h2 className="section-title">{t.home.featuresTitle}</h2>
        <div className="features">
          {t.home.features.map((f, index) => {
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
        <Link to="/practice" className="btn-light">
          {t.home.start} <ArrowIcon />
        </Link>
      </section>
    </div>
  )
}

export default Home
