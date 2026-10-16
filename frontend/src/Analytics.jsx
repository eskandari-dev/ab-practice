import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPage } from './analytics.js'

// mounts once near the top of the app; sends a page view on every route change
function Analytics() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    trackPage(pathname + search)
  }, [pathname, search])

  return null
}

export default Analytics
