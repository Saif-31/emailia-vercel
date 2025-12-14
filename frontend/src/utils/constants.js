export const API_BASE_URL = 'http://localhost:8000'

export const POLLING_INTERVAL = 10 * 60 * 1000 // 10 minutes

export const CONFIDENCE_LEVELS = {
  HIGH: { min: 0.9, label: 'High', color: 'green' },
  MEDIUM: { min: 0.7, label: 'Medium', color: 'yellow' },
  LOW: { min: 0, label: 'Low', color: 'red' }
}

export const ROUTES = {
  AUTH: '/',
  DASHBOARD: '/dashboard',
  REVIEW_QUEUE: '/review-queue',
  HISTORY: '/history'
}

export const DEPARTMENTS = [
  'AI',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Engineering',
  'Support',
  'Other'
]