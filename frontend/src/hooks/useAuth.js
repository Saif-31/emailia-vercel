import { useState, useEffect } from 'react'
import { checkAuthStatus, initiateGmailConnect, disconnectGmail } from '../services/auth'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    if (email) {
      checkAuthStatus(email)
        .then(data => {
          setIsAuthenticated(data.authenticated)
          setUserEmail(email)
        })
        .catch(() => {
          localStorage.removeItem('userEmail')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const connect = async () => {
    try {
      const data = await initiateGmailConnect()
      window.location.href = data.authorization_url
    } catch (error) {
      console.error('OAuth error:', error)
      throw error
    }
  }

  const disconnect = async () => {
    try {
      await disconnectGmail(userEmail)
      setIsAuthenticated(false)
      setUserEmail(null)
      localStorage.removeItem('userEmail')
    } catch (error) {
      console.error('Disconnect error:', error)
      throw error
    }
  }

  const login = (email) => {
    setIsAuthenticated(true)
    setUserEmail(email)
    localStorage.setItem('userEmail', email)
  }

  return {
    isAuthenticated,
    userEmail,
    loading,
    connect,
    disconnect,
    login
  }
}