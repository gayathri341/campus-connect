import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import '../styles/verification.css'


export default function Verification() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  // 🔁 Reusable fetch function
  const fetchVerificationStatus = async (currentUser) => {
    // 1️⃣ Always check profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', currentUser.id)
      .single()

    // ✅ If verified → dashboard
    if (profile?.is_verified) {
      navigate('/dashboard')
      return
    }

    // 2️⃣ Else check verification document status
    const { data: doc } = await supabase
      .from('verification_documents')
      .select('status')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (doc?.status) {
      setStatus(doc.status)
    } else {
      setStatus(null)
    }
  }

  // 🔹 On page load
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

    const filePath = `${user.id}/proof.pdf`

    // 3️⃣ Upload to storage
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

    // 4️⃣ Insert verification record
    const { error: dbError } = await supabase
      .from('verification_documents')
      .insert({
        user_id: user.id,
        document_url: filePath,
        status: 'pending',
      })

    if (dbError) {
      alert('DB error')
      return
    }

    alert('Document uploaded. Verification pending.')

    // 🔁 Re-fetch status after upload
    await fetchVerificationStatus(user)
  }

  return (
    <div>
      <h2>Student Verification</h2>

      {status === 'pending' && (
        <p>⏳ Verification pending. Please wait.</p>
      )}

      {status === 'rejected' && (
        <p>❌ Verification rejected. Upload again.</p>
      )}

      {!status && (
        <p>📄 Please upload your verification document.</p>
      )}

      {/* Upload allowed only if NOT approved */}
      {(status === null || status === 'pending' || status === 'rejected') && (
        <>
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={e => setFile(e.target.files[0])}
          />
          <button onClick={uploadDoc}>Upload Document</button>
        </>
      )}
    </div>
  )
}
