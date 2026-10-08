import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { fill } from '../regions-data.js'
import PasswordInput from '../components/PasswordInput.jsx'

function ChangePassword() {
  const { t: all, tError } = useLang()
  const t = all.account
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    if (next.length < 8) return setMessage({ ok: false, text: all.register.tooShort })
    if (next !== repeat) return setMessage({ ok: false, text: all.register.mismatch })
    setBusy(true)
    try {
      await api('/me/password', { method: 'POST', body: { current, new: next } })
      setCurrent('')
      setNext('')
      setRepeat('')
      setMessage({ ok: true, text: t.saved })
    } catch (err) {
      setMessage({ ok: false, text: tError(err.message) })
    }
    setBusy(false)
  }

  return (
    <form className="form" onSubmit={save}>
      <PasswordInput placeholder={t.current} value={current} onChange={(e) => setCurrent(e.target.value)} />
      <PasswordInput placeholder={t.newPassword} value={next} onChange={(e) => setNext(e.target.value)} />
      <PasswordInput placeholder={t.repeat} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      {message && <p className={message.ok ? 'form-success' : 'form-error'}>{message.text}</p>}
      <button type="submit" className="btn-next" disabled={busy}>{t.save}</button>
    </form>
  )
}

function Account() {
  const { user, setUser } = useAuth()
  const { lang, t: all, tError } = useLang()
  const t = all.account
  const [error, setError] = useState('')
  const [deleted, setDeleted] = useState(false)

  if (deleted) return <Navigate to="/" replace />
  if (!localStorage.getItem('token')) return <Navigate to="/login?next=/account" replace />
  if (!user) return <div className="page"><p className="muted progress-loading">{all.practice.loading}</p></div>

  let plan = t.noPlan
  if (user.unlimited_until) {
    plan = fill(t.unlimited, new Date(user.unlimited_until).toLocaleDateString(lang))
  } else if (user.exams_left > 0) {
    plan = fill(t.examsLeft, user.exams_left)
  }

  async function deleteAccount() {
    if (!window.confirm(t.confirm)) return
    try {
      await api('/me', { method: 'DELETE' })
      localStorage.removeItem('token')
      setUser(null)
      setDeleted(true)
    } catch (err) {
      setError(tError(err.message))
    }
  }

  return (
    <div className="page account-page">
      <div className="progress-head">
        <span className="account-avatar">{user.email[0].toUpperCase()}</span>
        <h1>{t.title}</h1>
        <p className="muted">{user.email}</p>
      </div>

      <div className="account-grid">
        <section className="account-card">
          <h2>{t.plan}</h2>
          <p className="account-plan">{plan}</p>
          <div className="account-actions">
            <Link to="/practice" className="btn-next">{t.practiceNow}</Link>
            <Link to="/pricing" className="btn-back">{t.seePlans}</Link>
          </div>
        </section>

        <section className="account-card">
          <h2>{t.method}</h2>
          <p className="account-plan">{user.google ? t.methodGoogle : t.methodEmail}</p>
          <Link to="/progress" className="progress-more">{all.progress.title} →</Link>
        </section>
      </div>

      <section className="account-card">
        <h2>{t.password}</h2>
        {user.has_password ? <ChangePassword /> : <p className="muted">{t.googleOnly}</p>}
      </section>

      <section className="account-card account-danger">
        <h2>{t.danger}</h2>
        <p className="muted">{t.dangerText}</p>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-danger" onClick={deleteAccount}>{t.deleteButton}</button>
      </section>
    </div>
  )
}

export default Account
