import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { LogoIcon } from './Icons.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useLang()
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
        <NavLink to="/" end className="nav-item">{t.nav.home}</NavLink>
        <NavLink to="/practice" className="nav-item">{t.nav.practice}</NavLink>
        <NavLink to="/pricing" className="nav-item">{t.nav.pricing}</NavLink>
        {user && user.is_admin && <NavLink to="/admin" className="nav-item nav-admin">Admin</NavLink>}
        {user ? (
          <>
            <span className="nav-avatar" title={user.email}>{user.email[0].toUpperCase()}</span>
            <button className="nav-logout" onClick={handleLogout}>{t.nav.logout}</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-item">{t.nav.login}</NavLink>
            <Link to="/register" className="nav-login">{t.nav.signup}</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
