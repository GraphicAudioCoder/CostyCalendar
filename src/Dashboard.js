import { useState, useEffect } from 'react'
import SimpleCalendar from './SimpleCalendar'
import styles from './Dashboard.module.css'
import { supabase } from './supabaseClient'

export default function Dashboard({ user, onLogout }) {
  const [appointments, setAppointments] = useState([])
  const [allAppointments, setAllAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [viewFilter, setViewFilter] = useState('all') // 'all', 'mine', 'others'
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    fetchAllAppointments()
  }, [user])

  const fetchAllAppointments = async () => {
    setLoading(true)
    
    // Ottieni tutti gli appuntamenti con i partecipanti
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointments_users(user_email),
        creator:created_by(name, email)
      `)
      .order('start_time', { ascending: true })
    
    if (error) {
      console.error('Errore nel caricamento appuntamenti:', error)
    } else {
      setAllAppointments(data || [])
      
      // Filtra solo quelli a cui partecipo
      const myAppointments = data?.filter(apt => 
        apt.appointments_users.some(user_apt => user_apt.user_email === user.email)
      ) || []
      setAppointments(myAppointments)
    }
    setLoading(false)
  }

  const getDisplayedAppointments = () => {
    switch(viewFilter) {
      case 'mine':
        return allAppointments.filter(apt => apt.created_by === user.email)
      case 'others':
        return allAppointments.filter(apt => 
          apt.created_by !== user.email && 
          apt.appointments_users.some(user_apt => user_apt.user_email === user.email)
        )
      case 'available':
        return allAppointments.filter(apt => 
          !apt.appointments_users.some(user_apt => user_apt.user_email === user.email) &&
          apt.appointments_users.length < 2
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
    const { error } = await supabase
      .from('appointments_users')
      .insert({
        appointment_id: appointmentId,
        user_email: user.email
      })
    
    if (!error) {
      fetchAllAppointments()
    }
  }

  const leaveAppointment = async (appointmentId) => {
    const { error } = await supabase
      .from('appointments_users')
      .delete()
      .eq('appointment_id', appointmentId)
      .eq('user_email', user.email)
    
    if (!error) {
      fetchAllAppointments()
    }
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
    return appointment.appointments_users.some(user_apt => user_apt.user_email === user.email)
  }

  const canJoinAppointment = (appointment) => {
    return !isUserParticipating(appointment) && appointment.appointments_users.length < 2
  }

  return (
    <div className={styles.dashboard}>
      {/* Header compatto */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CostyPlanner</h1>
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
                Con me
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
              onClick={() => setShowNewAppointment(true)}
            >
              + Nuovo
            </button>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <button className={styles.logoutButton} onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Calendario e informazioni in un unico pannello */}
        <div className={styles.calendarSection}>
          <SimpleCalendar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            appointments={getDisplayedAppointments()}
            user={user}
            viewFilter={viewFilter}
          />
          
          {/* Sezione informazioni data integrata nel calendario */}
          <div className={styles.dateInfo}>
            <h3>{formatDate(selectedDate)}</h3>
            
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <p className={styles.noEvents}>Nessun appuntamento</p>
            ) : (
              <div className={styles.dayAppointments}>
                {getAppointmentsForDate(selectedDate).map(apt => (
                  <div key={apt.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentHeader}>
                      <div className={styles.appointmentTitle}>{apt.title}</div>
                      <div className={styles.appointmentTime}>
                        {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                      </div>
                    </div>
                    
                    {apt.description && (
                      <div className={styles.appointmentDescription}>{apt.description}</div>
                    )}
                    
                    <div className={styles.appointmentMeta}>
                      <div className={styles.creator}>
                        Creato da: {apt.created_by === user.email ? 'Te' : apt.creator?.name || apt.created_by}
                      </div>
                      <div className={styles.participants}>
                        Partecipanti: {apt.appointments_users.length}/2
                      </div>
                    </div>

                    <div className={styles.appointmentActions}>
                      {canJoinAppointment(apt) && (
                        <button 
                          className={styles.joinButton}
                          onClick={() => joinAppointment(apt.id)}
                        >
                          Unisciti
                        </button>
                      )}
                      {isUserParticipating(apt) && apt.created_by !== user.email && (
                        <button 
                          className={styles.leaveButton}
                          onClick={() => leaveAppointment(apt.id)}
                        >
                          Abbandona
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal per nuovo appuntamento (placeholder) */}
      {showNewAppointment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Nuovo Appuntamento</h3>
            <p>Form per creare nuovo appuntamento (da implementare)</p>
            <button onClick={() => setShowNewAppointment(false)}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  )
}
