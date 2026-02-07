import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import '../styles/dashboard.css'
import { MdPeopleOutline, MdDescription,MdSchool, MdBusiness, MdCheck, MdPersonOff } from "react-icons/md"


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
        .select('user_id, name, domain, college, company,batch, avatar_url')
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
          {/* Connections */}
          <div className="stat-card-new">
            <div className="stat-icon-wrap connections-bg">
              <MdPeopleOutline className="stat-icon-new" />
            </div>

            <div className="stat-content">
              <p className="stat-label-new">Connections</p>
              <h5 className="stat-value-new">0</h5>
            </div>
          </div>

          {/* Resources */}
          <div className="stat-card-new">
            <div className="stat-icon-wrap resources-bg">
              <MdDescription className="stat-icon-new" />
            </div>

            <div className="stat-content">
              <p className="stat-label-new">Resources</p>
              <h5 className="stat-value-new">Coming Soon</h5>
            </div>
          </div>
        </div>

        <div className="discover-card">
          <div className="discover-header">
            <MdPeopleOutline className="discover-icon" />
            <h3 className="discover-title">Discover People</h3>
          </div>

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
                    <span className="cc-avatar-letter">
                      {user.name?.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="cc-user-meta">
                  <h4 className="cc-user-name">{user.name}</h4>
                  <span className="cc-domain-tag">{user.domain}</span>
                </div>
              </div>

              <div className="cc-info-row">
                <MdSchool className="cc-info-icon" />
                <p className="cc-college">{user.college}</p>
              </div>

              <div className="cc-info-row">
                <MdBusiness className="cc-info-icon" />
                <p className="cc-company">{user.company}</p>
              </div>

              <div className="cc-info-row">
                <MdPeopleOutline className="cc-info-icon" />
                <p className="cc-college">{user.batch}</p>
              </div>

              <button
                className={`cc-connect-btn ${status === 'accepted' ? 'connected' : ''}`}
                disabled={disabled}
                onClick={() => sendRequest(user.user_id)}
              >
                {status === 'accepted' && <MdCheck className="cc-check-icon" />}
                {buttonText}
              </button>
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div className="cc-empty-state">
            <MdPersonOff className="cc-empty-icon" />
            <p className="cc-empty-text">No users found</p>
          </div>
        )}

      </div>

      </div>
    </>
  )
}
