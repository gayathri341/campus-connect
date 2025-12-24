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
    <>
      <h2>Signup</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Signup</button>
    </>
  )
}
