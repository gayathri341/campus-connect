import { useState } from 'react'
import { supabase } from '../supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: '',
        domain: '',
        is_active: true,
      })
    }
  }

  return (
    <>
      <input onChange={e => setEmail(e.target.value)} />
      <input type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
    </>
  )
}
