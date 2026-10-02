import { useEffect, useState } from "react";
import { questions } from '../questions.js'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'
import { ExamIcon } from '../components/Icons.jsx'

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
            keyHint: 'Tip: press 1, 2 or 3 to answer, and Enter for the next question.',
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
            keyHint: 'نکته: برای جواب دادن ۱، ۲ یا ۳ را بزن و برای سوال بعدی Enter.',
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
            keyHint: 'Tipp: Drücke 1, 2 oder 3 zum Antworten und Enter für die nächste Frage.',
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

    const langButtons = (
        <div className="lang-group">
            <button className={'lang-btn' + (lang === 'en' ? ' lang-active' : '')} onClick={() => setLang('en')}>English</button>
            <button className={'lang-btn' + (lang === 'fa' ? ' lang-active' : '')} onClick={() => setLang('fa')}>فارسی</button>
            <button className={'lang-btn' + (lang === 'de' ? ' lang-active' : '')} onClick={() => setLang('de')}>Deutsch</button>
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
                <div className="exam-card exam-start">
                    <span className="icon-box icon-box-lg"><ExamIcon /></span>
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
    const progress = ((current + (answered ? 1 : 0)) / examQuestions.length) * 100

    return (
        <div className="page exam">
            <div className="exam-top">
                <span className="progress">{current + 1} / {examQuestions.length}</span>
                {langButtons}
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: progress + '%' }} />
            </div>

            <div className="exam-card">
                <p className="question">{question[lang]}</p>
                {question.options[lang].map((option, index) => (
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
