import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'

function App() {
  const [user, setUser] = useState(null)

  const handleLogout = () => {
    setUser(null)
  }

  // Se l'utente non è loggato, mostra il login
  if (!user) {
    return <Login onLogin={setUser} />
  }

  // Se l'utente è loggato, mostra la dashboard
  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
