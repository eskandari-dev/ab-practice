import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'

function Feedback() {
  const { user } = useAuth()
  const { t: all, tError } = useLang()
  const t = all.feedback
  const { state } = useLocation()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/feedback', { method: 'POST', body: { message, email, page: state?.from || '' } })
      setSent(true)
      setMessage('')
    } catch (err) {
      setError(tError(err.message))
    }
    setBusy(false)
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>{t.title}</h1>
        <p className="auth-subtitle">{t.subtitle}</p>
        {sent ? (
          <>
            <p className="form-success">{t.thanks}</p>
            <button type="button" className="btn-back" onClick={() => setSent(false)}>{t.again}</button>
          </>
        ) : (
          <form className="form" onSubmit={send}>
            <textarea
              rows="6"
              maxLength="2000"
              placeholder={t.message}
              aria-label={t.message}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {!user && (
              <input
                type="email"
                placeholder={t.email}
                aria-label={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={busy || message.trim().length < 3}>
              {busy ? t.sending : t.send}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Feedback
