import { Link } from 'react-router-dom'
export default function Dashboard() {
  return (
    <>
      <h2>Dashboard</h2>
      <p>Welcome 🎉</p>
      <Link to="/profile">
        <button>Go to Profile</button>
      </Link>
    </>
  )
}
