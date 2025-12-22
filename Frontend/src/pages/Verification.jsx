import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Verification() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('pending')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Load verification status
  useEffect(() => {
    const loadStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)

      const { data, error } = await supabase
        .from('verification_documents')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('FETCH STATUS ERROR:', error)
      }

      if (data?.status) {
        setStatus(data.status)
      }

      setLoading(false)
    }

    loadStatus()
  }, [])

  // 🔹 Upload verification document
  const uploadDoc = async () => {
    if (!file || !user) {
      alert('Please select a file')
      return
    }

    // OPTIONAL: size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be under 2 MB')
      return
    }

    const filePath = `${user.id}/proof.pdf`

    // 1️⃣ Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file, { upsert: true })

    console.log('UPLOAD ERROR:', uploadError)

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    // 2️⃣ Get public URL (for DB reference)
    const { data: urlData } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(filePath)

    // 3️⃣ Insert / update verification_documents table
    const { error: dbError } = await supabase
      .from('verification_documents')
      .upsert({
        user_id: user.id,
        document_url: urlData.publicUrl,
        status: 'pending',
      })

    if (dbError) {
      console.error('DB INSERT ERROR:', dbError)
      alert('Failed to save document info')
      return
    }

    alert('Document uploaded. Verification pending.')
    setStatus('pending')
  }

  if (loading) return <p>Loading verification status...</p>

  return (
    <div>
      <h2>Student Verification</h2>

      {status === 'pending' && (
        <p>⏳ Verification pending. Please wait.</p>
      )}

      {status === 'approved' && (
        <p>✅ Verification approved. Please logout and login again.</p>
      )}

      {status === 'rejected' && (
        <p>❌ Verification rejected. Upload again.</p>
      )}

      <input
        type="file"
        accept=".pdf,.jpg,.png"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={uploadDoc}>Upload Document</button>
    </div>
  )
}
