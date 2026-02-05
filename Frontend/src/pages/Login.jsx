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
    <div className="auth-layout">
      {/* LEFT SIDE */}
      <div className="auth-left">
      <h1 className="brand-title clickable" onClick={() => navigate('/')}> PlaceMent </h1>
        <p className="brand-subtitle">Your professional network starts here</p>
  
        <div className="feature-card">
          <h4>Connect</h4>
          <p>Network with students & professionals</p>
        </div>
  
        <div className="feature-card">
          <h4>Chat</h4>
          <p>Real-time secure messaging</p>
        </div>
  
        <div className="feature-card">
          <h4>Resources</h4>
          <p>Access placement materials</p>
        </div>
  
        <p className="brand-footer">Built for students, by students</p>
      </div>
  
      {/* RIGHT SIDE */}
      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">
            Enter your credentials to access your account
          </p>
  
          <label>Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)}
          />
  
          <label>Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
          />
  
          <button className="create" onClick={handleLogin}>
            Sign In →
          </button>
  
          <p className="auth-footer">
            Don't have an account?{' '}
            <span onClick={() => navigate('/signup')}>Sign up</span>
          </p>
        </div>
      </div>
    </div>
  )
  
  
}
