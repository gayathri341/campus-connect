import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)

  // 🔹 Load profile ONCE on page load
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return
      setUser(user)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error) {
        setProfile(data)
      }
    }

    loadProfile()
  }, [])

  const uploadAvatar = async () => {
    if (!file || !user) return
  
    const filePath = `${user.id}/avatar.png`
  
    // Upload (overwrite allowed)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
  
    if (uploadError) {
      console.error(uploadError)
      alert('Upload failed')
      return
    }
  
    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
  
    // Save URL in profiles table
    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id)
  
    // Refresh profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  
    setProfile(updatedProfile)
  }
  

  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <h2>Profile</h2>

      {/* Avatar preview */}
      {profile.avatar_url && (
        <img
          src={profile.avatar_url}
          alt="Profile"
          width="120"
          style={{ display: 'block', marginBottom: '10px' }}
        />
      )}

      {/* Upload input */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={uploadAvatar}>Upload DP</button>

      <p>Name: {profile.name || 'Not set'}</p>
      <p>Domain: {profile.domain || 'Not set'}</p>
    </div>
  )
}
