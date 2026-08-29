import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'present' | 'absent' | 'late' | 'excused'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-accent text-white': variant === 'default',
          'border-transparent bg-surface text-slate-700': variant === 'secondary',
          'border-transparent bg-alert text-white': variant === 'destructive',
          'text-slate-700 bg-transparent': variant === 'outline',
          'border-transparent bg-green-100 text-green-800': variant === 'present',
          'border-transparent bg-red-100 text-red-800': variant === 'absent',
          'border-transparent bg-amber-100 text-amber-800': variant === 'late',
          'border-transparent bg-blue-100 text-blue-800': variant === 'excused',
        },
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'

export { Badge }
