import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'

const plans = [
    { key: 'starter', price: '$4.99' },
    { key: 'standard', price: '$9.99' },
    { key: 'unlimited', price: '$14.99' },
]

function Pricing() {
    const { user } = useAuth()
    const { t, tError } = useLang()
    const navigate = useNavigate()
    const [busy, setBusy] = useState('')
    const [error, setError] = useState('')

    async function choose(planKey) {
        if (!user) {
            navigate('/register')
            return
        }
        setError('')
        setBusy(planKey)
        try {
            const data = await api('/checkout', { method: 'POST', body: { plan: planKey } })
            window.location.assign(data.url)
        } catch (err) {
            setError(err.message)
            setBusy('')
        }
    }

    return (
        <div className="page">
            <h1>{t.pricing.title}</h1>
            <p>{t.pricing.subtitle}</p>
            {user && user.has_access && (
                <p className="notice">
                    {user.unlimited_until
                        ? t.pricing.unlimitedUntil + new Date(user.unlimited_until).toLocaleDateString()
                        : t.pricing.examsLeft + user.exams_left}
                </p>
            )}
            {error && <p className="form-error">{tError(error)}</p>}
            <div className="plans">
                {plans.map((plan) => (
                    <div className="plan-card" key={plan.key}>
                        <h2>{t.pricing.plans[plan.key].name}</h2>
                        <p className="plan-price">{plan.price}</p>
                        <p>{t.pricing.plans[plan.key].text}</p>
                        <button
                            className="btn-primary"
                            onClick={() => choose(plan.key)}
                            disabled={busy !== ''}
                        >
                            {busy === plan.key ? t.pricing.opening : t.pricing.choose}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Pricing
