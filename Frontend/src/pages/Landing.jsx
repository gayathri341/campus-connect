import { useNavigate } from 'react-router-dom'
import '../styles/landing.css'
import logo from '../assets/newlogo.png'
import GroupStudyIcon from "../assets/groupstudysession.svg";
import Professional from "../assets/professionalnetworking.svg";
import SafeCommunity from "../assets/safecommunity.svg";
import SecureMessaging from "../assets/securemessaging.svg";
import SecurityTrust from "../assets/securitytrust.svg";
import PlacementResources from "../assets/placementresources.svg";
import Profile from "../assets/profile.svg";
import Notifications from "../assets/notifications.svg";
import Search from "../assets/search.png";
import Event from "../assets/event.png";
import Login from "../assets/login.png";
import Code from "../assets/code.png";
import User from "../assets/profile.png";
import City from "../assets/city.png";

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
        <span onClick={() =>
      document
        .getElementById("how-it-works")
        .scrollIntoView({ behavior: "smooth" })
    }>How it Works</span>
        <span  onClick={() =>
      document
        .getElementById("features")
        .scrollIntoView({ behavior: "smooth" })
    }>Features</span>
        <span onClick={() =>
      document
        .getElementById("why-us")
        .scrollIntoView({ behavior: "smooth" })
    }>Why Us</span>
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
          Structured<br />  Guidance from <br />
          <span>Seniors Who've <br /> Been There</span>
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
            <div className="avatar1">S</div>
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
            <div className="avatar2">A</div>
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
       <div class="profile-float">
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
        </div>
        

        <div className="filters-card">
          <h5>Filters</h5>
          <p><strong>Domain:</strong> Backend</p>
          <p><strong>Batch:</strong> 2024</p>
          <p><strong>Company:</strong> Product</p>
        </div>
      </div>
    </section>
  

      {/* ===== HOW STUDENTS USE SECTION ===== */}
<section className="howuse-section" id="how-it-works">
  <h2 className="howuse-title">
    How Students Use <span>CampusConnect</span>
  </h2>
  
  <div className="howuse-layout">

    {/* LEFT : STEPS */}
    <div className="howuse-steps">
      <h3 className="steps-title">Get Started in Minutes</h3>

      <div className="step-item">
        <span className="step-number">01</span>
        <div className="step-icon"><img src={Login}></img></div>
        <h4>Login with College Email</h4>
        <p>Secure access ensures only verified students can join.</p>
      </div>

      <div className="step-item">
        <span className="step-number">02</span>
        <div className="step-icon"><img src={Search}></img></div>
        <h4>Filter Seniors by Need</h4>
        <p>Search by domain, skills, batch, or placement company.</p>
      </div>

      <div className="step-item">
        <span className="step-number">03</span>
        <div className="step-icon"><img src={Event}></img></div>
        <h4>Connect & Schedule</h4>
        <p>Book mentorship sessions and receive structured guidance.</p>
      </div>
    </div> 

  <div className="howuse-card">
    {/* User header */}
    <div className="howuse-user">
      <div className="howuse-avatar">P</div>
      <div>
        <h4>Priya, 2nd Year CSE</h4>
        <p>Preparing for Java placements</p>
      </div>
    </div>

    {/* Filters */}
    <p className="howuse-subtext">She filters seniors by:</p>

    <div className="howuse-filters">
      <div className="howuse-filter">
        <span className="icon"><img src={Code}></img></span>
        <div>
          <strong>Domain</strong><br/>
          <small>Java / Backend</small>
        </div>
      </div>

      <div className="howuse-filter">
        <span className="icon"><img src={User}></img></span>
        <div>
          <strong>Batch</strong><br/>
          <small>2024</small>
        </div>
      </div>

      <div className="howuse-filter">
        <span className="icon"><img src={City}></img></span>
        <div>
          <strong>Company Type</strong><br/>
          <small>Product-based</small>
        </div>
      </div>
    </div>

    {/* Result */}
    <div className="howuse-result">
      <span className="check">✔</span>
      <div>
        <h5>Connected with a Verified Senior</h5>
        <p>
          She scheduled a mentorship session and received structured guidance
          on DSA preparation, resume building, and interview strategies — all
          from someone who recently got placed at a top product company.
        </p>
      </div>
    </div>
  </div>
  </div>

  
</section>


      {/* Features Section */}
  <section className="features-section" id="features">
  <div className="features-header">
    <h2>Everything you need to succeed</h2>
    <p>
      From networking to resources, we've got all the tools
      to help you navigate your academic and professional journey.
    </p>
  </div>

  <div className="features-track">
    <div className="features-card">
      <div className="card-icon">{/* SVG here */}</div>
      <h3>Professional Networking</h3>
      <img className="card-img" src={Professional} alt="" />
      <p>  Connect with students and early-stage professionals across domains.
            Build meaningful relationships to share knowledge and opportunities.
            Expand your network to support learning and career growth.
</p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3>Secure Messaging</h3>
      <img className="card-img" src={SecureMessaging} alt="" />
      <p> Engage in real-time conversations with connected users.
            Share files instantly to support discussions and collaboration.
            Ensures smooth, fast, and secure communication anytime.
</p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3>Placement Resources</h3>
      <img className="card-img" src={PlacementResources} alt="" />
      <p>Explore company-wise placement papers and interview questions.
            Learn from real student interview experiences and insights.
            Prepare effectively with organized and reliable resources.
</p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3>Safe Community</h3>
      <img className="card-img" src={SafeCommunity} alt="" />
      <p> A built-in report system ensures a respectful environment.
            Helps prevent misuse and unprofessional behavior.
            Creates a safe, trusted space for all users.
      </p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3>Notification & Email Alerts</h3>
      <img className="card-img" src={Notifications} alt="" />
      <p>
      Receive instant notifications for connection requests and messages.
            Email alerts ensure no important update is missed.
            Keeps users informed even when offline.

      </p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3> Smart User Profiles</h3>
      <img className="card-img" src={Profile} alt="" />
      <p>
      Each user maintains a detailed professional profile.
            Showcase skills, domain interests, education, and achievements.
            Helps others understand and connect with the right people.

      </p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3>Security & Trust Management</h3>
      <img className="card-img" src={SecurityTrust} alt="" />
      <p>
      User actions are monitored through policy-based security rules.
            Accounts involved in repeated violations are automatically limited.
            Protects users from impersonation and misuse.

      </p>
    </div>

    <div className="features-card">
      <div className="card-icon"></div>
      <h3>Group Study Sessions</h3>
      <img className="card-img" src={GroupStudyIcon} alt="" />
      <p>
        Join domain-based and company-focused group study rooms.
        Collaborate, discuss topics, and share resources in real time.
        Encourages peer learning and collective growth.
      </p>
    </div>
  </div>
</section>


      
  {/* CTA Section */}
<section className="cta-section" id="why-us">

<div className="cta-layout">

  {/* LEFT CONTENT */}
  <div className="cta-left">
    <h2 className="cta-title">
      Connect. Learn. Grow. Together.
    </h2>

    <p className="cta-quote">
      “Designed to connect students within a trusted campus network.
      Match with peers and seniors based on skills, domain, and goals.
      Access shared placement resources and real-world experiences.
      Build meaningful connections that support your career journey.”
      <br />
      <span className="cta-author">– CampusConnect</span>
    </p>

    <button
      className="primary-btn large cta-btn"
      onClick={() => navigate("/signup")}
    >
      Create Free Account →
    </button>
  </div>

  {/* RIGHT VISUAL (EMPTY PLACEHOLDERS) */}
  <div className="cta-right">
    <div className="cta-box">
      {/* SVG / Image goes here */}
    </div>

    <div className="cta-circle cta-circle-blue"></div>
    <div className="cta-circle cta-circle-yellow"></div>
    <div className="cta-circle cta-circle-yellow2"></div>
    <div className="cta-dots"></div>
  </div>

</div>

</section>

      {/* Footer */}
      <footer className="landing-footer">
        © 2026 CampusConnect. Built with ❤️ for students.
      </footer>
    </div>
  );
  

}
