import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  type: 'card' | 'table' | 'stat'
  count?: number
  className?: string
}

export function LoadingSkeleton({ type, count = 1, className }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div
        className={cn(
          'bg-card border border-border rounded-lg p-5 animate-pulse',
          className
        )}
      >
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/4" />
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div
        className={cn(
          'bg-card border border-border rounded-lg p-5 animate-pulse',
          className
        )}
      >
        <div className="h-3 bg-slate-200 rounded w-16 mb-3" />
        <div className="h-9 bg-slate-200 rounded w-24 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className={cn('bg-card border border-border rounded-lg animate-pulse p-4', className)}>
        <div className="h-5 bg-slate-200 rounded w-48 mb-4" />
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-border last:border-0">
            <div className="h-4 bg-slate-200 rounded w-16" />
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-20 ml-auto" />
          </div>
        ))}
      </div>
    )
  }

  return null
}
