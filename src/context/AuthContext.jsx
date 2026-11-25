import { useState, useEffect } from 'react'
import { AuthContext } from './authContextBase'
import { authService, seedDemoAdmin } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      try {
        await seedDemoAdmin()
        const activeUser = authService.getCurrentUser()
        setUser(activeUser)
      } catch (err) {
        console.error('[AuthContext] Initialization error:', err)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (identifier, password) => {
    const loggedUser = await authService.login(identifier, password)
    setUser(loggedUser)
    return loggedUser
  }

  const register = async (userData) => {
    const registeredUser = await authService.register(userData)
    setUser(registeredUser)
    return registeredUser
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isCreator: user?.role === 'creator',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
