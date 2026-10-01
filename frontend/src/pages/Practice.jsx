import { useState } from "react";
import { questions } from '../questions.js'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'

function Practice() {
    const navigate = useNavigate()
    const { user, setUser } = useAuth()
    const { lang, setLang } = useLang()
    const [page, setPage] = useState("start");
    const [message, setMessage] = useState('')
    const [current, setCurrent] = useState(0)
    const [score, setScore] = useState(0)
    const [answered, setAnswered] = useState(false)
    const [selected, setSelected] = useState(null)
    const [examQuestions, setExamQuestions] = useState([])
    const [mode, setMode] = useState('free')
    const [loading, setLoading] = useState(false)
    const texts = {
        en: {
            examTitle: 'Practice Exam',
            back: 'Back to Home',
            next: 'Next',
            correct: 'Correct',
            wrong: 'Wrong',
            scoreTitle: 'Your Score',
            tryAgain: 'Try Again',
            scoreGood: 'Great job! You are ready to practice more.',
            scoreOk: 'Good try. Practice again to improve.',
            guestInfo: 'Try a free exam with 5 questions. Sign up and choose a plan to get full exams with 20 questions.',
            noPlanInfo: 'You have no full exams left. You can take a free exam with 5 questions, or choose a plan.',
            examsLeftInfo: 'Full exams left: ',
            unlimitedInfo: 'You have unlimited full exams until ',
            startFree: 'Start free exam',
            startFull: 'Start full exam (20 questions)',
            seePlans: 'See plans',
            loading: 'Loading...',
            freeDone: 'This was the free exam. Get full exams with 20 questions.',
        },
        fa: {
            examTitle: 'آزمون تمرینی',
            back: 'بازگشت به خانه',
            next: 'بعدی',
            correct: 'درست',
            wrong: 'غلط',
            scoreTitle: 'امتیاز شما',
            tryAgain: 'دوباره تلاش کن',
            scoreGood: 'عالی! آماده تمرین بیشتر هستی.',
            scoreOk: 'خوب بود. برای بهتر شدن دوباره تمرین کن.',
            guestInfo: 'یک آزمون رایگان با ۵ سوال امتحان کن. برای آزمون کامل با ۲۰ سوال، ثبت‌نام کن و یک پلن انتخاب کن.',
            noPlanInfo: 'آزمون کامل باقی‌مانده نداری. می‌توانی آزمون رایگان ۵ سوالی بدهی یا یک پلن انتخاب کنی.',
            examsLeftInfo: 'آزمون‌های کامل باقی‌مانده: ',
            unlimitedInfo: 'آزمون کامل نامحدود داری تا ',
            startFree: 'شروع آزمون رایگان',
            startFull: 'شروع آزمون کامل (۲۰ سوال)',
            seePlans: 'دیدن پلن‌ها',
            loading: 'در حال بارگذاری...',
            freeDone: 'این آزمون رایگان بود. برای آزمون کامل ۲۰ سوالی یک پلن بگیر.',
        },
        de: {
            examTitle: 'Übungsprüfung',
            back: 'Zurück zur Startseite',
            next: 'Weiter',
            correct: 'Richtig',
            wrong: 'Falsch',
            scoreTitle: 'Dein Ergebnis',
            tryAgain: 'Nochmal versuchen',
            scoreGood: 'Super! Du kannst noch mehr üben.',
            scoreOk: 'Guter Versuch. Übe noch einmal.',
            guestInfo: 'Mach eine kostenlose Prüfung mit 5 Fragen. Registriere dich und wähle einen Plan für volle Prüfungen mit 20 Fragen.',
            noPlanInfo: 'Du hast keine vollen Prüfungen mehr. Du kannst eine kostenlose Prüfung mit 5 Fragen machen oder einen Plan wählen.',
            examsLeftInfo: 'Verbleibende volle Prüfungen: ',
            unlimitedInfo: 'Du hast unbegrenzte volle Prüfungen bis ',
            startFree: 'Kostenlose Prüfung starten',
            startFull: 'Volle Prüfung starten (20 Fragen)',
            seePlans: 'Pläne ansehen',
            loading: 'Wird geladen...',
            freeDone: 'Das war die kostenlose Prüfung. Hol dir volle Prüfungen mit 20 Fragen.',
        },
    }

    const t = texts[lang]

    async function startExam() {
        setLoading(true)
        try {
            const data = await api('/exam/start', { method: 'POST' })
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

    const langButtons = (
        <div>
            <button className="lang-btn" onClick={() => setLang('en')}>English</button>
            <button className="lang-btn" onClick={() => setLang('fa')}>فارسی</button>
            <button className="lang-btn" onClick={() => setLang('de')}>Deutsch</button>
        </div>
    )

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
                <h1>{t.examTitle}</h1>
                {langButtons}
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
        )
    }

    if (page === 'score') {
        return (
            <div>
                <h1>{t.scoreTitle}</h1>
                <p className="score-number">
                    {score} / {examQuestions.length}
                </p>
                <p className="score-message">  {score >= examQuestions.length / 2 ? t.scoreGood : t.scoreOk} </p>
                {mode === 'free' && (
                    <p className="notice">
                        {t.freeDone} <Link to="/pricing">{t.seePlans}</Link>
                    </p>
                )}
                <button
                    className="btn-primary"
                    onClick={() => setPage('start')}
                >
                    {t.tryAgain}
                </button>
                <button
                    className="btn-back"
                    onClick={() => navigate('/')}
                >
                    {t.back}
                </button>
            </div>
        )
    }

    return (
        <div>
            <h1>{t.examTitle}</h1>
            <p className="progress">
                {current + 1} / {examQuestions.length}
            </p>
            {langButtons}
            <p
                className={
                    'message' +
                    (message === t.correct ? ' message-correct' : '') +
                    (message === t.wrong ? ' message-wrong' : '')
                }
            >
                {message}
            </p>
            <p className="question">{examQuestions[current][lang]}</p>
            {examQuestions[current].options[lang].map((option, index) => (
                <button
                    className={
                        'btn-answer' +
                        (answered && index === examQuestions[current].correct
                            ? ' answer-correct'
                            : '') +
                        (answered && index === selected && index !== examQuestions[current].correct ? ' answer-wrong'
                            : '')
                    }
                    key={index}
                    onClick={() => {
                        if (answered) return

                        setSelected(index)

                        if (index === examQuestions[current].correct) {
                            setMessage(t.correct)
                            setScore(score + 1)
                        } else {
                            setMessage(t.wrong)
                        }

                        setAnswered(true)
                    }}
                >
                    {option}
                </button>
            ))}
            <button
                className="btn-next"
                onClick={() => {
                    if (current + 1 < examQuestions.length) {
                        setCurrent(current + 1)
                        setMessage('')
                        setAnswered(false)
                        setSelected(null)
                    } else {
                        setPage('score')
                    }
                }}
            >
                {t.next}
            </button>
            <button
                className="btn-back"
                onClick={() => navigate('/')}
            >
                {t.back}
            </button>
        </div>
    )
}
export default Practice;
