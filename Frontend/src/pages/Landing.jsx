import { useNavigate } from 'react-router-dom'
import '../styles/landing.css'
import logo from '../assets/logo.svg'


export default function Landing() {
  const navigate = useNavigate()

  return (
    
    <div className="landing-container">
      {/* Top Navbar */}
   
      <header className="landing-header">
        
        <div className="logo">
        <img src={logo} alt="CampusConnect" className="logo-img" />
          <span>CampusConnect</span>
        </div>
  {/* 🔥 NEW NAV LINKS (red marked) */}
     <nav className="nav-links">
        <span>How it Works</span>
        <span>Features</span>
        <span>Why Us</span>
      </nav>

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
    <section className="hero hero-layout">
      {/* LEFT SIDE (unchanged content) */}
      <div className="hero-left">
        <span className="badge verified-badge">
          ✅ College-only verified platform
        </span>

        <h1>
          Your Professional Network <br />
          <span>Starts Here</span>
        </h1>

        <p className="subtitle">
          Connect with fellow students, share placement resources, and build
          meaningful professional relationships that last a lifetime.
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
      </div>

      {/* 🔥 RIGHT SIDE PREVIEW (red marked card area) */}
      <div className="hero-right">
     {/*Profile card 1*/}
      <div className="profile-card1">
          <div className="profile-header1">
            <div className="avatar1">AK</div>
            <div className= "arun1">
              <h4>Shalini</h4>
              <p>Oracle Developer • Batch 2023</p>
            </div>
            <span className="verified-tag1">Verified</span>
          </div>

          <div className="session-card1">
            <span className="dot1" /> Upcoming Session
            <h5>Resume Review</h5>
            <p>Tomorrow, 4:00 PM</p>
          </div>
        </div>

       {/*Profile card 2*/}
       <div className="profile-card2">
          <div className="profile-header2">
            <div className="avatar2">AK</div>
            <div className= "arun2">
              <h4>Anthony</h4>
              <p>R & D Engineer• Batch 2023</p>
            </div>
            <span className="verified-tag2">Verified</span>
          </div>

          <div className="session-card2">
            <span className="dot2" /> Upcoming Session
            <h5>Resume Review</h5>
            <p>Tomorrow, 4:00 PM</p>
          </div>
        </div>

       {/*Profile card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">AK</div>
            <div className= "arun">
              <h4>Arun Kumar</h4>
              <p>Java Backend • Batch 2024</p>
            </div>
            <span className="verified-tag">Verified</span>
          </div>

          <div className="session-card">
            <span className="dot" /> Upcoming Session
            <h5>Resume Review</h5>
            <p>Tomorrow, 4:00 PM</p>
          </div>
        </div>
        

        <div className="filters-card">
          <h5>Filters</h5>
          <p><strong>Domain:</strong> Backend</p>
          <p><strong>Batch:</strong> 2024</p>
          <p><strong>Company:</strong> Product</p>
        </div>
      </div>
    </section>
  
      {/* Features Section */}
      <section className="features-section">
        <div className="features-header">
          <h2>Everything you need to succeed</h2>
          <p>
            From networking to resources, we've got all the tools
            to help you navigate your academic and professional journey.
          </p>
        </div>
  
        <div className="features-grid">
          <div className="features-card">
            <h3>Professional Networking</h3>
            <p>
              Connect with students and early professionals from various domains.
            </p>
          </div>
  
          <div className="features-card">
            <h3>Secure Messaging</h3>
            <p>
              Real-time chat with file sharing for connected users.
            </p>
          </div>
  
          <div className="features-card">
            <h3>Placement Resources</h3>
            <p>
              Access company-wise placement papers and interview experiences.
            </p>
          </div>
  
          <div className="features-card">
            <h3>Safe Community</h3>
            <p>
              Report system to maintain a respectful and professional environment.
            </p>
          </div>
        </div>
      </section>
  
      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <p>
          Join thousands of students who are already building their
          professional network on CampusConnect.
        </p>
  
        <button
          className="primary-btn large"
          onClick={() => navigate("/signup")}
        >
          Create Free Account →
        </button>
      </section>
  
      {/* Footer */}
      <footer className="landing-footer">
        © 2026 CampusConnect. Built with ❤️ for students.
      </footer>
    </div>
  );
  

}
