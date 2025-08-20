import { useState } from 'react'
import styles from './SimpleCalendar.module.css'

export default function SimpleCalendar({ selectedDate, onDateChange, appointments = [] }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth())
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear())

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  // Set week headers to start on Monday
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month, year) => {
    // Shift so week starts on Monday (0 = Monday, ... 6 = Sunday)
    return (new Date(year, month, 1).getDay() + 6) % 7
  }

  const hasAppointments = (day) => {
    const date = new Date(currentYear, currentMonth, day)
    return appointments.some(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  const isToday = (day) => {
    const today = new Date()
    const date = new Date(currentYear, currentMonth, day)
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (day) => {
    const date = new Date(currentYear, currentMonth, day)
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleDateClick = (day) => {
    const newDate = new Date(currentYear, currentMonth, day)
    onDateChange(newDate)
  }

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Giorni vuoti all'inizio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>)
    }

    // Giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const dayClasses = [styles.calendarDay]
      
      if (isToday(day)) dayClasses.push(styles.today)
      if (isSelected(day)) dayClasses.push(styles.selected)
      if (hasAppointments(day)) dayClasses.push(styles.hasAppointments)

      days.push(
        <div
          key={day}
          className={dayClasses.join(' ')}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {hasAppointments(day) && <div className={styles.appointmentDot}></div>}
        </div>
      )
    }

    return days
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button
          className={`${styles.navButton} ${styles.prev}`}
          onClick={previousMonth}
          aria-label="Mese precedente"
        />
        <h3 className={styles.monthYear}>
          {months[currentMonth]} {currentYear}
        </h3>
        <button
          className={`${styles.navButton} ${styles.next}`}
          onClick={nextMonth}
          aria-label="Mese successivo"
        />
      </div>
      
      <div className={styles.daysOfWeek}>
        {daysOfWeek.map(day => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}
      </div>
      
      <div className={styles.calendarGrid}>
        {renderCalendarDays()}
      </div>
    </div>
  )
}
