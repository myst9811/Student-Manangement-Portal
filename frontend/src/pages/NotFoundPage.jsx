import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { GraduationCap } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="p-4 bg-slate-900 rounded-full mb-6">
        <GraduationCap className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-lg text-gray-500 mb-8">Page not found</p>
      <Button
        onClick={() => navigate('/dashboard')}
        className="bg-slate-900 hover:bg-slate-800 text-white"
      >
        Go to Dashboard
      </Button>
    </div>
  )
}
