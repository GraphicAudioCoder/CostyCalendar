import { useState, useEffect } from 'react'
import styles from './Login.module.css'
import { db } from './firebaseClient'
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore'

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
      try {
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => doc.data());
        setAccounts(users);
        setError('');
      } catch (err) {
        setError('Errore nel caricamento utenti');
      }
      setLoading(false);
      };
      fetchAccounts();
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
      try {
        // Aggiungi nuovo utente a Firestore
        await addDoc(collection(db, 'users'), { email, name });
        setError('');
        setShowNew(false);
        setEmail('');
        setName('');
        // Aggiorna la lista account
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const updated = snapshot.docs.map(doc => doc.data());
        setAccounts(updated || []);
        onLogin({ email, name });
      } catch (err) {
        setError('Errore nella creazione account');
      }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2>CostyPlanner</h2>
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
