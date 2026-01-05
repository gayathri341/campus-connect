import Navbar from '../components/Navbar'
import '../styles/dashboard.css'

export default function Dashboard() {
  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Connections</p>
            <h2>0</h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Resources</p>
            <h2>Coming Soon</h2>
          </div>
        </div>

        <div className="discover-card">
          <h3>Discover People</h3>

          <input
            className="search-input"
            placeholder="Search by name, college, or skills..."
          />

          <div className="filter-row">
            {['All', 'IT', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BIO', 'OTHER'].map(
              (item) => (
                <button
                  key={item}
                  className={`filter-btn ${item === 'All' ? 'active' : ''}`}
                >
                  {item}
                </button>
              )
            )}
          </div>

         
        </div>
      </div>
    </>
  )
}
