import { useState, useEffect } from 'react'
import { getClassificationHistory } from '../services/api'
import EmailCard from '../components/EmailCard'

function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await getClassificationHistory(100)
      setHistory(data.history)
      setLoading(false)
    } catch (error) {
      console.error('Error loading history:', error)
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(email => {
    const matchesSearch = !searchTerm || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDept = !filterDept || 
      email.categories.toLowerCase().includes(filterDept.toLowerCase())
    
    return matchesSearch && matchesDept
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-textDark mb-6">Classification History</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by sender or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Filter by department..."
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="card text-center text-gray-500">
          No emails found
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Showing {filteredHistory.length} of {history.length} emails
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredHistory.map((email) => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default History