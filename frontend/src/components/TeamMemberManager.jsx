import { useState, useEffect } from 'react'
import { validateEmail } from '../utils/helpers'
import { Plus, Trash2, Users } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function TeamMemberManager() {
  const [teamMembers, setTeamMembers] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', email: '', department: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // ✅ Load members from backend on mount
  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      console.log('📥 Fetching team members from backend...')
      const response = await fetch(`${API_BASE_URL}/api/dashboard/team-members`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      
      const data = await response.json()
      console.log('✅ Team members loaded:', data.members)
      setTeamMembers(data.members || [])
      setLoading(false)
    } catch (error) {
      console.error('❌ Error loading team members:', error)
      setError('Failed to load team members')
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    setError('')
    
    if (!newMember.name.trim() || !newMember.email.trim() || !newMember.department.trim()) {
      setError('All fields are required')
      return
    }

    if (!validateEmail(newMember.email)) {
      setError('Invalid email format')
      return
    }

    if (teamMembers.some(m => m.email === newMember.email)) {
      setError('Email already exists')
      return
    }

    try {
      console.log('📝 Adding team member:', newMember)
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/team-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add team member')
      }

      const result = await response.json()
      console.log('✅ Member added:', result)

      // ✅ Reload members from backend to get updated list with IDs
      await loadTeamMembers()

      // Reset form
      setNewMember({ name: '', email: '', department: '' })
      setIsAdding(false)
      setError('')
    } catch (error) {
      console.error('❌ Error adding team member:', error)
      setError(error.message || 'Failed to add team member')
    }
  }

  const handleRemove = async (memberId) => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return
    }

    try {
      console.log('🗑️ Deleting team member ID:', memberId)
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/team-members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete team member')
      }

      console.log('✅ Member deleted')

      // ✅ Reload members from backend
      await loadTeamMembers()
    } catch (error) {
      console.error('❌ Error deleting team member:', error)
      setError(error.message || 'Failed to delete team member')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading team members...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <span className="text-sm text-gray-500">({teamMembers.length})</span>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding)
            setError('')
            setNewMember({ name: '', email: '', department: '' })
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          {isAdding ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Department"
              value={newMember.department}
              onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          
          <div className="flex gap-2">
            <button 
              onClick={handleAdd} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Member
            </button>
            <button 
              onClick={() => {
                setIsAdding(false)
                setError('')
                setNewMember({ name: '', email: '', department: '' })
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !isAdding && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {teamMembers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No team members added yet</p>
        ) : (
          teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {member.department}
                </span>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete member"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TeamMemberManager