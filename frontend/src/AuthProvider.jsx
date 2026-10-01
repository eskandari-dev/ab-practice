import { useEffect, useState } from 'react'
import { api } from './api.js'
import { AuthContext } from './auth-context.js'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api('/me')
      .then(setUser)
      .catch((err) => {
        if (err.status === 401) localStorage.removeItem('token')
      })
  }, [])

  async function login(email, password) {
    const data = await api('/login', { method: 'POST', body: { email, password } })
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }

  async function register(email, password) {
    const data = await api('/register', { method: 'POST', body: { email, password } })
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST' })
    } catch {
      // the token is removed below anyway
    }
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
