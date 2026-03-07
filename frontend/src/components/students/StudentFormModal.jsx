import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  first_name:      z.string().min(1, 'Required').max(100),
  last_name:       z.string().min(1, 'Required').max(100),
  email:           z.string().email('Valid email required'),
  enrollment_date: z
    .string()
    .min(1, 'Required')
    .refine((d) => d <= today, { message: 'Cannot be a future date' }),
})

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

export function StudentFormModal({ open, onOpenChange, onSubmit, defaultValues, loading, apiError }) {
  const isEdit = Boolean(defaultValues?.id)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name:      '',
      last_name:       '',
      email:           '',
      enrollment_date: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        defaultValues
          ? {
              first_name:      defaultValues.first_name,
              last_name:       defaultValues.last_name,
              email:           defaultValues.email,
              enrollment_date: defaultValues.enrollment_date,
            }
          : { first_name: '', last_name: '', email: '', enrollment_date: '' }
      )
    }
  }, [open, defaultValues])

  const handleSubmit = form.handleSubmit((data) => onSubmit(data))
  const e = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the student details below.' : 'Fill in the details to register a new student.'}
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-2">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" className="mt-1" aria-invalid={!!e.first_name} {...form.register('first_name')} />
              <FieldError message={e.first_name?.message} />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" className="mt-1" aria-invalid={!!e.last_name} {...form.register('last_name')} />
              <FieldError message={e.last_name?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-1" aria-invalid={!!e.email} {...form.register('email')} />
            <FieldError message={e.email?.message} />
          </div>

          <div>
            <Label htmlFor="enrollment_date">Enrollment Date</Label>
            <Input
              id="enrollment_date"
              type="date"
              max={today}
              className="mt-1"
              aria-invalid={!!e.enrollment_date}
              {...form.register('enrollment_date')}
            />
            <FieldError message={e.enrollment_date?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
