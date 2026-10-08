import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import GoogleButton from '../components/GoogleButton.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { LogoIcon } from '../components/Icons.jsx'
import { safeNext } from '../regions-data.js'

function Login() {
  const { login } = useAuth()
  const { t, tError } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/practice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(next)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <span className="auth-logo"><LogoIcon /></span>
        <h1>{t.login.title}</h1>
        <p className="auth-subtitle">{t.login.subtitle}</p>
        <GoogleButton onDone={() => navigate(next)} onError={setError} />
        <div className="divider"><span>{t.login.or}</span></div>
        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t.login.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            placeholder={t.login.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="form-error">{tError(error)}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? t.login.busy : t.login.button}
          </button>
        </form>
        <p className="form-switch">
          {t.login.noAccount} <Link to={'/register?next=' + encodeURIComponent(next)}>{t.nav.signup}</Link>
        </p>
        {next === '/practice' && (
          <Link to="/practice" className="guest-link">{t.login.guest}</Link>
        )}
      </div>
    </div>
  )
}

export default Login
