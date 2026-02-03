import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [users, setUsers] = useState([])
  const [connections, setConnections] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [activeDomain, setActiveDomain] = useState('All')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      // 🔹 fetch verified users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, name, domain, college, company, avatar_url')
        .eq('is_verified', true)

      if (usersData) {
        setUsers(usersData)
      }

      // 🔹 fetch connections (sent + received)
      const { data: connData } = await supabase
        .from('connections')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (connData) {
        setConnections(connData)
      }
    }

    loadData()
  }, [])

  // 🔹 filter users by domain & exclude self
  const filteredUsers = users.filter(u => {
    if (u.user_id === currentUserId) return false
    if (activeDomain === 'All') return true
    return u.domain === activeDomain
  })

  // 🔹 get connection status with another user
  const getConnectionStatus = (otherUserId) => {
    const conn = connections.find(
      c =>
        (c.sender_id === currentUserId && c.receiver_id === otherUserId) ||
        (c.receiver_id === currentUserId && c.sender_id === otherUserId)
    )

    return conn ? conn.status : null
  }

  // 🔹 send connection request
  const sendRequest = async (receiverId) => {
    if (!currentUserId) return

    await supabase.from('connections').insert({
      sender_id: currentUserId,
      receiver_id: receiverId,
      status: 'pending',
    })

    // refresh connections
    const { data: connData } = await supabase
      .from('connections')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)

    if (connData) {
      setConnections(connData)
    }
  }

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Connections</p>
            <h2>0</h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Resources</p>
            <h2>Coming Soon</h2>
          </div>
        </div>

        <div className="discover-card">
          <h3>Discover People</h3>

          <input
            className="search-input"
            placeholder="Search by name, college, or skills..."
            disabled
          />

          <div className="filter-row">
            {['All','IT','CSE','ECE','EEE','MECH','CIVIL','CHEM','BIO','OTHER'].map(item => (
              <button
                key={item}
                className={`filter-btn ${activeDomain === item ? 'active' : ''}`}
                onClick={() => setActiveDomain(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="cc-users-grid">
            {filteredUsers.map(user => {
              const status = getConnectionStatus(user.user_id)

              let buttonText = 'Connect'
              let disabled = false

              if (status === 'pending') {
                buttonText = 'Requested'
                disabled = true
              }

              if (status === 'accepted') {
                buttonText = 'Connected'
                disabled = true
              }

              return (
                <div key={user.user_id} className="cc-user-card">
                  <div className="cc-user-header">
                    <div className="cc-avatar">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0)}</span>
                      )}
                    </div>

                    <div>
                      <h4>{user.name}</h4>
                      <span className="cc-domain-tag">{user.domain}</span>
                    </div>
                  </div>

                  <p className="cc-college">{user.college}</p>
                  <p className="cc-company">{user.company}</p>

                  <button
                    className="cc-connect-btn"
                    disabled={disabled}
                    onClick={() => sendRequest(user.user_id)}
                  >
                    {buttonText}
                  </button>
                </div>
              )
            })}

            {filteredUsers.length === 0 && (
              <p className="cc-empty">No users found</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
