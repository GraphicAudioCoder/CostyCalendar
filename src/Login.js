import { useState } from 'react'
import styles from './Login.module.css'
import { supabase } from './supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !name) {
      setError('Inserisci nome e email')
      return
    }

    // Inserisce l'utente in app_users se non esiste
    const { data, error } = await supabase
      .from('app_users')
      .upsert({ email, name }, { onConflict: 'email' })
      .select()
    
    if (error) {
      setError(error.message)
    } else {
      setError('')
      onLogin({ email, name }) // passa l'utente loggato al componente principale
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.loginBox} onSubmit={handleLogin}>
        <h2>CostyCalendar</h2>
        {error && <p style={{color:'red'}}>{error}</p>}
        <input
          type="text"
          placeholder="Nome"
          className={styles.inputField}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className={styles.inputField}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className={styles.loginButton}>Accedi</button>
      </form>
    </div>
  )
}
