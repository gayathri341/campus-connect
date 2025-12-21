import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setAuthenticated(true)
      } else {
        setAuthenticated(false)
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) return <p>Checking login...</p>

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
