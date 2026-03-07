import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
})

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    setApiError(null)
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const code = err.response?.data?.error?.code
      if (code === 'INVALID_CREDENTIALS') {
        setApiError('Invalid email or password. Please try again.')
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex items-center justify-center rounded-full bg-white/10 p-6 backdrop-blur-sm">
            <GraduationCap className="h-16 w-16 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white">
            Student Management Portal
          </h1>
          <p className="max-w-md text-lg text-blue-200">
            Streamline your school administration with powerful tools for
            student records, course management, and enrollment tracking.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { label: 'Students', icon: '👨‍🎓' },
              { label: 'Courses', icon: '📚' },
              { label: 'Enrollments', icon: '📋' },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <div className="text-2xl">{icon}</div>
                <div className="mt-1 text-sm font-medium text-blue-100">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Mobile logo */}
            <motion.div variants={itemVariants} className="lg:hidden mb-2 flex flex-col items-center">
              <div className="mb-4 flex items-center justify-center rounded-full bg-slate-900 p-4">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Student Management Portal
              </h2>
            </motion.div>

            {/* Heading */}
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Sign in to access your admin dashboard
              </p>
            </motion.div>

            {/* API error banner */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Authentication failed</p>
                  <p className="mt-0.5 text-sm text-red-700">{apiError}</p>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={itemVariants}>
                <Label htmlFor="email" className="text-slate-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.edu"
                  className="mt-1.5"
                  disabled={isLoading}
                  aria-invalid={!!form.formState.errors.email}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  className="mt-1.5"
                  disabled={isLoading}
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="text-center text-xs text-slate-500">
              For internal use only. Unauthorized access is prohibited.
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
