import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../styles/navbar.css'
import logo from '../assets/newlogo.png'
import Userd from "../assets/userd.png";
import Logout from "../assets/logout.png";
import Ring from "../assets/ringing.png";
import { MdDashboard, MdMessage, MdPeople, MdFolder, MdNotificationsNone, MdPersonOutline, MdLogout } from "react-icons/md"

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="app-navbar">
      <div className="nav-left">
        <div className="brand">
           <img src={logo} alt="CampusConnect" className="brand-img" />
          <span>PlaceMent</span>
        </div>

        <nav className="nav-link">
          <NavLink to="/dashboard" className="nav-item">
            <span className="nav-link-content">
              <MdDashboard className="nav-icon" />
              <span className="nav-text">Dashboard</span>
            </span>
          </NavLink>
         
          <NavLink to="/messages" className="nav-item">
            <span className="nav-link-content">
              <MdMessage className="nav-icon" />
              <span className="nav-text">Messages</span>
            </span>
          </NavLink>

         {/* Connections */}
          <NavLink to="/connections" className="nav-item">
            <span className="nav-link-content">
              <MdPeople className="nav-icon" />
              <span className="nav-text">Connections</span>
            </span>
          </NavLink>

          {/* Resources */}
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
    <MdNotificationsNone className="nav-top-icon" />
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
