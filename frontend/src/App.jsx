import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { SHOW_PRICING } from './features.js'
import { useLang } from './lang-context.js'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Practice from './pages/Practice.jsx'
import Pricing from './pages/Pricing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import NotFound from './pages/NotFound.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Skeleton from './components/Skeleton.jsx'

// pages that few visitors open are loaded only when needed
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Progress = lazy(() => import('./pages/Progress.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Feedback = lazy(() => import('./pages/Feedback.jsx'))

function PageLoading() {
  return <Skeleton />
}

function pageTitle(path, t) {
  const titles = {
    '/practice': t.nav.practice,
    '/progress': t.progress.title,
    '/account': t.account.title,
    '/pricing': t.nav.pricing,
    '/login': t.nav.login,
    '/register': t.nav.signup,
    '/terms': t.footer.terms,
    '/feedback': t.feedback.title,
    '/admin': 'Admin',
  }
  return titles[path] ? titles[path] + ' · Road Ready' : 'Road Ready – Driving Theory Practice Tests'
}

function App() {
  const { pathname } = useLocation()
  const { t } = useLang()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.title = pageTitle(pathname, t)
  }, [pathname, t])

  return (
    <>
      <Navbar />
      <main className="main">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/pricing" element={SHOW_PRICING ? <Pricing /> : <Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/account" element={<Account />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  )
}

export default App
