import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import '../styles/connections.css'

export default function Connections() {
  const [activeTab, setActiveTab] = useState('connections')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [connections, setConnections] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    const loadConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // accepted connections
      const { data: accepted } = await supabase
        .from('connections')
        .select(`
          id,
          sender_id,
          receiver_id,
          profiles!connections_sender_id_fkey(name, domain, college, company)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      // pending requests (receiver side)
      const { data: pending } = await supabase
        .from('connections')
        .select(`
          id,
          sender_id,
          profiles!connections_sender_id_fkey(name, domain, college, company)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')

      setConnections(accepted || [])
      setRequests(pending || [])
    }

    loadConnections()
  }, [])

  const acceptRequest = async (id) => {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', id)

    location.reload()
  }

  const rejectRequest = async (id) => {
    await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', id)

    location.reload()
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

        {/* MY CONNECTIONS */}
        {activeTab === 'connections' && (
          <div className="ccn-grid">
            {connections.length === 0 && (
              <p className="ccn-empty">No connections yet</p>
            )}

            {connections.map(c => {
              const other =
                c.sender_id === currentUserId
                  ? c.profiles
                  : c.profiles

              return (
                <div key={c.id} className="ccn-card">
                  <div className="ccn-avatar">
                    {other?.name?.charAt(0)}
                  </div>

                  <h4>{other?.name}</h4>
                  <span className="ccn-tag">{other?.domain}</span>

                  <p>{other?.college}</p>
                  <p>{other?.company}</p>

                  <button className="ccn-message-btn">
                    Message
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <div className="ccn-grid">
            {requests.length === 0 && (
              <p className="ccn-empty">No pending requests</p>
            )}

            {requests.map(r => (
              <div key={r.id} className="ccn-card">
                <div className="ccn-avatar">
                  {r.profiles?.name?.charAt(0)}
                </div>

                <h4>{r.profiles?.name}</h4>
                <span className="ccn-tag">{r.profiles?.domain}</span>

                <p>{r.profiles?.college}</p>
                <p>{r.profiles?.company}</p>

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
