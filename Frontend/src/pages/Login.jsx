import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    
    // 1️⃣ Try login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // ❌ Login failed
    if (error) {
      alert(error.message)
      return
    }

    // ✅ Login success
    const user = data.user

    // 2️⃣ Check if account is active
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      alert('Profile not found')
      return
    }

    // ❌ Account disabled
    if (!profile.is_active) {
      await supabase.auth.signOut()
      alert('Your account has been disabled')
      return
    }

    // ✅ Everything OK
    alert('Login successful')
    // later: navigate to dashboard
    navigate('/dashboard')

  }

  return (
    <>
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </>
  )
}
