import { Link } from 'react-router-dom'
import { useLang } from '../lang-context.js'

function NotFound() {
  const { t } = useLang()

  return (
    <div className="page">
      <div className="exam-card exam-start not-found">
        <span className="not-found-code">404</span>
        <h1>{t.notFound.title}</h1>
        <p className="muted">{t.notFound.text}</p>
        <Link to="/" className="btn-primary">{t.notFound.home}</Link>
      </div>
    </div>
  )
}

export default NotFound
