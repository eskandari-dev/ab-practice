import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { LogoIcon } from './Icons.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span className="logo-mark"><LogoIcon /></span>
        AB Practice
      </Link>
      <div className="nav-links">
        <Link to="/">{t.nav.home}</Link>
        <Link to="/practice">{t.nav.practice}</Link>
        <Link to="/pricing">{t.nav.pricing}</Link>
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="Language"
        >
          <option value="en">English</option>
          <option value="fa">فارسی</option>
          <option value="de">Deutsch</option>
        </select>
        {user ? (
          <>
            <span className="nav-user">{user.email}</span>
            <button className="nav-logout" onClick={handleLogout}>{t.nav.logout}</button>
          </>
        ) : (
          <>
            <Link to="/login">{t.nav.login}</Link>
            <Link to="/register" className="nav-login">{t.nav.signup}</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
