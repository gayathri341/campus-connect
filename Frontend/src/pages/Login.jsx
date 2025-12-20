import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    // 1️⃣ Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    // 2️⃣ Check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .maybeSingle()

    // 3️⃣ Create profile if missing
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: '',
          domain: '',
          is_active: true,
        })

      if (insertError) {
        console.error('Profile insert failed:', insertError)
        alert('Profile creation failed. Please try login again.')
        return
      }
    }

    // 4️⃣ Fetch profile again
    const { data: finalProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (fetchError || !finalProfile) {
      alert('Profile not available. Please try again.')
      return
    }

    if (!finalProfile.is_active) {
      await supabase.auth.signOut()
      alert('Your account has been disabled')
      return
    }

    // ✅ Success
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
