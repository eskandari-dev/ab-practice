import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useLang } from './lang-context.js'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Practice from './pages/Practice.jsx'
import Pricing from './pages/Pricing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import Terms from './pages/Terms.jsx'
import Admin from './pages/Admin.jsx'
import Progress from './pages/Progress.jsx'
import NotFound from './pages/NotFound.jsx'

function pageTitle(path, t) {
  const titles = {
    '/practice': t.nav.practice,
    '/progress': t.progress.title,
    '/pricing': t.nav.pricing,
    '/login': t.nav.login,
    '/register': t.nav.signup,
    '/terms': t.footer.terms,
    '/admin': 'Admin',
  }
  return titles[path] ? titles[path] + ' · AB Practice' : 'AB Practice – Driving Theory Practice Tests'
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
