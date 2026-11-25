import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Manages a stack of auto-dismissing toast notifications.
 * Preserves the 3500ms default dismissal timing and cleans up timers on unmount.
 */
export function useToast(duration = 3500) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { id, message, type }])
      timersRef.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        delete timersRef.current[id]
      }, duration)
    },
    [duration]
  )

  return { toasts, showToast }
}
