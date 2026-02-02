import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/auth.css'

export default function Signup() {
  const [name, setName] = useState('')      // 👈 NEW
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert('Please fill all fields')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,   // 👈 THIS IS CRITICAL
        }
      }
    })

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 CREATE PROFILE ROW IMMEDIATELY (with name)
    if (data?.user) {
      await supabase.from('profiles').insert({
        user_id: data.user.id,                    // ✅ correct mapping
        name: data.user.user_metadata?.name || '', // ✅ guaranteed value
        is_verified: false,
      })
      
    }

    alert('Signup success. Please login.')
    navigate('/login')
  }

  return (
    <div className="auth-layout">
      {/* LEFT SIDE */}
      <div className="auth-left">
      <h1 className="brand-title clickable" onClick={() => navigate('/')}> CampusConnect </h1>
        <p className="brand-subtitle">
          Your professional network starts here
        </p>

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
          <h2>Create account</h2>
          <p className="auth-subtitle">
            Start your journey with CampusConnect
          </p>

          {/* FULL NAME */}
          <label>Full Name</label>
          <input
            className="input"
            type="text"
            placeholder="John Doe"
            onChange={e => setName(e.target.value)}
          />

          {/* EMAIL */}
          <label>Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <label>Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
          />

          <button className="create" onClick={handleSignup}>
            Create Account →
          </button>

          <p className="auth-footer">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  )
}
