import { Link } from 'react-router-dom'
import { useLang } from '../lang-context.js'
import { CheckIcon, ExamIcon, GlobeIcon, WalletIcon } from '../components/Icons.jsx'

const featureIcons = [ExamIcon, GlobeIcon, WalletIcon]

function Home() {
  const { t } = useLang()

  return (
    <div className="page">
      <section className="hero">
        <span className="badge">{t.home.badge}</span>
        <h1>
          {t.home.title} <span className="highlight">{t.home.titleHighlight}</span>
        </h1>
        <p className="hero-text">{t.home.subtitle}</p>
        <div className="hero-actions">
          <Link to="/practice" className="btn-primary">{t.home.start}</Link>
          <Link to="/pricing" className="btn-secondary">{t.home.seePricing}</Link>
        </div>
        <ul className="trust">
          {t.home.trust.map((item) => (
            <li key={item}><CheckIcon /> {item}</li>
          ))}
        </ul>
      </section>

      <section className="section">
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
        <Link to="/practice" className="btn-light">{t.home.start}</Link>
      </section>
    </div>
  )
}

export default Home
