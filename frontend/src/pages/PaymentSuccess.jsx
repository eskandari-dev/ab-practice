import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'

function PaymentSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { setUser } = useAuth()
  const { t, tError } = useLang()
  const [status, setStatus] = useState(sessionId ? 'checking' : 'error')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    api('/checkout/verify', { method: 'POST', body: { session_id: sessionId } })
      .then((data) => {
        setUser(data)
        setStatus('done')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [sessionId, setUser])

  return (
    <div className="page">
      {status === 'checking' && <h1>{t.payment.checking}</h1>}
      {status === 'done' && (
        <>
          <h1>{t.payment.thanks}</h1>
          <p>{t.payment.success}</p>
          <Link to="/practice" className="btn-primary">{t.payment.startFull}</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1>{t.payment.failed}</h1>
          <p className="form-error">{error ? tError(error) : t.payment.missing}</p>
          <Link to="/pricing" className="btn-primary">{t.payment.backToPricing}</Link>
        </>
      )}
    </div>
  )
}

export default PaymentSuccess
