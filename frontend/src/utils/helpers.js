import { CONFIDENCE_LEVELS } from './constants'

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getConfidenceLevel = (confidence) => {
  if (confidence >= CONFIDENCE_LEVELS.HIGH.min) return CONFIDENCE_LEVELS.HIGH
  if (confidence >= CONFIDENCE_LEVELS.MEDIUM.min) return CONFIDENCE_LEVELS.MEDIUM
  return CONFIDENCE_LEVELS.LOW
}

export const getConfidenceBadgeClass = (confidence) => {
  const level = getConfidenceLevel(confidence)
  return `badge-${level.color}`
}

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const parseCategories = (categoriesString) => {
  if (!categoriesString) return []
  return categoriesString.split(',').map(c => c.trim()).filter(Boolean)
}

export const parseRecipients = (recipientsString) => {
  if (!recipientsString) return []
  return recipientsString.split(',').map(r => r.trim()).filter(Boolean)
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}