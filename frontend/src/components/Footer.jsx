import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { SHOW_PRICING } from '../features.js'
import { useLang } from '../lang-context.js'
import { LogoIcon } from './Icons.jsx'

function Footer() {
  const { user } = useAuth()
  const { t } = useLang()
  const { pathname } = useLocation()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-mark"><LogoIcon /></span>
            Road Ready
          </Link>
          <p>{t.footer.tagline}</p>
        </div>
        <div className="footer-links">
          <Link to="/practice">{t.nav.practice}</Link>
          {SHOW_PRICING && <Link to="/pricing">{t.nav.pricing}</Link>}
          {!user && <Link to="/login">{t.nav.login}</Link>}
          <Link to="/feedback" state={{ from: pathname }}>{t.footer.feedback}</Link>
          <Link to="/terms">{t.footer.terms}</Link>
        </div>
      </div>
      <p className="footer-bottom">© {new Date().getFullYear()} Road Ready. {t.footer.rights}</p>
    </footer>
  )
}

export default Footer
