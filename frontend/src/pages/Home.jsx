import { Link } from 'react-router-dom'
import { useLang } from '../lang-context.js'

function Home() {
  const { t } = useLang()

  return (
    <div className="page">
      <section className="hero">
        <h1>{t.home.title}</h1>
        <p>{t.home.subtitle}</p>
        <Link to="/practice" className="btn-primary">{t.home.start}</Link>
      </section>

      <section className="features">
        {t.home.features.map((f) => (
          <div className="feature-card" key={f.title}>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

export default Home
