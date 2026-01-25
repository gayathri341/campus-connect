import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/verification.css'
import Doc from "../assets/docs.png";

export default function Verification() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [user, setUser] = useState(null)
  const [documentType, setDocumentType] = useState('id_card') // ✅ NEW
  const navigate = useNavigate()

  const fetchVerificationStatus = async (currentUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', currentUser.id)
      .single()

    if (profile?.is_verified) {
      navigate('/dashboard')
      return
    }

    const { data: doc } = await supabase
      .from('verification_documents')
      .select('status')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (doc?.status) setStatus(doc.status)
    else setStatus(null)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      await fetchVerificationStatus(user)
    }
    init()
  }, [navigate])

  const uploadDoc = async () => {
    if (!file || !user) return

    // 🔹 SAME PATH → old doc replaced automatically
    const filePath = `${user.id}/proof`

    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      alert('Upload failed')
      return
    }

    // 🔹 UPSERT → one user, one row
    const { error: dbError } = await supabase
      .from('verification_documents')
      .upsert(
        {
          user_id: user.id,
          document_url: filePath,
          document_type: documentType, // ✅ NEW
          status: 'pending',
        },
        { onConflict: 'user_id' }
      )

    if (dbError) {
      alert('DB error')
      return
    }

    alert('Document uploaded. Verification pending.')
    await fetchVerificationStatus(user)
  }

  return (
    <div className="verify-page">
      <div className="verify-card">

        <h2 className="verify-title">
          Verify Your College Identity
        </h2>

        <p className="verify-subtext">
          Upload a valid document to confirm your identity.
          This helps us keep CampusConnect safe and trusted.
        </p>

        {/* 🔘 DOCUMENT TYPE SELECTION */}
        <div className="doc-type">
          <label>
            <input
              type="radio"
              value="id_card"
              checked={documentType === 'id_card'}
              onChange={() => setDocumentType('id_card')}
            />
            Student — Upload College ID
          </label>

          <label>
            <input
              type="radio"
              value="degree_certificate"
              checked={documentType === 'degree_certificate'}
              onChange={() => setDocumentType('degree_certificate')}
            />
            Alumni / Senior — Upload Degree Certificate
          </label>
        </div>

        {/* Status Messages */}
        {status === 'pending' && (
          <div className="verify-status pending">
            ⏳ Verification pending. Please wait.
          </div>
        )}

        {status === 'rejected' && (
          <div className="verify-status rejected">
            ❌ Verification rejected. Please upload again.
          </div>
        )}

        {!status && (
          <div className="verify-status info">
            <img src={Doc} alt="doc" />
            Please upload your verification document.
          </div>
        )}

        {(status === null || status === 'pending' || status === 'rejected') && (
          <div className="upload-box">
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={e => setFile(e.target.files[0])}
            />

            <p className="upload-help">
              Accepted formats: PDF, JPG, PNG<br />
              Max size: 2 MB
            </p>

            <button
              className="upload-btn"
              onClick={uploadDoc}
              disabled={!file}
            >
              Upload Document
            </button>
          </div>
        )}

        <p className="verify-note">
          Verification usually takes 24–48 hours.
        </p>

        <div className="verify-privacy">
          <p>🔒 Your document is encrypted</p>
          <p>👁️ Used only for college verification</p>
          <p>🗑️ Deleted after verification</p>
        </div>

      </div>
    </div>
  )
}
