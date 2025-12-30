import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/auth.css'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSignup = async () => {
    const { data,error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }
     // 🔥 CREATE PROFILE ROW IMMEDIATELY
  if (data?.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      is_verified: false,
    })
  }

    alert('Signup success. Please login.')
    navigate('/login')
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create Account 🚀</h2>
        <p className="auth-subtitle">Join Campus Connect</p>
  
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
  
        <button className="btn full-width" onClick={handleSignup}>
          Sign Up
        </button>
  
        <p className="auth-footer">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}>Login</span>
        </p>
      </div>
    </div>
  )
  
}
