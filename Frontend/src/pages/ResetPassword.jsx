import { useState } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"
import '../styles/resetpassword.css'


export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const handleReset = async () => {
    if (password !== confirmPassword) {
        alert("Passwords do not match")
        return
      }
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
        alert(error.message)
      } else {
        alert("Password updated successfully!")
        navigate('/login')
      }
  }

  return (
    <div className="reset-container">
  <div className="reset-card">
    <h2 className="reset-title">Set New Password</h2>
    <p className="reset-subtitle">Create a strong password to secure your account</p>

    <div className="reset-input-group">
    <input
    type="password"
    placeholder="Enter new password"
    className="reset-input"
    onChange={(e) => setPassword(e.target.value)}
     />
    </div>
    <div className="reset-input-group">
  <input
    type="password"
    placeholder="Confirm password"
    className="reset-input"
    onChange={(e) => setConfirmPassword(e.target.value)}
  />
</div>

    <button className="reset-btn" onClick={handleReset}>
      Update Password
    </button>
  </div>
</div>
  )
}