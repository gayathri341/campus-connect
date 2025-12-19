import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // 1️⃣ Fetch logged-in user & profile
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return
      setUser(user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
    }

    fetchProfile()
  }, [])

  // 2️⃣ Handle profile picture upload
  const handleAvatarUpload = async (e) => {
    try {
      setLoading(true)

      const file = e.target.files[0]
      if (!file || !user) return

      const fileName = `${user.id}.png`

      // Upload (overwrite old image)
      await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Save URL in profiles table
      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)

      // Update UI instantly
      setProfile({ ...profile, avatar_url: data.publicUrl })
    } catch  {
      alert('Error uploading profile picture')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <h2>Profile</h2>

      {/* Profile picture */}
      <div>
        {profile.avatar_url ? (
          <img
            src={`${profile.avatar_url}?t=${Date.now()}`}
            alt="Profile"
            width="120"
          />
        ) : (
          <p>No profile picture</p>
        )}
      </div>

      {/* Upload input */}
      <input type="file" accept="image/*" onChange={handleAvatarUpload} />

      {loading && <p>Uploading...</p>}

      <p>Name: {profile.name || 'Not set'}</p>
      <p>Domain: {profile.domain || 'Not set'}</p>
    </div>
  )
}
