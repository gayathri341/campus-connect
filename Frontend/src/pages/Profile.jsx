import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'

const DOMAIN_OPTIONS = [
  'IT', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BIO', 'OTHER'
]
const AVAILABILITY_OPTIONS = [
  'Available',
  'Busy',
  'Not Available'
]

const PLACEMENT_STATUS_OPTIONS = [
  'Preparing',
  'Interning',
  'Placed'
]


export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Existing fields
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')

  // New fields
  const [college, setCollege] = useState('')
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [batch, setBatch] = useState('')
  const [availability, setAvailability] = useState('')
  const [placementStatus, setPlacementStatus] = useState('')

  // Avatar (DO NOT TOUCH LOGIC)
  const [file, setFile] = useState(null)

  const [saving, setSaving] = useState(false)

  // 🔹 Load profile
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
        setCollege(data.college || '')
        setCompany(data.company || '')
        setBio(data.bio || '')
        setSkills(data.skills || [])
        setBatch(data.batch || '')
        setAvailability(data.availability || '')
        setPlacementStatus(data.placement_status || '')
      }
    }

    loadProfile()
  }, [])

  // 🔹 Save profile (ALL fields)
  const saveProfile = async () => {
    if (!user) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        domain,
        college,
        company,
        bio,
        skills,
        batch: batch ? Number(batch) : null,
        availability,
        placement_status: placementStatus,
        updated_at: new Date(),
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      alert('Failed to save profile')
      return
    }

    alert('Profile updated successfully')
    setIsEditing(false)
  }

  // 🔹 Avatar upload (UNCHANGED)
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

  // 🔹 Skill handlers
  const addSkill = () => {
    if (!skillInput.trim()) return
    if (skills.includes(skillInput)) return

    setSkills([...skills, skillInput])
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill))
  }

  if (!profile) return <p>Loading profile...</p>

  return (
    <>
      <Navbar active="profile" />

      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h2>My Profile</h2>

        {/* Avatar view */}
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Profile"
            width="120"
            style={{ display: 'block', marginBottom: '10px' }}
          />
        )}

        {/* Avatar edit ONLY in edit mode */}
        {isEditing && (
          <>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={uploadAvatar}>Change Profile Picture</button>
          </>
        )}

        <hr />

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Domain:</strong> {domain}</p>
            <p><strong>College:</strong> {college || '-'}</p>
            <p><strong>Company:</strong> {company || '-'}</p>
            <p><strong>Batch:</strong> {batch || '-'}</p>
            <p><strong>Availability:</strong> {availability || '-'}</p>
            <p><strong>Placement Status:</strong> {placementStatus || '-'}</p>
            <p><strong>Bio:</strong> {bio || '-'}</p>
            <p><strong>Skills:</strong> {skills.length ? skills.join(', ') : '-'}</p>

            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </>
        ) : (
          /* ================= EDIT MODE ================= */
          <>
            <label>Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />

            <label>Domain</label>
            <div>
              {DOMAIN_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDomain(opt)}
                  style={{
                    marginRight: '6px',
                    marginBottom: '6px',
                    background: domain === opt ? '#0ea5a4' : '#eee',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <label>College</label>
            <input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="Your college name"
            />

            <label>Company (if placed)</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company you are placed in"
            />

            <label>Batch</label>
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="Passing year (e.g., 2026)"
            />

            <label>Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">Select availability</option>

              {AVAILABILITY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <label>Placement Status</label>
            <select
              value={placementStatus}
              onChange={(e) => setPlacementStatus(e.target.value)}
            >
              <option value="">Select placement status</option>

              {PLACEMENT_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>


            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short introduction about yourself"
            />

            <label>Skills</label>
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill (e.g., Java)"
            />
            <button type="button" onClick={addSkill}>Add Skill</button>

            <div>
              {skills.map(skill => (
                <span key={skill} style={{ marginRight: '6px' }}>
                  {skill}
                  <button onClick={() => removeSkill(skill)}>x</button>
                </span>
              ))}
            </div>

            <br />

            <button onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        )}
      </div>
    </>
  )
}
