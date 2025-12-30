import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/auth.css'


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

   const { data: profile } = await supabase
  .from('profiles')
  .select('is_verified')
  .eq('id', user.id)
  .maybeSingle()

if (!profile) {
  // profile row missing → send to verification
  navigate('/verify')
  return
}

if (!profile.is_verified) {
  navigate('/verify')
  return
}

// verified user
navigate('/dashboard')

  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome Back 👋</h2>
        <p className="auth-subtitle">Login to continue</p>
  
        <input
          className="input"
          type="email"
          placeholder="Email address"
          onChange={e => setEmail(e.target.value)}
        />
  
        <input
          className="input"
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
  
        <button className="btn full-width" onClick={handleLogin}>
          Login
        </button>
  
        <p className="auth-footer">
          New user? <span onClick={() => navigate('/signup')}>Create account</span>
        </p>
      </div>
    </div>
  )
  
}
