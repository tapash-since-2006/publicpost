import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { notificationApi } from '../services/api'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const esRef = useRef(null)

  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return }
    notificationApi.getAll()
      .then(res => {
        setNotifications(res.data.data || [])
        setUnreadCount(res.data.unreadCount || 0)
      })
      .catch(() => {})
  }, [user])

  // SSE for real-time notifications
  useEffect(() => {
    if (!user) { esRef.current?.close(); return }
    const token = localStorage.getItem('tpp_token')
    if (!token) return

    // EventSource can't set headers — pass token as query param
    // Backend auth middleware reads it from req.query.token
    const es = new EventSource(`/api/sse/stream?token=${encodeURIComponent(token)}`)
    esRef.current = es

    es.addEventListener('notification', (e) => {
      try {
        const notification = JSON.parse(e.data)
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      } catch {}
    })

    es.onerror = () => { es.close() }

    return () => { es.close(); esRef.current = null }
  }, [user])

  const markAllRead = async () => {
    await notificationApi.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = async (ids) => {
    await notificationApi.markRead(ids)
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - ids.length))
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
