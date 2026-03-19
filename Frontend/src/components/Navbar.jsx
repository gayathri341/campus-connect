import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from "react";
import { supabase } from '../supabase'
import '../styles/navbar.css'
import logo from '../assets/newlogo.png'
import Userd from "../assets/userd.png";
import Logout from "../assets/logout.png";
import Ring from "../assets/ringing.png";
import { MdDashboard, MdMessage, MdPeople, MdFolder, MdNotificationsNone, MdPersonOutline, MdLogout } from "react-icons/md"

export default function Navbar() {

  const [unreadTotal, setUnreadTotal] = useState(0);
  const navigate = useNavigate()
  const [pendingRequests, setPendingRequests] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  // Initial unread fetch
  useEffect(() => {

    const fetchUnreadMessages = async () => {

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("seen", false);

      setUnreadTotal(count || 0);
    };

    fetchUnreadMessages();

  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
  
      if (!user) return;
  
      const lastSeen = localStorage.getItem("connections_seen");
  
      let query = supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
  
      if (lastSeen) {
        query = query.gt("created_at", lastSeen);
      }
  
      const { count } = await query;
  
      setPendingRequests(count || 0);
    };
  
    fetchRequests();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
  
      if (!user) return;
  
      const lastSeen = localStorage.getItem("connections_seen");
  
      let query = supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
  
      if (lastSeen) {
        query = query.gt("created_at", lastSeen);
      }
  
      const { count } = await query;
  
      setPendingRequests(count || 0);
    };
  
    const channel = supabase
      .channel("connection-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
        },
        refresh
      )
      .subscribe();
  
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    setNotificationCount(unreadTotal + pendingRequests);
  }, [unreadTotal, pendingRequests]);

  // Realtime listener
  useEffect(() => {

    const refreshUnread = async () => {

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("seen", false);

      setUnreadTotal(count || 0);
    };

    const channel = supabase
      .channel("navbar-unread")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          refreshUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);



  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="app-navbar">
      <div className="nav-left">
        <div className="brand">
          <img src={logo} alt="CampusConnect" className="brand-img" />
          <span>ConvoSyncra</span>
        </div>

        <nav className="nav-link">
          <NavLink to="/dashboard" className="nav-item">
            <span className="nav-link-content">
              <MdDashboard className="nav-icon" />
              <span className="nav-text">Dashboard</span>
            </span>
          </NavLink>

          {/* Messages */}
          <NavLink to="/messages" className="nav-item">
            <span className="nav-link-content nav-msg-wrapper">

              <MdMessage className="nav-icon" />

              <span className="nav-text">Messages</span>

              {unreadTotal > 0 && (
                <span className="nav-msg-badge">
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              )}

            </span>
          </NavLink>
          <NavLink to="/connections" className="nav-item">
            <span className="nav-link-content nav-msg-wrapper">
              <MdPeople className="nav-icon" />
              <span className="nav-text">Connections</span>

              {pendingRequests > 0 && (
                <span className="nav-msg-badge">
                  {pendingRequests > 9 ? "9+" : pendingRequests}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink to="/resources" className="nav-item">
            <span className="nav-link-content">
              <MdFolder className="nav-icon" />
              <span className="nav-text">Resources</span>
            </span>
          </NavLink>
        </nav>
      </div>

      <div className="nav-right">
        <button
          className="nav-icon-btn"
          onClick={() => navigate('/notifications')}
        >
          <div className="nav-icon-wrapper">
            <MdNotificationsNone className="nav-top-icon" />

            {notificationCount > 0 && (
              <span className="nav-top-badge">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </div>
        </button>

        <button
          className="nav-icon-btn"
          onClick={() => navigate('/profile')}
        >
          <MdPersonOutline className="nav-top-icon" />
        </button>

        <button
          className="nav-icon-btn logout"
          onClick={handleLogout}
        >
          <MdLogout className="nav-top-icon" />
        </button>
      </div>
    </header>
  )
}