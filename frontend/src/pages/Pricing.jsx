import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { CheckIcon, LockIcon } from '../components/Icons.jsx'

const plans = [
    { key: 'starter', price: '$4.99', perExam: '$1.66' },
    { key: 'standard', price: '$9.99', perExam: '$1.00', popular: true },
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
            <div className="page-header">
                <h1>{t.pricing.title}</h1>
                <p>{t.pricing.subtitle}</p>
            </div>
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
                    <div className={'plan-card' + (plan.popular ? ' plan-popular' : '')} key={plan.key}>
                        {plan.popular && <span className="plan-badge">{t.pricing.popular}</span>}
                        <h2>{t.pricing.plans[plan.key].name}</h2>
                        <p className="plan-price">{plan.price}</p>
                        <p className="plan-per-exam">
                            {plan.perExam ? '≈ ' + plan.perExam + ' ' + t.pricing.perExam : t.pricing.unlimitedNote}
                        </p>
                        <p className="plan-text">{t.pricing.plans[plan.key].text}</p>
                        <ul className="plan-features">
                            {t.pricing.plans[plan.key].features.map((feature) => (
                                <li key={feature}><CheckIcon /> {feature}</li>
                            ))}
                        </ul>
                        <button
                            className={plan.popular ? 'btn-primary' : 'btn-outline'}
                            onClick={() => choose(plan.key)}
                            disabled={busy !== ''}
                        >
                            {busy === plan.key ? t.pricing.opening : t.pricing.choose}
                        </button>
                    </div>
                ))}
            </div>
            <p className="secure-note"><LockIcon /> {t.pricing.secure}</p>
        </div>
    )
}

export default Pricing
