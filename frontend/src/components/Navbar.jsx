import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { LogoIcon } from './Icons.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <nav className={'navbar' + (open ? ' navbar-open' : '')}>
      <Link to="/" className="logo" onClick={() => setOpen(false)}>
        <span className="logo-mark"><LogoIcon /></span>
        AB Practice
      </Link>
      <button
        className="nav-toggle"
        onClick={() => setOpen(!open)}
        aria-label={t.nav.menu}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="nav-links" onClick={(e) => e.target.closest('a') && setOpen(false)}>
        <NavLink to="/" end className="nav-item">{t.nav.home}</NavLink>
        <NavLink to="/practice" className="nav-item">{t.nav.practice}</NavLink>
        <NavLink to="/progress" className="nav-item">{t.nav.progress}</NavLink>
        <NavLink to="/pricing" className="nav-item">{t.nav.pricing}</NavLink>
        {user && user.is_admin && <NavLink to="/admin" className="nav-item nav-admin">Admin</NavLink>}
        {user ? (
          <>
            <NavLink to="/account" className="nav-avatar" title={user.email} aria-label={t.nav.account}>
              {user.email[0].toUpperCase()}
            </NavLink>
            <NavLink to="/account" className="nav-item nav-account">{t.nav.account}</NavLink>
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
