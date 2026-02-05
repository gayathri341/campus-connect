import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/notifications.css'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          created_at,
          sender:profiles!connections_sender_user_fkey(
            user_id,
            name,
            domain
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!error) {
        setNotifications(data || [])
      }
    }

    loadNotifications()
  }, [])

  return (
    <>
      <Navbar />

      <div className="ccn-notify-container">
        <h2 className="ccn-notify-title">Notifications</h2>

        {notifications.length === 0 && (
          <div className="ccn-notify-empty">
            <div className="ccn-notify-icon">🔔</div>
            <p>No notifications yet</p>
          </div>
        )}

        {notifications.map(n => (
          <div
            key={n.id}
            className="ccn-notify-card"
            onClick={() => navigate('/connections', { state: { tab: 'requests' } })}
          >
            <div className="ccn-notify-avatar">
              {n.sender?.name?.charAt(0)}
            </div>

            <div className="ccn-notify-content">
              <p>
                <strong>{n.sender?.name}</strong> is asking to connect with you
              </p>
              <span className="ccn-notify-domain">{n.sender?.domain}</span>
            </div>

            <div className="ccn-notify-action">
              View
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
