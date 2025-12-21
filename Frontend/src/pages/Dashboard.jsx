import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <>
      <h2>Dashboard 🎉</h2>

      <Link to="/profile">
        <button>Go to Profile</button>
      </Link>

      <br /><br />

      <button onClick={handleLogout}>Logout</button>
    </>
  )
}
