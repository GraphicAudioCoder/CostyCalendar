import { useState, useEffect } from 'react'
import styles from './Login.module.css'
import { supabase } from './supabaseClient'

export default function Login({ onLogin }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_users')
        .select('email, name')
        .order('name', { ascending: true })
      if (error) setError(error.message)
      else setAccounts(data || [])
      setLoading(false)
    }
    fetchAccounts()
  }, [])

  const handleSelect = (account) => {
    setSelectedAccount(account)
    setShowConfirm(true)
  }

  const handleConfirmLogin = () => {
    onLogin(selectedAccount)
    setShowConfirm(false)
    setSelectedAccount(null)
  }

  const handleCancelLogin = () => {
    setShowConfirm(false)
    setSelectedAccount(null)
  }

  const handleNewAccount = async (e) => {
    e.preventDefault()
    if (!email || !name) {
      setError('Inserisci nome e email')
      return
    }

    const { error } = await supabase
      .from('app_users')
      .upsert({ email, name }, { onConflict: 'email' })
      .select()

    if (error) {
      setError(error.message)
    } else {
      setError('')
      setShowNew(false)
      setEmail('')
      setName('')
      // Aggiorna la lista account
      const { data: updated } = await supabase
        .from('app_users')
        .select('email, name')
        .order('name', { ascending: true })
      setAccounts(updated || [])
      onLogin({ email, name })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2>CostyCalendar</h2>
        {error && <p style={{color:'red'}}>{error}</p>}

        {!showNew ? (
          <>
            <div className={styles.accountsList}>
              {loading ? (
                <div className={styles.centerText}>Caricamento...</div>
              ) : accounts.length === 0 ? (
                <div className={styles.centerText}>Nessun account trovato</div>
              ) : (
                accounts.map(acc => (
                  <div key={acc.email} className={styles.accountRow} onClick={() => handleSelect(acc)}>
                    <div>
                      <div className={styles.accountName}>{acc.name}</div>
                      <div className={styles.accountEmail}>{acc.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className={styles.loginButton} onClick={() => setShowNew(true)}>Nuovo account</button>
          </>
        ) : (
          <form onSubmit={handleNewAccount}>
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
            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.loginButton}>Crea e accedi</button>
              <button type="button" className={styles.cancelButton} onClick={() => setShowNew(false)}>Annulla</button>
            </div>
          </form>
        )}
      </div>
      
      {/* Popup di conferma */}
      {showConfirm && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h3>Conferma accesso</h3>
            <div className={styles.confirmAccount}>
              <div className={styles.accountName}>{selectedAccount?.name}</div>
              <div className={styles.accountEmail}>{selectedAccount?.email}</div>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.loginButton} onClick={handleConfirmLogin}>Conferma</button>
              <button className={styles.cancelButton} onClick={handleCancelLogin}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
