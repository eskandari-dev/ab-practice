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
    // "Some error (detail)": translate the error, keep the technical detail as it is
    const [, base, detail = ''] = message.match(/^(.*?)( \([^()]+\))?$/s)
    return (t.errors[base] || base) + detail
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t, tError }}>
      {children}
    </LangContext.Provider>
  )
}

export default LangProvider
