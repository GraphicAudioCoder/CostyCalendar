import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'

function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('costy_user')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem('costy_user')
        return null
      }
      return parsed.user || null
    } catch (e) {
      return null
    }
  })

  const handleLogin = (u) => {
    // Persist user for 30 days
    const ttl = 1 * 24 * 60 * 60 * 1000 // 30 giorni
    const payload = { user: u, expiresAt: Date.now() + ttl }
    try {
      localStorage.setItem('costy_user', JSON.stringify(payload))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Impossibile salvare lo user in localStorage', e)
    }
    setUser(u)
  }

  const handleLogout = () => {
    try { localStorage.removeItem('costy_user') } catch (e) {}
    setUser(null)
  }

  // Se l'utente non è loggato, mostra il login
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Se l'utente è loggato, mostra la dashboard
  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
