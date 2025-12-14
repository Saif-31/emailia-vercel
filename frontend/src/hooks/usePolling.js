import { useState, useEffect, useRef } from 'react'
import { POLLING_INTERVAL } from '../utils/constants'

export const usePolling = (callback, enabled = true) => {
  const [isPolling, setIsPolling] = useState(enabled)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isPolling && enabled) {
      callback()
      
      intervalRef.current = setInterval(() => {
        callback()
      }, POLLING_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPolling, enabled])

  const startPolling = () => setIsPolling(true)
  const stopPolling = () => setIsPolling(false)
  const triggerNow = () => callback()

  return {
    isPolling,
    startPolling,
    stopPolling,
    triggerNow
  }
}