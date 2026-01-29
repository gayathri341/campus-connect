import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/verification.css'
import Doc from "../assets/docs.png"

export default function Verification() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [user, setUser] = useState(null)
  const [documentType] = useState('id_card')
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

    const { data } = await supabase
      .from('verification_documents')
      .select('status')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    setStatus(data?.status ?? null)
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
    const { error } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (error) {
      alert('Upload failed')
      return
    }

    /* 2️⃣ ONLY trigger edge function */
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

    alert('Document uploaded. Verification pending.')
    await fetchVerificationStatus(user)
  }

  return (
    <div className="verify-page">
      <div className="verify-card">

        <h2 className="verify-title">Verify Your College Identity</h2>

        {status === 'pending' && (
          <div className="verify-status pending">
            ⏳ Verification pending. Please wait.
          </div>
        )}

        {!status && (
          <div className="verify-status info">
            <img src={Doc} alt="doc" />
            Please upload your verification document.
          </div>
        )}

        <input
          type="file"
          accept=".jpg,.png"
          onChange={e => setFile(e.target.files[0])}
        />

        <button onClick={uploadDoc} disabled={!file}>
          Upload Document
        </button>

      </div>
    </div>
  )
}