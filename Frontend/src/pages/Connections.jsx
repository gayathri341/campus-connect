import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import '../styles/connections.css'


export default function Connections() {
  const location = useLocation()

  const [activeTab, setActiveTab] = useState(
    location.state?.tab === 'requests' ? 'requests' : 'connections'
  )
  
  const [currentUserId, setCurrentUserId] = useState(null)
  const [connections, setConnections] = useState([])
  const [requests, setRequests] = useState([])


 

  /* ============================
     LOAD CONNECTIONS
     ============================ */
     const fetchConnections = async (userId) => {
      const { data: accepted } = await supabase
        .from('connections')
        .select(`
          id,
          sender_id,
          receiver_id,
          sender:profiles!connections_sender_user_fkey(
            user_id,
            name,
            domain,
            college,
            company,
            avatar_url
          ),
          receiver:profiles!connections_receiver_user_fkey(
            user_id,
            name,
            domain,
            college,
            company,
            avatar_url
          )
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
      const { data: pending } = await supabase
        .from('connections')
        .select(`
          id,
          sender_id,
          sender:profiles!connections_sender_user_fkey(
            user_id,
            name,
            domain,
            college,
            company,
            avatar_url
          )
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
    
      setConnections(accepted || [])
      setRequests(pending || [])
    }
    

  /* ============================
     CALL ON LOAD
     ============================ */
     useEffect(() => {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
    
        setCurrentUserId(user.id)
        await fetchConnections(user.id)
      }
    
      init()
    }, [])
    

  /* ============================
     ACCEPT / REJECT
     ============================ */
  const acceptRequest = async (id) => {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', id)

      fetchConnections(currentUserId)
  }

  const rejectRequest = async (id) => {
    await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', id)

      fetchConnections(currentUserId)
  }

  return (
    <>
      <Navbar />

      <div className="ccn-container">
        <h2>Connections</h2>
        <p className="ccn-sub">Manage your professional network</p>

        <div className="ccn-tabs">
          <button
            className={activeTab === 'connections' ? 'active' : ''}
            onClick={() => setActiveTab('connections')}
          >
            My Connections <span>{connections.length}</span>
          </button>

          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Requests <span>{requests.length}</span>
          </button>
        </div>

        {/* ============================
           MY CONNECTIONS
           ============================ */}
        {activeTab === 'connections' && (
          <div className="ccn-grid">
            {connections.length === 0 && (
              <p className="ccn-empty">No connections yet</p>
            )}

            {connections.map(c => {
              const otherUser =
                c.sender_id === currentUserId ? c.receiver : c.sender

              if (!otherUser) return null

              return (
                <div key={c.id} className="ccn-card">
                  <div className="ccn-avatar">
                    {otherUser.name ? otherUser.name.charAt(0) : '?'}
                  </div>

                  <h4>{otherUser.name}</h4>
                  <span className="ccn-tag">{otherUser.domain}</span>

                  <p>{otherUser.college}</p>
                  <p>{otherUser.company || '-'}</p>

                  <button className="ccn-message-btn">
                    Message
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ============================
           REQUESTS
           ============================ */}
        {activeTab === 'requests' && (
          <div className="ccn-grid">
            {requests.length === 0 && (
              <p className="ccn-empty">No pending requests</p>
            )}

            {requests.map(r => (
              <div key={r.id} className="ccn-card">
                <div className="ccn-avatar">
                  {r.sender?.name ? r.sender.name.charAt(0) : '?'}
                </div>

                <h4>{r.sender?.name}</h4>
                <span className="ccn-tag">{r.sender?.domain}</span>

                <p>{r.sender?.college}</p>
                <p>{r.sender?.company || '-'}</p>

                <div className="ccn-actions">
                  <button
                    className="ccn-accept"
                    onClick={() => acceptRequest(r.id)}
                  >
                    Accept
                  </button>

                  <button
                    className="ccn-reject"
                    onClick={() => rejectRequest(r.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
