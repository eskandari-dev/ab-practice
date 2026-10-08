import { useState } from 'react'
import { useLang } from '../lang-context.js'
import { MoonIcon, SunIcon } from './Icons.jsx'

function ThemeToggle() {
  const { t } = useLang()
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light')
  const dark = theme === 'dark'

  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  const label = dark ? t.nav.lightMode : t.nav.darkMode
  return (
    <button className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export default ThemeToggle
