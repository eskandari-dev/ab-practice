import { useEffect, useState } from 'react'
import { LangContext } from './lang-context.js'
import { RTL_LANGUAGES } from './languages.js'
import { translations } from './translations.js'

function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('lang')
    return saved in translations ? saved : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr'
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
