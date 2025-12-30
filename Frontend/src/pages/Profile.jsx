import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import '../styles/profile.css'


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
  <div className="profile-wrapper">
    <div className="profile-card">
      <h2 className="profile-title">Your Profile</h2>
      <p className="profile-subtitle">
        Manage your personal information
      </p>

      {/* Avatar Section */}
      <div className="profile-avatar-section">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="profile-avatar"
           
          />
        ) : (
          <div className="profile-avatar placeholder">
            No Image
          </div>
        )}

        <input
          type="file"
          id="avatarUpload"
          hidden
          onChange={(e) => setFile(e.target.files[0])}
        />

        <label htmlFor="avatarUpload" className="btn secondary">
          Change Profile Picture
        </label>

        <button className="btn" onClick={uploadAvatar}>
          Upload
        </button>
      </div>

      <hr />

      {/* Profile Form */}
      <div className="profile-form">
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>Domain</label>
          <input
            className="input"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter your domain (e.g. Web, AI, Data)"
          />
        </div>

        <button
          className="btn full-width"
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  </div>
)

}
