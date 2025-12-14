import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL
})

export const initiateGmailConnect = async () => {
  const { data } = await api.get('/api/auth/connect')
  return data
}

export const checkAuthStatus = async (email) => {
  const { data } = await api.get('/api/auth/status', {
    params: { email }
  })
  return data
}

export const disconnectGmail = async (email) => {
  const { data } = await api.delete('/api/auth/disconnect', {
    params: { email }
  })
  return data
}

export const handleOAuthCallback = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const email = urlParams.get('email')
  return email
}