import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL
})

export const fetchAndProcessEmails = async (userEmail, maxResults = 10) => {
  const { data } = await api.post('/api/emails/fetch-and-process', {
    user_email: userEmail,
    max_results: maxResults
  })
  return data
}

export const testGmailConnection = async (userEmail) => {
  const { data } = await api.get('/api/emails/test-connection', {
    params: { user_email: userEmail }
  })
  return data
}

export const manualForward = async (reviewId, recipients, userEmail) => {
  const { data } = await api.post('/api/emails/manual-forward', {
    review_id: reviewId,
    recipients,
    user_email: userEmail
  })
  return data
}

export const getClassificationHistory = async (limit = 50) => {
  const { data } = await api.get('/api/dashboard/history', {
    params: { limit }
  })
  return data
}

export const getPendingReviews = async () => {
  const { data } = await api.get('/api/dashboard/pending-reviews')
  return data
}

export const getDashboardStats = async () => {
  const { data } = await api.get('/api/dashboard/stats')
  return data
}

export const getEmailDetails = async (emailId) => {
  const { data } = await api.get(`/api/dashboard/email-details/${emailId}`)
  return data
}

export default api