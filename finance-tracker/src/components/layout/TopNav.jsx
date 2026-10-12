import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { notificationService } from '../../services/notificationService'

export default function TopNav({ onMenuToggle }) {
  const { user, profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (user) {
      notificationService.getAll(user.id)
        .then(data => {
          setNotifications(data)
          setUnreadCount(notificationService.getUnreadCount(data))
        })
        .catch(() => {})
    }
  }, [user])

  const handleMarkAllRead = async () => {
    if (!user) return
    await notificationService.markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <div className="topnav-greeting">
          {greeting}, <strong>{profile?.full_name?.split(' ')[0] || 'there'}</strong> 👋
        </div>
      </div>
      <div className="topnav-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="notification-wrap">
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <span>Notifications</span>
                <button onClick={handleMarkAllRead} className="mark-read-btn">Mark all read</button>
              </div>
              {notifications.length === 0 ? (
                <div className="notification-empty">No notifications yet</div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-msg">{n.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="topnav-avatar">
          {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
        </div>
      </div>
    </header>
  )
}
