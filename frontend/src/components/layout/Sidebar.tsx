import { Link, useLocation } from 'react-router-dom'
import { ROLES, type Role } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  requiredRole?: Role
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Roster', href: '/roster', icon: <Users className="h-4 w-4" />, requiredRole: ROLES.CAPTAIN },
  { label: 'Attendance', href: '/attendance', icon: <ClipboardList className="h-4 w-4" />, requiredRole: ROLES.CAPTAIN },
]

export function Sidebar() {
  const { role, logout, username } = useAuth()
  const location = useLocation()

  const filteredItems = navItems.filter(
    (item) => !item.requiredRole || item.requiredRole === role
  )

  return (
    <aside className="w-64 bg-brand-900 flex flex-col min-h-screen flex-shrink-0">
      {/* Logo area */}
      <div className="px-6 py-5 border-b border-brand-800">
        <h1 className="font-serif text-white font-semibold text-lg leading-tight">
          Sports Camp
        </h1>
        <p className="font-sans text-brand-700 text-xs mt-0.5">Attendance System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors',
                isActive
                  ? 'bg-brand-800 text-parchment font-medium'
                  : 'text-slate-300 hover:bg-brand-800 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info & logout */}
      <div className="px-3 py-4 border-t border-brand-800">
        <div className="px-3 py-2 mb-2">
          <p className="font-sans text-white text-sm font-medium truncate">
            {username}
          </p>
          <p className="font-mono text-xs text-brand-700 uppercase tracking-wide">
            {role === ROLES.ADMIN ? 'Administrator' : 'Captain'}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-sans text-slate-400 hover:text-white hover:bg-brand-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

