import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tpp_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tpp_token')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(res => setUser(res.data))
      .catch(() => { localStorage.removeItem('tpp_token'); localStorage.removeItem('tpp_user') })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    localStorage.setItem('tpp_token', res.data.token)
    localStorage.setItem('tpp_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data
  }, [])

  const register = useCallback(async (data) => {
    const res = await authApi.register(data)
    localStorage.setItem('tpp_token', res.data.token)
    localStorage.setItem('tpp_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data
  }, [])

  const completeRegistration = useCallback(async (data) => {
    const res = await authApi.completeRegistration(data)
    localStorage.setItem('tpp_token', res.data.token)
    localStorage.setItem('tpp_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('tpp_token')
    localStorage.removeItem('tpp_user')
    setUser(null)
    window.location.href = '/'
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await authApi.me()
    setUser(res.data)
    localStorage.setItem('tpp_user', JSON.stringify(res.data))
  }, [])

  const isAdmin = user?.role === 'ADMIN'
  const isJournalist = user?.house === 'JOURNALIST' || user?.role === 'ADMIN'
  const isFactChecker = user?.house === 'FACT_CHECKER' || user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, completeRegistration, logout, refreshUser, isAdmin, isJournalist, isFactChecker }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
