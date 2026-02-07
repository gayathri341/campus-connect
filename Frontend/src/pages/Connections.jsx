import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import '../styles/connections.css'
import { MdSchool, MdBusiness, MdChatBubbleOutline, MdPersonOff, MdCheck, MdClose, MdPeopleOutline, MdPersonAddAlt } from "react-icons/md";



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
            batch,
            avatar_url
          ),
          receiver:profiles!connections_receiver_user_fkey(
            user_id,
            name,
            domain,
            college,
            company,
            batch,
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
            batch,
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
            className={`ccn-tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            <MdPeopleOutline className="ccn-tab-icon" />
            <span className="ccn-tab-text">My Connections</span>
            <span className="ccn-tab-count">{connections.length}</span>
          </button>

          <button
            className={`ccn-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <MdPersonAddAlt className="ccn-tab-icon" />
            <span className="ccn-tab-text">Requests</span>
            <span className="ccn-tab-count">{requests.length}</span>
          </button>
        </div>


        {/* ============================
           MY CONNECTIONS
           ============================ */}
       {activeTab === 'connections' && (
          <div className="ccn-grid">
            {connections.length === 0 && (
              <div className="ccn-empty-state">
                <MdPersonOff className="ccn-empty-icon" />
                <p className="ccn-empty-text">No connections yet</p>
              </div>
            )}

            {connections.map(c => {
              const otherUser =
                c.sender_id === currentUserId ? c.receiver : c.sender

              if (!otherUser) return null

              return (
                <div key={c.id} className="ccn-card">
                  <div className="ccn-header">
                    <div className="ccn-avatar">
                      {otherUser.name ? otherUser.name.charAt(0) : '?'}
                    </div>

                    <div className="ccn-user-meta">
                      <h4 className="ccn-user-name">{otherUser.name}</h4>
                      <span className="ccn-tag">{otherUser.domain}</span>
                    </div>
                  </div>

                  <div className="ccn-info-row">
                    <MdSchool className="ccn-info-icon" />
                    <p className="ccn-college">{otherUser.college}</p>
                  </div>

                  <div className="ccn-info-row">
                    <MdBusiness className="ccn-info-icon" />
                    <p className="ccn-company">{otherUser.company || '-'}</p>
                  </div>

                  <div className="ccn-info-row">
                    <MdPeopleOutline className="ccn-info-icon" />
                    <p className="ccn-college">{otherUser.batch}</p>
                  </div>

                  <button className="ccn-message-btn">
                    <MdChatBubbleOutline className="ccn-msg-icon" />
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
            <div className="ccn-empty-state">
              <MdPersonOff className="ccn-empty-icon" />
              <p className="ccn-empty-text">No pending requests</p>
              <p className="ccn-empty-text">You'll see connection requests from other users here</p>
            </div>
          )}

          {requests.map(r => (
            <div key={r.id} className="ccn-card">
              <div className="ccn-header">
                <div className="ccn-avatar">
                  {r.sender?.name ? r.sender.name.charAt(0) : '?'}
                </div>

                <div className="ccn-user-meta">
                  <h4 className="ccn-user-name">{r.sender?.name}</h4>
                  <span className="ccn-tag">{r.sender?.domain}</span>
                </div>
              </div>

              <div className="ccn-info-row">
                <MdSchool className="ccn-info-icon" />
                <p className="ccn-college">{r.sender?.college}</p>
              </div>

              <div className="ccn-info-row">
                <MdBusiness className="ccn-info-icon" />
                <p className="ccn-company">{r.sender?.company || '-'}</p>
              </div>

              <div className="ccn-info-row">
                <MdPeopleOutline className="ccn-info-icon" />
                <p className="ccn-college">{r.sender?.batch}</p>
              </div>

              <div className="ccn-actions">
                <button
                  className="ccn-accept"
                  onClick={() => acceptRequest(r.id)}
                >
                  <MdCheck className="ccn-action-icon" />
                  Accept
                </button>

                <button
                  className="ccn-reject"
                  onClick={() => rejectRequest(r.id)}
                >
                  <MdClose className="ccn-action-icon" />
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
