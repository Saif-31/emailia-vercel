import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDashboardStats, getClassificationHistory } from '../services/api'
import { usePolling } from '../hooks/usePolling'
import StatsCard from '../components/StatsCard'
import EmailCard from '../components/EmailCard'
import ProcessingModal from '../components/ProcessingModal'
import TeamMemberManager from '../components/TeamMemberManager'
import { Mail, PlayCircle, StopCircle } from 'lucide-react'

function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [userEmail, setUserEmail] = useState('')
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [maxResults, setMaxResults] = useState(5)

  // Handle OAuth callback and authentication
  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    
    if (emailFromUrl) {
      console.log('✅ Email from OAuth callback:', emailFromUrl)
      localStorage.setItem('userEmail', emailFromUrl)
      setUserEmail(emailFromUrl)
      // Clean URL
      navigate('/dashboard', { replace: true })
    } else {
      const storedEmail = localStorage.getItem('userEmail')
      if (storedEmail) {
        setUserEmail(storedEmail)
      } else {
        console.log('❌ No email found, redirecting to auth')
        navigate('/')
      }
    }
  }, [searchParams, navigate])

  const loadDashboardData = async () => {
    if (!userEmail) return
    
    try {
      console.log('🔄 Loading dashboard data...')
      const [statsData, historyData] = await Promise.all([
        getDashboardStats(),
        getClassificationHistory(20)
      ])
      console.log('✅ Stats loaded:', statsData)
      console.log('✅ History loaded:', historyData)
      setStats(statsData)
      setHistory(historyData.history || historyData)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error loading dashboard:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userEmail) {
      loadDashboardData()
    }
  }, [userEmail])

  const { isPolling, stopPolling, startPolling } = usePolling(
    () => {
      if (userEmail) {
        console.log('🔄 Auto-refresh triggered')
        loadDashboardData()
      }
    },
    false, // Don't start automatically
    30000  // Poll every 30 seconds
  )

  const handleStartProcessing = () => {
    setShowProcessingModal(true)
  }

  const handleCloseProcessing = () => {
    setShowProcessingModal(false)
    console.log('🔄 Processing complete, reloading dashboard data...')
    
    // ✅ Force reload data after processing to update stats
    setTimeout(() => {
      loadDashboardData()
    }, 500) // Small delay to ensure backend has saved the data
  }

  // ✅ Add event listener for processing updates
  useEffect(() => {
    const handleProcessingUpdate = () => {
      console.log('📊 Processing update received, refreshing stats...')
      loadDashboardData()
    }

    // Listen for custom event from ProcessingModal
    window.addEventListener('emailProcessed', handleProcessingUpdate)

    return () => {
      window.removeEventListener('emailProcessed', handleProcessingUpdate)
    }
  }, [userEmail])

  if (!userEmail || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Connected as: {userEmail}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
            <label htmlFor="maxResults" className="text-sm text-gray-600">
              Emails to fetch:
            </label>
            <select
              id="maxResults"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
              <option value={9}>9</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <button
            onClick={handleStartProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Mail size={18} />
            Process Emails
          </button>
          
          <button
            onClick={isPolling ? stopPolling : startPolling}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isPolling 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPolling ? (
              <>
                <StopCircle size={18} />
                Stop Auto-Refresh
              </>
            ) : (
              <>
                <PlayCircle size={18} />
                Start Auto-Refresh
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Processed"
          value={stats?.total_processed || stats?.total_classified || 0}
          icon="📧"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats?.pending_reviews || 0}
          icon="⚠️"
        />
        <StatsCard
          title="Today's Count"
          value={stats?.today_processed || stats?.today_classified || 0}
          icon="📅"
        />
        <StatsCard
          title="Avg Confidence"
          value={`${Math.round(stats?.avg_confidence || 0)}%`}
          icon="🎯"
        />
      </div>

      {/* ✅ TeamMemberManager now handles its own state via API */}
      <div className="mb-8">
        <TeamMemberManager />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {history.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            <Mail className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium">No emails processed yet</p>
            <p className="text-sm mt-2">Click "Process Emails" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {history.map((email) => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={showProcessingModal}
        onClose={handleCloseProcessing}
        userEmail={userEmail}
        maxResults={maxResults}
      />
    </div>
  )
}

export default Dashboard