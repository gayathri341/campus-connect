import { Routes, Route } from 'react-router-dom'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Verification from './pages/Verification'
import ProtectedRoute from './components/ProtectedRoute'
import Messages from './pages/Messages'
import Connections from './pages/Connections'
import Resources from './pages/Resources'
import Notifications from './pages/Notifications'


export default function App() {
  return (
    <Routes>
      {/* 🌟 LANDING PAGE FIRST */}
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Verification */}
      <Route
        path="/verify"
        element={
          <ProtectedRoute>
            <Verification />
          </ProtectedRoute>
        }
      />

      {/* Protected Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />

        <Route
         path="/connections"
        element={
          <ProtectedRoute>
            <Connections />
         </ProtectedRoute>
        }
      />

        <Route
          path="/resources"
          element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        }
      />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

    </Routes>

    
  )
}
