import { Link } from 'react-router-dom'
import { useLang } from '../lang-context.js'

function Footer() {
  const { t } = useLang()

  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} AB Practice. {t.footer.rights}</p>
      <Link to="/terms">{t.footer.terms}</Link>
    </footer>
  )
}

export default Footer
