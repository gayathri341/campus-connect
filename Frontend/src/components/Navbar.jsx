import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../styles/navbar.css'
import logo from '../assets/logo.svg'

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
          <span>CampusConnect</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" className="nav-item">
            Dashboard
          </NavLink>
          <NavLink to="/messages" className="nav-item">
            Messages
          </NavLink>
          <NavLink to="/connections" className="nav-item">
            Connections
          </NavLink>
          <NavLink to="/resources" className="nav-item">
            Resources
          </NavLink>
        </nav>
      </div>

      <div className="nav-right">
        <button
          className="icon-btn"
          onClick={() => navigate('/notifications')}
        >
          🔔
        </button>

        <button
          className="icon-btn"
          onClick={() => navigate('/profile')}
        >
          👤
        </button>

        <button className="icon-btn logout" onClick={handleLogout}>
          ⎋
        </button>
      </div>
    </header>
  )
}
