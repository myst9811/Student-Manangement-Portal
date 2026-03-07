import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '@/api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password)
    const { access_token } = response.data.data
    localStorage.setItem('access_token', access_token)
    setToken(access_token)
    return response.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
  }, [])

  const isAuthenticated = Boolean(token)

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
