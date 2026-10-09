import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { useLang } from '../lang-context.js'

const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/13.0.0'
const IGNORED_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']

let firebasePromise = null

function loadFirebase(config) {
  if (!firebasePromise) {
    firebasePromise = Promise.all([
      import(/* @vite-ignore */ `${FIREBASE_SDK}/firebase-app.js`),
      import(/* @vite-ignore */ `${FIREBASE_SDK}/firebase-auth.js`),
    ]).then(([app, auth]) => ({
      auth: auth.getAuth(app.initializeApp(config)),
      GoogleAuthProvider: auth.GoogleAuthProvider,
      signInWithPopup: auth.signInWithPopup,
      signOut: auth.signOut,
    }))
  }
  return firebasePromise
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}

function GoogleButton({ onDone, onError }) {
  const { loginWithGoogle } = useAuth()
  const { lang, t } = useLang()
  const [config, setConfig] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const firebase = useRef(null)

  useEffect(() => {
    api('/config')
      .then((data) => setConfig(data.firebase || null))
      .catch(() => setConfig(null))
  }, [])

  // load Firebase before the click: browsers block popups opened after a slow await
  useEffect(() => {
    if (!config) return
    loadFirebase(config)
      .then((fb) => {
        firebase.current = fb
      })
      .catch(() => {
        firebasePromise = null
      })
  }, [config])

  async function signIn() {
    const fb = firebase.current
    if (!fb) return onError('Google login failed')
    setBusy(true)
    try {
      fb.auth.languageCode = lang
      const result = await fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider())
      const idToken = await result.user.getIdToken()
      // the site keeps its own session, so the Firebase one is not needed after this
      await fb.signOut(fb.auth)
      await loginWithGoogle(idToken)
      onDone()
    } catch (err) {
      if (!IGNORED_ERRORS.includes(err.code)) onError(err.code ? 'Google login failed' : err.message)
    }
    setBusy(false)
  }

  if (config === undefined) return <div className="google-box" />

  return (
    <button
      type="button"
      className="google-fallback"
      onClick={signIn}
      disabled={!config || busy}
      title={config ? undefined : t.login.googleOff}
    >
      <GoogleLogo /> {t.login.google}
    </button>
  )
}

export default GoogleButton
