import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'
import '../styles/profile.css'

import Plus from "../assets/plus.png"
import Userd from "../assets/userd.png"

const DOMAIN_OPTIONS = ['IT','CSE','ECE','EEE','MECH','CIVIL','CHEM','BIO','OTHER']
const AVAILABILITY_OPTIONS = ['Available','Busy','Not Available']
const PLACEMENT_STATUS_OPTIONS = ['Preparing','Interning','Placed']

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [college, setCollege] = useState('')
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [batch, setBatch] = useState('')
  const [availability, setAvailability] = useState('')
  const [placementStatus, setPlacementStatus] = useState('')

  // avatar
  const fileInputRef = useRef(null)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user.id', user.id)
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

  const saveProfile = async () => {
    if (!name.trim()) return alert('Name required')
    if (!domain.trim()) return alert('Select domain')

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
      .eq('user.id', user.id)

    setSaving(false)
    if (error) return alert('Save failed')

    setIsEditing(false)
  }

  // ✅ AUTO UPLOAD FUNCTION
  const uploadAvatar = async (selectedFile) => {
    if (!selectedFile || !user) return

    const filePath = `${user.id}/avatar.png`

    await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile, { upsert: true })

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('user.id', user.id)

    setProfile({ ...profile, avatar_url: data.publicUrl })
  }

  const removeAvatar = async () => {
    await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('user.id', user.id)

    setProfile({ ...profile, avatar_url: null })
  }

  const addSkill = () => {
    if (!skillInput.trim()) return
    if (skills.includes(skillInput)) return
    setSkills([...skills, skillInput])
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill))
  }

  if (!profile) return null

  return (
    <>
      <Navbar active="profile" />

      <div className="p-container">
        <div className="p-header">
          <div>
            <h2>My Profile</h2>
            <p>Manage your professional information</p>
          </div>

          {!isEditing ? (
            <button className="btn primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <div className="header-actions">
              <button className="btn ghost" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn primary" onClick={saveProfile}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="p-card">
          {/* Avatar */}
          <div
            className={`avatar-box ${!profile.avatar_url ? 'default' : ''}`}
            onClick={() => isEditing && fileInputRef.current.click()}
          >
            <img
              className="avatar-img"
              src={profile.avatar_url ? profile.avatar_url : Userd}
              alt="Profile"
            />

            {isEditing && (
              <span className="avatar-edit">
                <img className="add" src={Plus} alt="change" />
              </span>
            )}
          </div>

          {/* 🔥 AUTO upload on file select */}
          {isEditing && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={(e) => {
                  const selectedFile = e.target.files[0]
                  if (!selectedFile) return
                  uploadAvatar(selectedFile)
                }}
              />

              {profile.avatar_url && (
                <button className="removeb" onClick={removeAvatar}>
                  Remove Photo
                </button>
              )}
            </>
          )}

          <div className="p-info">
            {!isEditing ? (
              <>
                <Info label="Full Name" value={name} />
                <Info label="Domain" value={domain} />
                <Info label="College" value={college} />
                <Info label="Company (if placed)" value={company} />
                <Info label="Batch" value={batch} />
                <Info label="Availability" value={availability} />
                <Info label="Placement Status" value={placementStatus} />
                <Info label="Bio" value={bio} />
                <Info label="Skills" value={skills.length ? skills.join(', ') : 'No skills added'} />
              </>
            ) : (
              <>
                <Field label="Full Name" value={name} onChange={setName} />

                <label>Domain</label>
                <div className="domain-group">
                  {DOMAIN_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      className={domain === d ? 'domain active' : 'domain'}
                      onClick={() => setDomain(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <Field label="College" value={college} onChange={setCollege} />
                <Field label="Company (if placed)" value={company} onChange={setCompany} />
                <Field label="Batch" value={batch} onChange={setBatch} />

                <label>Availability</label>
                <select value={availability} onChange={e => setAvailability(e.target.value)}>
                  <option value="">Select</option>
                  {AVAILABILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>

                <label>Placement Status</label>
                <select value={placementStatus} onChange={e => setPlacementStatus(e.target.value)}>
                  <option value="">Select</option>
                  {PLACEMENT_STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>

                <label>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} />

                <label>Skills</label>
                <div className="skill-row">
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    placeholder="Add a skill"
                  />
                  <button className="skill-add-btn" onClick={addSkill}>+</button>
                </div>

                <div className="skill-list">
                  {skills.map(s => (
                    <span key={s} onClick={() => removeSkill(s)}>
                      {s} ×
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const Info = ({ label, value }) => (
  <div className="info-row">
    <strong>{label}</strong>
    <span>{value || '-'}</span>
  </div>
)

const Field = ({ label, value, onChange }) => (
  <>
    <label>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} />
  </>
)
