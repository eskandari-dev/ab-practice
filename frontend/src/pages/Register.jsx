import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import GoogleButton from '../components/GoogleButton.jsx'
import { LogoIcon } from '../components/Icons.jsx'
import { safeNext } from '../regions-data.js'

function Register() {
  const { register } = useAuth()
  const { t, tError } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/pricing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError(t.register.tooShort)
      return
    }
    if (password !== confirm) {
      setError(t.register.mismatch)
      return
    }
    setBusy(true)
    try {
      await register(email, password)
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
        <h1>{t.register.title}</h1>
        <p className="auth-subtitle">{t.register.subtitle}</p>
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
          <input
            type="password"
            placeholder={t.register.passwordHint}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t.register.repeat}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="form-error">{tError(error)}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? t.register.busy : t.register.button}
          </button>
        </form>
        <p className="form-switch">
          {t.register.haveAccount} <Link to={'/login?next=' + encodeURIComponent(next)}>{t.nav.login}</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
