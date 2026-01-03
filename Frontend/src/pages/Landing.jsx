import { useNavigate } from 'react-router-dom'
import '../styles/landing.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      {/* Top Navbar */}
      <header className="landing-header">
        <div className="logo">
          🎓 <span>CampusConnect</span>
        </div>

        <div className="nav-actions">
          <button className="link-btn" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="primary-btn" onClick={() => navigate('/login')}>
            Get Started →
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <span className="badge">⚡ Built for students, by students</span>

        <h1>
          Your Professional Network <br />
          <span>Starts Here</span>
        </h1>

        <p className="subtitle">
          Connect with fellow students, share placement resources,
          and build meaningful professional relationships that last a lifetime.
        </p>

        <div className="cta-buttons">
          <button
            className="primary-btn large"
            onClick={() => navigate('/login')}
          >
            Join CampusConnect →
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate('/signup')}
          >
            Learn More
          </button>
        </div>
      </main>
    </div>
  )
}
