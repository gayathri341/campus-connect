import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Verification() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('pending')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data } = await supabase
        .from('verification_documents')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) setStatus(data.status)
    }

    loadStatus()
  }, [])

  const uploadDoc = async () => {
    if (!file || !user) return

    const path = `${user.id}/proof.pdf`

    await supabase.storage
      .from('verification-docs')
      .upload(path, file, { upsert: true })

    const { data } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(path)

    await supabase.from('verification_documents').upsert({
      user_id: user.id,
      document_url: data.publicUrl,
      status: 'pending',
    })

    alert('Document uploaded. Verification pending.')
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

      <input type="file" accept=".pdf,.jpg,.png" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadDoc}>Upload Document</button>
    </div>
  )
}
