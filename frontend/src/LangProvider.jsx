import { useEffect, useState } from 'react'
import { LangContext } from './lang-context.js'
import { translations } from './translations.js'

const LANGS = ['en', 'fa', 'de']

function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('lang')
    return LANGS.includes(saved) ? saved : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  }, [lang])

  function setLang(next) {
    localStorage.setItem('lang', next)
    setLangState(next)
  }

  const t = translations[lang]

  function tError(message) {
    return t.errors[message] || message
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t, tError }}>
      {children}
    </LangContext.Provider>
  )
}

export default LangProvider
