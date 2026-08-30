import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { username, role } = useAuth()

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden text-slate-600"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-serif text-brand-900 text-sm font-medium">
          {role === ROLES.ADMIN ? 'Administration Portal' : 'Captain Portal'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-sans text-sm text-slate-600 hidden sm:block">{username}</span>
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

