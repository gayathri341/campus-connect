import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Profile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
    }

    loadProfile()
  }, [])

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    const { data: { user } } = await supabase.auth.getUser()

    const fileName = `${user.id}.png`

    await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id)

    setProfile({ ...profile, avatar_url: data.publicUrl })
  }

  if (!profile) return <p>Loading...</p>

  return (
    <>
      <h2>Profile</h2>
      {profile.avatar_url && <img src={profile.avatar_url} width="120" />}
      <input type="file" onChange={uploadAvatar} />
      <p>Name: {profile.name || 'Not set'}</p>
      <p>Domain: {profile.domain || 'Not set'}</p>
    </>
  )
}
