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
    
    let userRole: Role = ROLES.CAPTAIN
    let fullName = username
    let id: number | undefined
    let teamId: number | undefined
    let campId: number | undefined

    try {
      // 1. Try dedicated /api/auth/me endpoint
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
      })

      if (meRes.status === 401) {
        throw new Error('Invalid username or password')
      }

      if (meRes.ok) {
        const data = await meRes.json()
        userRole = data.role === 'ROLE_ADMIN' ? ROLES.ADMIN : ROLES.CAPTAIN
        fullName = data.fullName || username
        id = data.id
        teamId = data.teamId
        campId = data.campId
      } else {
        // 2. Fallback if backend server hasn't been restarted with /api/auth/me
        const sportsRes = await fetch(`${API_BASE_URL}/api/sports`, {
          headers: { Authorization: token },
        })
        if (sportsRes.status === 401 || !sportsRes.ok) {
          throw new Error('Invalid username or password')
        }

        // Verify if user is admin (admin-only endpoint)
        const adminCheck = await fetch(`${API_BASE_URL}/api/users/captains`, {
          headers: { Authorization: token },
        })
        userRole = adminCheck.ok ? ROLES.ADMIN : ROLES.CAPTAIN
      }
    } catch (err: any) {
      throw new Error(err.message || 'Invalid username or password')
    }

    sessionStorage.setItem('auth', JSON.stringify({ 
      token, 
      username, 
      fullName, 
      role: userRole,
      id,
      teamId,
      campId
    }))
    
    setRole(userRole)
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
