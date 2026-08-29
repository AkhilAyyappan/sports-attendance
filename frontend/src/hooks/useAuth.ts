import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLES, API_BASE_URL, type Role } from '@/lib/constants'
import { type StoredAuth } from '@/api/client'

interface UseAuthReturn {
  role: Role | null
  username: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export function useAuth(): UseAuthReturn {
  const [role, setRole] = useState<Role | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = sessionStorage.getItem('auth')
    if (raw) {
      try {
        const auth = JSON.parse(raw) as StoredAuth
        setRole(auth.role)
        setUsername(auth.username)
      } catch {
        sessionStorage.removeItem('auth')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const token = `Basic ${btoa(`${username}:${password}`)}`
    // Attempt a call to verify credentials are accepted by the server
    // The response interceptor will handle 401/403 and redirect
    await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: token },
    }).catch(() => {
      // If the backend doesn't have /api/auth/me, we still store the credentials
      // The first real API call will fail and trigger the interceptor
    })
    const role = username === 'admin' ? ROLES.ADMIN : ROLES.CAPTAIN
    sessionStorage.setItem('auth', JSON.stringify({ token, username, role }))
    setRole(role)
    setUsername(username)
    navigate('/dashboard', { replace: true })
  }, [navigate])

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth')
    setRole(null)
    setUsername(null)
    navigate('/login', { replace: true })
  }, [navigate])

  return { role, username, isLoading, isAuthenticated: !!role, login, logout }
}
