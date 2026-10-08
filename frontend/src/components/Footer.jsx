import { Link } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { LogoIcon } from './Icons.jsx'

function Footer() {
  const { user } = useAuth()
  const { t } = useLang()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-mark"><LogoIcon /></span>
            AB Practice
          </Link>
          <p>{t.footer.tagline}</p>
        </div>
        <div className="footer-links">
          <Link to="/practice">{t.nav.practice}</Link>
          <Link to="/pricing">{t.nav.pricing}</Link>
          {!user && <Link to="/login">{t.nav.login}</Link>}
          <Link to="/terms">{t.footer.terms}</Link>
        </div>
      </div>
      <p className="footer-bottom">© {new Date().getFullYear()} AB Practice. {t.footer.rights}</p>
    </footer>
  )
}

export default Footer
