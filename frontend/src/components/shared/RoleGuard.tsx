import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLES, type Role } from '@/lib/constants'

interface RoleGuardProps {
  requiredRole: Role
  children: React.ReactNode
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const raw = sessionStorage.getItem('auth')
    if (!raw) {
      navigate('/login', { replace: true })
      return
    }
    try {
      const stored = JSON.parse(raw) as { role: string }
      if (stored.role !== requiredRole) {
        navigate('/dashboard', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }, [requiredRole, navigate])

  return <>{children}</>
}

export const isAdmin = (role?: string) => role === ROLES.ADMIN
export const isCaptain = (role?: string) => role === ROLES.CAPTAIN
