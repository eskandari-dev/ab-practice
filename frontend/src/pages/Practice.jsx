import { useEffect, useState } from "react";
import { questions } from '../questions.js'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { countryName, findPlace, getSavedRegion } from '../places.js'
import { ExamIcon, PinIcon } from '../components/Icons.jsx'

function Practice() {
    const navigate = useNavigate()
    const { user, setUser } = useAuth()
    const { lang, t: all } = useLang()
    const t = all.practice
    const [regionId] = useState(getSavedRegion)
    const { country, region } = findPlace(regionId)
    const [page, setPage] = useState("start");
    const [message, setMessage] = useState('')
    const [current, setCurrent] = useState(0)
    const [score, setScore] = useState(0)
    const [answered, setAnswered] = useState(false)
    const [selected, setSelected] = useState(null)
    const [examQuestions, setExamQuestions] = useState([])
    const [mode, setMode] = useState('free')
    const [loading, setLoading] = useState(false)

    async function startExam() {
        setLoading(true)
        try {
            const data = await api('/exam/start', { method: 'POST', body: { region: regionId } })
            setExamQuestions(data.questions)
            setMode(data.mode)
            if (data.user) setUser(data.user)
        } catch {
            setExamQuestions(questions.slice(0, 5))
            setMode('free')
        }
        setCurrent(0)
        setScore(0)
        setMessage('')
        setAnswered(false)
        setSelected(null)
        setLoading(false)
        setPage('exam')
    }

    function chooseAnswer(index) {
        if (answered) return

        setSelected(index)

        if (index === examQuestions[current].correct) {
            setMessage(t.correct)
            setScore(score + 1)
        } else {
            setMessage(t.wrong)
        }

        setAnswered(true)
    }

    function goNext() {
        if (current + 1 < examQuestions.length) {
            setCurrent(current + 1)
            setMessage('')
            setAnswered(false)
            setSelected(null)
        } else {
            setPage('score')
        }
    }

    useEffect(() => {
        if (page !== 'exam') return

        function handleKey(e) {
            if (['1', '2', '3'].includes(e.key)) {
                chooseAnswer(Number(e.key) - 1)
            } else if (e.key === 'Enter' && answered) {
                // stops a focused button from also firing its click
                e.preventDefault()
                goNext()
            }
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    })

    const placePill = (
        <span className="place-pill">
            <PinIcon /> {region.name}, {countryName(country.code, lang)}
            <Link to="/">{t.change}</Link>
        </span>
    )

    if (!region.ready) {
        return (
            <div className="page">
                <div className="exam-card exam-start">
                    <span className="icon-box icon-box-lg"><PinIcon size={26} /></span>
                    <h1>{t.soonTitle}</h1>
                    {placePill}
                    <p className="notice">{t.soonText}</p>
                    <Link to="/" className="btn-primary">{t.choosePlace}</Link>
                </div>
            </div>
        )
    }

    if (page === 'start') {
        let info = t.guestInfo
        if (user && user.unlimited_until) {
            info = t.unlimitedInfo + new Date(user.unlimited_until).toLocaleDateString()
        } else if (user && user.exams_left > 0) {
            info = t.examsLeftInfo + user.exams_left
        } else if (user) {
            info = t.noPlanInfo
        }

        return (
            <div className="page">
                <div className="exam-card exam-start">
                    <span className="icon-box icon-box-lg"><ExamIcon /></span>
                    <h1>{t.examTitle}</h1>
                    {placePill}
                    <p className="notice">{info}</p>
                    <button className="btn-primary" onClick={startExam} disabled={loading}>
                        {loading ? t.loading : (user && user.has_access ? t.startFull : t.startFree)}
                    </button>
                    {!(user && user.has_access) && (
                        <div>
                            <Link to="/pricing" className="btn-back">{t.seePlans}</Link>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (page === 'score') {
        const percent = Math.round((score / examQuestions.length) * 100)

        return (
            <div className="page">
                <div className="exam-card score-card">
                    <h1>{t.scoreTitle}</h1>
                    <div className={'score-ring' + (percent >= 80 ? ' score-pass' : '')} style={{ '--pct': percent }}>
                        <div className="score-ring-inner">
                            <span className="score-percent">{percent}%</span>
                            <span className="score-count">{score} / {examQuestions.length}</span>
                        </div>
                    </div>
                    <p className="score-message">{score >= examQuestions.length / 2 ? t.scoreGood : t.scoreOk}</p>
                    {mode === 'free' && (
                        <p className="notice">
                            {t.freeDone} <Link to="/pricing">{t.seePlans}</Link>
                        </p>
                    )}
                    <div className="exam-actions">
                        <button className="btn-back" onClick={() => navigate('/')}>
                            {t.back}
                        </button>
                        <button className="btn-next" onClick={() => setPage('start')}>
                            {t.tryAgain}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const question = examQuestions[current]
    const translated = Boolean(question[lang])
    const progress = ((current + (answered ? 1 : 0)) / examQuestions.length) * 100

    return (
        <div className="page exam">
            <div className="exam-top">
                <span className="progress">{current + 1} / {examQuestions.length}</span>
                <span className="exam-place"><PinIcon /> {region.name}</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: progress + '%' }} />
            </div>

            {!translated && <p className="lang-note">{t.englishOnly}</p>}

            <div className="exam-card" dir={translated ? undefined : 'ltr'}>
                <p className="question">{translated ? question[lang] : question.en}</p>
                {(translated ? question.options[lang] : question.options.en).map((option, index) => (
                    <button
                        className={
                            'btn-answer' +
                            (answered && index === question.correct ? ' answer-correct' : '') +
                            (answered && index === selected && index !== question.correct ? ' answer-wrong' : '')
                        }
                        key={current + '-' + index}
                        onClick={() => chooseAnswer(index)}
                    >
                        <span className="answer-letter">{'ABC'[index]}</span>
                        <span>{option}</span>
                    </button>
                ))}
                <p
                    className={
                        'message' +
                        (message === t.correct ? ' message-correct' : '') +
                        (message === t.wrong ? ' message-wrong' : '')
                    }
                >
                    {message}
                </p>
                <div className="exam-actions">
                    <button className="btn-back" onClick={() => navigate('/')}>
                        {t.back}
                    </button>
                    <button className="btn-next" onClick={goNext}>
                        {t.next}
                    </button>
                </div>
            </div>
            <p className="key-hint">{t.keyHint}</p>
        </div>
    )
}
export default Practice;
