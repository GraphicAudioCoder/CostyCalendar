import { useState, useEffect } from 'react'
import SimpleCalendar from './SimpleCalendar'
import styles from './Dashboard.module.css'
import { db } from './firebaseClient'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore'

export default function Dashboard({ user, onLogout }) {
  const [appointments, setAppointments] = useState([])
  const [allAppointments, setAllAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [viewFilter, setViewFilter] = useState('all') // 'all', 'mine', 'others', 'available'
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [usersMap, setUsersMap] = useState({})
  // New appointment form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  // helper to format a Date to YYYY-MM-DD in local timezone
  const formatLocalDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const [newDate, setNewDate] = useState(() => formatLocalDate(selectedDate))
  // default to 09:00-10:00; will be overridden by saved preference when opening modal
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('10:00')

  useEffect(() => {
    fetchAllAppointments()
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const map = {};
      snapshot.docs.forEach(doc => {
        const user = doc.data();
        map[user.email] = user.name;
      });
      setUsersMap(map);
    } catch (e) {
      console.error('Errore caricamento utenti', e);
    }
  }

  const fetchAllAppointments = async () => {
    setLoading(true)
    
    try {
      const q = query(collection(db, 'appointments'), orderBy('start_time', 'asc'));
      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAllAppointments(appointments || []);
      
      // Filtra solo quelli a cui partecipo
      const myAppointments = appointments?.filter(apt => 
        apt.participants && apt.participants.includes(user.email)
      ) || [];
      setAppointments(myAppointments);
    } catch (error) {
      console.error('Errore nel caricamento appuntamenti:', error);
    }
    setLoading(false);
  }

  const getDisplayedAppointments = () => {
    switch(viewFilter) {
      case 'mine':
        // Tutti gli appuntamenti dove partecipo
        return allAppointments.filter(apt => 
          apt.participants && apt.participants.includes(user.email)
        )
      case 'others':
        // Solo appuntamenti dove partecipo e c'è almeno un altro partecipante
        return allAppointments.filter(apt => 
          apt.participants && apt.participants.includes(user.email) &&
          apt.participants.length > 1
        )
      case 'available':
        return allAppointments.filter(apt => 
          apt.participants && !apt.participants.includes(user.email) &&
          apt.participants.length < 2
        )
      default:
        return allAppointments
    }
  }

  const getAppointmentsForDate = (date) => {
    const displayed = getDisplayedAppointments()
    return displayed.filter(apt => {
      const aptDate = new Date(apt.start_time).toDateString()
      return aptDate === date.toDateString()
    })
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    const dayAppointments = getAppointmentsForDate(date)
    if (dayAppointments.length === 1) {
      setSelectedAppointment(dayAppointments[0])
    } else {
      setSelectedAppointment(null)
    }
  }

  const joinAppointment = async (appointmentId) => {
    try {
      const appointment = allAppointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        const updatedParticipants = [...(appointment.participants || []), user.email];
        await updateDoc(doc(db, 'appointments', appointmentId), {
          participants: updatedParticipants
        });
        await fetchAllAppointments();
      }
    } catch (error) {
      console.error('Errore join:', error);
    }
  }

  const leaveAppointment = async (appointmentId) => {
    try {
      const appointment = allAppointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        const updatedParticipants = (appointment.participants || []).filter(email => email !== user.email);
        
        if (updatedParticipants.length === 0) {
          // Elimina l'appuntamento se non ci sono più partecipanti
          await deleteDoc(doc(db, 'appointments', appointmentId));
        } else {
          // Aggiorna la lista partecipanti
          await updateDoc(doc(db, 'appointments', appointmentId), {
            participants: updatedParticipants
          });
        }
        await fetchAllAppointments();
      }
    } catch (error) {
      console.error('Errore leave:', error);
    }
  }

  const deleteAppointment = async (appointmentId) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      await fetchAllAppointments();
    } catch (error) {
      console.error('Errore delete appointment:', error);
    }
  }

  // Edit appointment
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('09:00')
  const [editEndTime, setEditEndTime] = useState('10:00')

  const openEditAppointment = (apt) => {
    setEditingAppointment(apt)
    setEditTitle(apt.title || '')
    setEditDescription(apt.description || '')
    // use local date formatting
    const start = new Date(apt.start_time)
    setEditDate(formatLocalDate(start))
    setEditStartTime(start.toTimeString().slice(0,5))
    const end = new Date(apt.end_time)
    setEditEndTime(end.toTimeString().slice(0,5))
  }

  const saveEditAppointment = async (e) => {
    e.preventDefault()
    if (!editingAppointment) return
    try {
      const [y, m, d] = editDate.split('-').map(s => parseInt(s, 10))
      const [sh, sm] = editStartTime.split(':').map(s => parseInt(s, 10))
      const [eh, em] = editEndTime.split(':').map(s => parseInt(s, 10))
      const start = new Date(y, m - 1, d, sh, sm, 0)
      const end = new Date(y, m - 1, d, eh, em, 0)
      
      await updateDoc(doc(db, 'appointments', editingAppointment.id), {
        title: editTitle,
        description: editDescription,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
      
      setEditingAppointment(null)
      await fetchAllAppointments()
    } catch (err) { 
      console.error(err) 
    }
  }

  const createAppointment = async (e) => {
    e.preventDefault()
    try {
      // Build Date objects in local timezone from date + time input components
      const [y, m, d] = newDate.split('-').map(s => parseInt(s, 10))
      const [sh, sm] = newStartTime.split(':').map(s => parseInt(s, 10))
      const [eh, em] = newEndTime.split(':').map(s => parseInt(s, 10))
      const start = new Date(y, m - 1, d, sh, sm, 0)
      const end = new Date(y, m - 1, d, eh, em, 0)
      
      await addDoc(collection(db, 'appointments'), {
        title: newTitle,
        description: newDescription,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        created_by: user.email,
        participants: [user.email] // Il creatore è automaticamente partecipante
      });

      // refresh
      await fetchAllAppointments()
      setShowNewAppointment(false)
      setNewTitle('')
      setNewDescription('')
      // save last used times so next time the form can default to them
      try {
        localStorage.setItem('costy_last_times', JSON.stringify({ start: newStartTime, end: newEndTime }))
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openNewAppointment = (dateArg) => {
    const base = dateArg || selectedDate
  const localDate = formatLocalDate(base)
  setNewDate(localDate)
    // try to load last used times from localStorage, fallback to 09:00-10:00
    try {
      const saved = JSON.parse(localStorage.getItem('costy_last_times'))
      if (saved && saved.start && saved.end) {
        setNewStartTime(saved.start)
        setNewEndTime(saved.end)
      } else {
        setNewStartTime('09:00')
        setNewEndTime('10:00')
      }
    } catch (e) {
      setNewStartTime('09:00')
      setNewEndTime('10:00')
    }
    setShowNewAppointment(true)
  }

  const formatTime = (dateString) => {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const isUserParticipating = (appointment) => {
    return appointment.participants && appointment.participants.includes(user.email)
  }

  const canJoinAppointment = (appointment) => {
    return !isUserParticipating(appointment) && appointment.participants && appointment.participants.length < 2
  }

  return (
    <div className={styles.dashboard}>
      {/* Header compatto */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CostyPlanner</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <button className={styles.logoutButton} onClick={() => setShowLogoutConfirm(true)}>
              Logout
            </button>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.filterButtons}>
              <button 
                className={`${styles.filterBtn} ${viewFilter === 'all' ? styles.active : ''}`}
                onClick={() => setViewFilter('all')}
              >
                Tutti
              </button>
              <button 
                className={`${styles.filterBtn} ${viewFilter === 'mine' ? styles.active : ''}`}
                onClick={() => setViewFilter('mine')}
              >
                Miei
              </button>
              <button 
                className={`${styles.filterBtn} ${viewFilter === 'others' ? styles.active : ''}`}
                onClick={() => setViewFilter('others')}
              >
                In due
              </button>
              <button 
                className={`${styles.filterBtn} ${viewFilter === 'available' ? styles.active : ''}`}
                onClick={() => setViewFilter('available')}
              >
                Disponibili
              </button>
            </div>
            <button 
              className={styles.newAppointmentButton}
              onClick={() => openNewAppointment(selectedDate)}
            >
              + Nuovo
            </button>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Pannello principale vuoto per ora */}
        <div className={styles.calendarSection}>
          <SimpleCalendar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            appointments={getDisplayedAppointments()}
          />

          {/* Sezione informazioni data integrata */}
          <div className={styles.dateInfo}>
            <h3>{formatDate(selectedDate)}</h3>
            <div className={styles.dayAppointments}>
              {getAppointmentsForDate(selectedDate).length === 0 ? (
                <p className={styles.noEvents}>Nessun appuntamento</p>
              ) : (
                [...getAppointmentsForDate(selectedDate)]
                  .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                  .map(apt => (
                    <div key={apt.id} className={styles.appointmentCard}>
                      <div className={styles.appointmentHeader}>
                        <div className={styles.appointmentTitle}>{apt.title}</div>
                        <div className={styles.appointmentTime}>{formatTime(apt.start_time)} - {formatTime(apt.end_time)}</div>
                      </div>
                      <div className={styles.appointmentDescription}>{apt.description}</div>
                      <div className={styles.appointmentMeta}>
                        <div className={styles.creator}>Creatore: {usersMap[apt.created_by] || apt.created_by}</div>
                        <div className={styles.participants}>
                          Partecipanti:
                          <ul style={{margin: '4px 0 0 0', paddingLeft: '18px'}}>
                            {(apt.participants || []).map(email => {
                              const nome = usersMap[email] || '';
                              return (
                                <li key={email}>
                                  <span>{nome || email}</span><br />
                                  <span style={{fontSize: '0.95em', color: '#555'}}>{email}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                      <div className={styles.appointmentActions}>
                        {apt.created_by === user.email ? (
                          // creator: can edit, leave, and delete
                          <>
                            <button className={styles.joinButton} onClick={() => openEditAppointment(apt)}>Modifica</button>
                            <button className={styles.leaveButton} onClick={() => leaveAppointment(apt.id)}>Esci</button>
                            <button className={styles.leaveButton} onClick={() => deleteAppointment(apt.id)}>Elimina</button>
                          </>
                        ) : isUserParticipating(apt) ? (
                          // participant: can only leave
                          <button className={styles.leaveButton} onClick={() => leaveAppointment(apt.id)}>Esci</button>
                        ) : canJoinAppointment(apt) ? (
                          <button className={styles.joinButton} onClick={() => joinAppointment(apt.id)}>Unisciti</button>
                        ) : (
                          <button className={styles.joinButton} disabled>Completo</button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal per nuovo appuntamento (placeholder) */}
      {showNewAppointment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Nuovo Appuntamento</h3>
            <form onSubmit={createAppointment} style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <input
                required
                placeholder="Titolo"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={styles.inputField}
              />
              <textarea
                placeholder="Descrizione"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className={styles.inputField}
                rows={3}
              />
              <div style={{display:'flex', gap: '8px'}}>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required className={styles.inputField} />
                <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} required className={styles.inputField} />
                <input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} required className={styles.inputField} />
              </div>
              <div style={{display:'flex', gap: '8px', justifyContent: 'center'}}>
                <button type="submit" className={styles.newAppointmentButton}>Crea</button>
                <button type="button" className={styles.cancelButton} onClick={() => setShowNewAppointment(false)}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal per modifica appuntamento */}
      {editingAppointment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Modifica Appuntamento</h3>
            <form onSubmit={saveEditAppointment} style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <input
                required
                placeholder="Titolo"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={styles.inputField}
              />
              <textarea
                placeholder="Descrizione"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={styles.inputField}
                rows={3}
              />
              <div style={{display:'flex', gap: '8px'}}>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required className={styles.inputField} />
                <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} required className={styles.inputField} />
                <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} required className={styles.inputField} />
              </div>
              <div style={{display:'flex', gap: '8px', justifyContent: 'center'}}>
                <button type="submit" className={styles.newAppointmentButton}>Salva</button>
                <button type="button" className={styles.cancelButton} onClick={() => setEditingAppointment(null)}>Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Logout Modal */}
      {showLogoutConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Conferma logout</h3>
            <p>Sei sicuro di voler effettuare il logout?</p>
            <div style={{display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px'}}>
              <button
                className={styles.newAppointmentButton}
                onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
              >
                Conferma
              </button>
              <button
                className={styles.logoutButton}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}