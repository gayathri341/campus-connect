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

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    // 2️⃣ Try to fetch profile safely
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .maybeSingle()

    // 3️⃣ If profile not exists → create it (LOG ERROR)
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: '',
          domain: '',
          is_active: true,
        })

      console.log('INSERT PROFILE ERROR:', insertError)
    }

    // 4️⃣ Re-fetch profile
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()

      if (!finalProfile) {
        alert('Profile creation failed. Please login again.')
        return
      }
      
      if (!finalProfile.is_active) {
        await supabase.auth.signOut()
        alert('Your account has been disabled')
        return
      }

    // ✅ Success
    alert('Login successful')
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
