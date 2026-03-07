import { cn } from '@/utils/cn'

export function Spinner({ className }) {
  return (
    <div
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
