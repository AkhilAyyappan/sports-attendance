import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  className?: string
  icon?: ReactNode
}

export function StatCard({ label, value, sublabel, className, icon }: StatCardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-lg p-5 flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-sans">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <span className="text-3xl font-mono font-semibold text-brand-900 tracking-tight">
        {value}
      </span>
      {sublabel && (
        <span className="text-xs text-slate-400 font-sans mt-1">{sublabel}</span>
      )}
    </div>
  )
}
