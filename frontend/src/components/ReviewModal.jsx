import { useState } from 'react'
import { parseCategories } from '../utils/helpers'

function ReviewModal({ isOpen, onClose, review, teamMembers, onForward }) {
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !review) return null

  const toggleRecipient = (email) => {
    setSelectedRecipients(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    )
  }

  const handleForward = async () => {
    if (selectedRecipients.length === 0) return
    
    setIsSubmitting(true)
    try {
      await onForward(review.id, selectedRecipients)
      setSelectedRecipients([])
      onClose()
    } catch (error) {
      console.error('Forward error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-textDark mb-4">Review Email</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">From:</p>
          <p className="font-medium">{review.sender}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Subject:</p>
          <p className="font-medium">{review.subject}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Reason:</p>
          <p className="text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
            {review.reason}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Content:</p>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm max-h-48 overflow-y-auto">
            {review.content}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Recipients:</p>
          <div className="grid grid-cols-1 gap-2">
            {teamMembers.map((member) => (
              <label key={member.email} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(member.email)}
                  onChange={() => toggleRecipient(member.email)}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email} • {member.department}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            onClick={handleForward}
            className="btn-primary flex-1"
            disabled={selectedRecipients.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Forwarding...' : `Forward to ${selectedRecipients.length} recipient(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal