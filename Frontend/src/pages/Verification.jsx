import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/verification.css'
import Doc from "../assets/docs.png"

export default function Verification() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [user, setUser] = useState(null)
  const [documentType, setDocumentType] = useState('id_card')
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

    setStatus(doc?.status ?? null)
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

    const filePath = `${user.id}/proof`

    /* 1️⃣ Upload file */
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

    /* 2️⃣ INSERT ROW ONLY IF NOT EXISTS (IMPORTANT FIX) */
    await supabase
      .from('verification_documents')
      .insert({
        user_id: user.id,
        document_url: filePath,
        document_type: documentType,
        status: 'pending',
      })
      .onConflict('user_id')
      .ignore()

    /* 3️⃣ EDGE FUNCTION TRIGGER */
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_id: user.id,
              document_path: filePath,
              document_type: documentType,
            }),
          }
        )
      }
    } catch (err) {
      console.warn('OCR trigger failed:', err)
    }

    alert('Document uploaded. Verification pending.')
    await fetchVerificationStatus(user)
  }

  return (
    <div className="verify-page">
      <div className="verify-card">

        <h2 className="verify-title">Verify Your College Identity</h2>

        <p className="verify-subtext">
          Upload a valid document to confirm your identity.
          This helps us keep CampusConnect safe and trusted.
        </p>

        <div className="doc-type">
          <label>
            <input
              type="radio"
              checked={documentType === 'id_card'}
              onChange={() => setDocumentType('id_card')}
            />
            Student — Upload College ID
          </label>

          <label>
            <input
              type="radio"
              checked={documentType === 'degree_certificate'}
              onChange={() => setDocumentType('degree_certificate')}
            />
            Alumni / Senior — Upload Degree Certificate
          </label>
        </div>

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
              accept=".jpg,.png"
              onChange={e => setFile(e.target.files[0])}
            />

            <p className="upload-help">
              Accepted formats: JPG, PNG<br />
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

      </div>
    </div>
  )
}
