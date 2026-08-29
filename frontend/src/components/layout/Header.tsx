import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'

export function Header() {
  const { username, role } = useAuth()

  return (
    <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-serif text-brand-900 text-sm font-medium">
          {role === ROLES.ADMIN ? 'Administration Portal' : 'Captain Portal'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-sans text-sm text-slate-600">{username}</span>
        <span
          className={cn(
            'font-mono text-xs px-2 py-0.5 rounded border',
            role === ROLES.ADMIN
              ? 'bg-brand-900 text-white border-brand-900'
              : 'bg-surface text-slate-600 border-border'
          )}
        >
          {role === ROLES.ADMIN ? 'ADMIN' : 'CAPTAIN'}
        </span>
      </div>
    </header>
  )
}

