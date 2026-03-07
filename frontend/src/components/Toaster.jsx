import { CheckCircle, XCircle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Toaster({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(({ id, message, variant }) => (
        <div
          key={id}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm',
            'animate-in slide-in-from-bottom-2 fade-in',
            variant === 'success'
              ? 'bg-white border-green-200 text-green-900'
              : 'bg-white border-red-200 text-red-900'
          )}
        >
          {variant === 'success'
            ? <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            : <XCircle    className="h-4 w-4 text-red-500   flex-shrink-0 mt-0.5" />
          }
          <span className="flex-1">{message}</span>
          <button onClick={() => onDismiss(id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
