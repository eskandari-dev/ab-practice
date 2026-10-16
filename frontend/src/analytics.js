// Google Analytics 4 — only starts when VITE_GA_MEASUREMENT_ID is set at build time
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function initAnalytics() {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return
  if (window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID
  document.head.appendChild(script)
}

export function trackPage(path) {
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
  })
}
