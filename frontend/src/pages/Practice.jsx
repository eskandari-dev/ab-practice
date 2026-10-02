import { useEffect, useState } from "react";
import { questions } from '../questions.js'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { countryName, findPlace, getSavedRegion } from '../places.js'
import { addResult, getMistakes, getStats, updateMistakes } from '../progress.js'
import { CheckIcon, ClockIcon, ExamIcon, PinIcon } from '../components/Icons.jsx'

const PASS_PERCENT = 80

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m + ':' + String(s).padStart(2, '0')
}

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
    const [answers, setAnswers] = useState([])
    const [seconds, setSeconds] = useState(0)
    const [stats, setStats] = useState(getStats)
    const [mistakes, setMistakes] = useState(() => getMistakes(regionId))

    function resetExam(list, newMode) {
        setExamQuestions(list)
        setMode(newMode)
        setCurrent(0)
        setScore(0)
        setMessage('')
        setAnswered(false)
        setSelected(null)
        setAnswers([])
        setSeconds(0)
        setPage('exam')
    }

    async function startExam() {
        setLoading(true)
        try {
            const data = await api('/exam/start', { method: 'POST', body: { region: regionId } })
            if (data.user) setUser(data.user)
            resetExam(data.questions, data.mode)
        } catch {
            resetExam(questions.slice(0, 5), 'free')
        }
        setLoading(false)
    }

    function startMistakes() {
        resetExam([...mistakes].sort(() => Math.random() - 0.5).slice(0, 20), 'mistakes')
    }

    function chooseAnswer(index) {
        if (answered) return

        setSelected(index)
        setAnswers([...answers, index])

        if (index === examQuestions[current].correct) {
            setMessage(t.correct)
            setScore(score + 1)
        } else {
            setMessage(t.wrong)
        }

        setAnswered(true)
    }

    function finishExam() {
        const wrong = examQuestions.filter((q, i) => answers[i] !== q.correct)
        const rightIds = examQuestions.filter((q, i) => answers[i] === q.correct).map((q) => q.id)
        updateMistakes(regionId, wrong, rightIds)
        addResult({ region: regionId, score, total: examQuestions.length, seconds })
        setStats(getStats())
        setMistakes(getMistakes(regionId))
        setPage('score')
    }

    function goNext() {
        if (!answered) return
        if (current + 1 < examQuestions.length) {
            setCurrent(current + 1)
            setMessage('')
            setAnswered(false)
            setSelected(null)
        } else {
            finishExam()
        }
    }

    useEffect(() => {
        if (page !== 'exam') return
        const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
        return () => clearInterval(timer)
    }, [page])

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

    function text(question) {
        return question[lang] ? question[lang] : question.en
    }

    function options(question) {
        return question.options[lang] ? question.options[lang] : question.options.en
    }

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
        const full = user && user.has_access
        let info = t.guestInfo
        if (user && user.unlimited_until) {
            info = t.unlimitedInfo + new Date(user.unlimited_until).toLocaleDateString()
        } else if (user && user.exams_left > 0) {
            info = t.examsLeftInfo + user.exams_left
        } else if (user) {
            info = t.noPlanInfo
        }

        return (
            <div className="page practice-home">
                <div className="exam-card exam-start">
                    <span className="icon-box icon-box-lg"><ExamIcon /></span>
                    <h1>{t.examTitle}</h1>
                    {placePill}

                    <div className="exam-facts">
                        <div><strong>{full ? 20 : 5}</strong><span>{t.infoQuestions}</span></div>
                        <div><strong>{PASS_PERCENT}%</strong><span>{t.infoPass}</span></div>
                        <div><strong>{t.noLimit}</strong><span>{t.infoTime}</span></div>
                    </div>

                    <p className="notice">{info}</p>
                    <button className="btn-primary" onClick={startExam} disabled={loading}>
                        {loading ? t.loading : (full ? t.startFull : t.startFree)}
                    </button>
                    <div className="start-links">
                        {mistakes.length > 0 && (
                            <button className="btn-back" onClick={startMistakes}>
                                {t.mistakesBtn} <span className="count-badge">{mistakes.length}</span>
                            </button>
                        )}
                        {!full && <Link to="/pricing" className="btn-back">{t.seePlans}</Link>}
                    </div>
                </div>

                {stats && (
                    <div className="progress-card">
                        <h2>{t.statsTitle}</h2>
                        <div className="progress-stats">
                            <div><strong>{stats.exams}</strong><span>{t.statExams}</span></div>
                            <div><strong>{stats.best}%</strong><span>{t.statBest}</span></div>
                            <div><strong>{stats.average}%</strong><span>{t.statAverage}</span></div>
                            <div><strong>{stats.streak}</strong><span>{t.statStreak}</span></div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (page === 'score') {
        const percent = Math.round((score / examQuestions.length) * 100)
        const passed = percent >= PASS_PERCENT
        const wrong = examQuestions
            .map((q, i) => ({ q, picked: answers[i] }))
            .filter((item) => item.picked !== item.q.correct)

        return (
            <div className="page">
                <div className="exam-card score-card">
                    <h1>{t.scoreTitle}</h1>
                    <span className={'result-badge' + (passed ? ' result-pass' : '')}>
                        {passed ? t.passed : t.failed}
                    </span>
                    <div className={'score-ring' + (passed ? ' score-pass' : '')} style={{ '--pct': percent }}>
                        <div className="score-ring-inner">
                            <span className="score-percent">{percent}%</span>
                            <span className="score-count">{score} / {examQuestions.length}</span>
                        </div>
                    </div>
                    <p className="score-time"><ClockIcon /> {t.timeTaken}: {formatTime(seconds)}</p>
                    <p className="score-message">{passed ? t.scoreGood : t.scoreOk}</p>
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

                <div className="review">
                    <h2>{t.reviewTitle}</h2>
                    {wrong.length === 0 && <p className="review-perfect"><CheckIcon /> {t.perfect}</p>}
                    {wrong.map(({ q, picked }) => (
                        <div className="review-item" key={q.id}>
                            <p className="review-question">{text(q)}</p>
                            <p className="review-wrong"><span>{t.yourAnswer}</span> {options(q)[picked]}</p>
                            <p className="review-right"><span>{t.correctAnswer}</span> {options(q)[q.correct]}</p>
                        </div>
                    ))}
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
                {mode === 'mistakes'
                    ? <span className="exam-place">{t.mistakesLabel}</span>
                    : <span className="exam-place"><PinIcon /> {region.name}</span>}
                <span className="exam-timer"><ClockIcon /> {formatTime(seconds)}</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: progress + '%' }} />
            </div>

            {!translated && <p className="lang-note">{t.englishOnly}</p>}

            <div className="exam-card" dir={translated ? undefined : 'ltr'}>
                <p className="question">{text(question)}</p>
                {options(question).map((option, index) => (
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
                    <button className="btn-next" onClick={goNext} disabled={!answered}>
                        {t.next}
                    </button>
                </div>
            </div>
            <p className="key-hint">{t.keyHint}</p>
        </div>
    )
}
export default Practice;
