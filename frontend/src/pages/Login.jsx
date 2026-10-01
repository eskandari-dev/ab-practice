import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'

function Login() {
  const { login } = useAuth()
  const { t, tError } = useLang()
  const navigate = useNavigate()
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
      navigate('/practice')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <h1>{t.login.title}</h1>
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
          placeholder={t.login.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{tError(error)}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? t.login.busy : t.login.button}
        </button>
      </form>
      <p className="form-switch">
        {t.login.noAccount} <Link to="/register">{t.nav.signup}</Link>
      </p>
    </div>
  )
}

export default Login
