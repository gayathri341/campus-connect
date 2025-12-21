import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')

  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  // 🔹 Load profile once
  useEffect(() => {
    const loadProfile = async () => {
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

      if (data) {
        setProfile(data)
        setName(data.name || '')
        setDomain(data.domain || '')
      }
    }

    loadProfile()
  }, [])

  // 🔹 Save profile (name + domain)
  const saveProfile = async () => {
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        domain,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      alert('Failed to save profile')
      return
    }

    alert('Profile updated successfully')
  }

  // 🔹 Upload profile picture
  const uploadAvatar = async () => {
    if (!file || !user) return

    const filePath = `${user.id}/avatar.png`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id)

    setProfile({ ...profile, avatar_url: data.publicUrl })
  }

  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <h2>Profile</h2>

      {/* Avatar */}
      {profile.avatar_url && (
        <img
          src={profile.avatar_url}
          alt="Profile"
          width="120"
          style={{ display: 'block', marginBottom: '10px' }}
        />
      )}

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadAvatar}>Upload DP</button>

      <hr />

      {/* Name */}
      <div>
        <label>Name:</label><br />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <br />

      {/* Domain */}
      <div>
        <label>Domain:</label><br />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter your domain"
        />
      </div>

      <br />

      <button onClick={saveProfile} disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  )
}
