import { useState } from 'react'
import Login from './Login'

function App() {
  const [user, setUser] = useState(null)

  // Se l'utente non è loggato, mostra il login
  if (!user) {
    return <Login onLogin={setUser} />
  }

  // Se l'utente è loggato, mostra un messaggio di benvenuto
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Benvenuto, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <p>Qui più avanti verranno mostrati gli appuntamenti.</p>
    </div>
  )
}

export default App
