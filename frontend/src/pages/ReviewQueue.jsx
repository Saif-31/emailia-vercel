import { useState, useEffect } from 'react'
import { getPendingReviews, manualForward } from '../services/api'
import { formatDate } from '../utils/helpers'
import ReviewModal from '../components/ReviewModal'

function ReviewQueue({ userEmail }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])

  const loadReviews = async () => {
    try {
      const data = await getPendingReviews()
      setReviews(data.reviews)
      setLoading(false)
    } catch (error) {
      console.error('Error loading reviews:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
    const savedMembers = localStorage.getItem('teamMembers')
    if (savedMembers) {
      setTeamMembers(JSON.parse(savedMembers))
    }
  }, [])

  const handleReview = (review) => {
    setSelectedReview(review)
    setShowModal(true)
  }

  const handleForward = async (reviewId, recipients) => {
    try {
      await manualForward(reviewId, recipients, userEmail)
      await loadReviews()
    } catch (error) {
      console.error('Forward error:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-textDark mb-6">Review Queue</h1>

      {reviews.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600">No emails pending review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-textDark">{review.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1">From: {review.sender}</p>
                </div>
                <span className="badge badge-yellow">Needs Review</span>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-700 mb-2">Reason:</p>
                <p className="text-sm bg-yellow-50 text-yellow-800 px-3 py-2 rounded">
                  {review.reason}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                <button
                  onClick={() => handleReview(review)}
                  className="btn-primary text-sm"
                >
                  Review & Forward
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        review={selectedReview}
        teamMembers={teamMembers}
        onForward={handleForward}
      />
    </div>
  )
}

export default ReviewQueue