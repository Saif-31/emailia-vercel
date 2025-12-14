import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ReviewQueue from './pages/ReviewQueue'
import History from './pages/History'
import Navbar from './components/Navbar'

function AppContent() {
  const [searchParams] = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for email in URL params (OAuth callback)
    const emailFromUrl = searchParams.get('email')
    
    if (emailFromUrl) {
      console.log('✅ Email from OAuth callback in App.jsx:', emailFromUrl)
      localStorage.setItem('userEmail', emailFromUrl)
      setUserEmail(emailFromUrl)
      setIsAuthenticated(true)
      setLoading(false)
      return
    }

    // Check localStorage
    const storedEmail = localStorage.getItem('userEmail')
    if (storedEmail) {
      setUserEmail(storedEmail)
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [searchParams])

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserEmail(null)
    localStorage.removeItem('userEmail')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar userEmail={userEmail} onLogout={handleLogout} />}

      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ?
            <Navigate to="/dashboard" replace /> :
            <Auth />
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ?
            <Dashboard userEmail={userEmail} /> :
            <Navigate to="/" replace />
          }
        />

        <Route
          path="/review-queue"
          element={
            isAuthenticated ?
            <ReviewQueue userEmail={userEmail} /> :
            <Navigate to="/" replace />
          }
        />

        <Route
          path="/history"
          element={
            isAuthenticated ?
            <History /> :
            <Navigate to="/" replace />
          }
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App