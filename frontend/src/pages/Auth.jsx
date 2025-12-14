import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { initiateGmailConnect } from '../services/auth'

function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already authenticated
    const storedEmail = localStorage.getItem('userEmail')
    if (storedEmail) {
      navigate('/dashboard')
      return
    }

    // Handle OAuth callback (email param from backend redirect)
    const emailFromCallback = searchParams.get('email')
    if (emailFromCallback) {
      console.log('✅ OAuth successful, email:', emailFromCallback)
      localStorage.setItem('userEmail', emailFromCallback)
      navigate('/dashboard')
    }
  }, [navigate, searchParams])

  const handleConnect = async () => {
    try {
      setLoading(true)
      console.log('🔄 Initiating Gmail connection...')
      
      const data = await initiateGmailConnect()
      console.log('✅ Auth data received:', data)
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
      alert('Failed to connect: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📧 Emailia</h1>
          <p className="text-gray-600">AI-Powered Email Auto-Routing System</p>
        </div>
        
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              Connect Gmail Account
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Secure OAuth 2.0 authentication via Google
        </p>
      </div>
    </div>
  )
}

export default Auth