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

const schema = z.object({
  course_name: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  course_code: z
    .string()
    .min(1, 'Required')
    .max(20, 'Max 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, numbers, and hyphens (e.g. CS-101)'),
  description: z.string().optional(),
})

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

export function CourseFormModal({ open, onOpenChange, onSubmit, loading, apiError }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { course_name: '', course_code: '', description: '' },
  })

  useEffect(() => {
    if (open) form.reset({ course_name: '', course_code: '', description: '' })
  }, [open])

  const handleSubmit = form.handleSubmit((data) => onSubmit(data))
  const e = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Fill in the details to add a course to the catalogue.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-2">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="course_name">Course Name</Label>
            <Input
              id="course_name"
              placeholder="Introduction to Python"
              className="mt-1"
              aria-invalid={!!e.course_name}
              {...form.register('course_name')}
            />
            <FieldError message={e.course_name?.message} />
          </div>

          <div>
            <Label htmlFor="course_code">Course Code</Label>
            <Input
              id="course_code"
              placeholder="CS-101"
              className="mt-1 uppercase"
              aria-invalid={!!e.course_code}
              {...form.register('course_code', {
                setValueAs: (v) => v.toUpperCase(),
              })}
            />
            <p className="mt-1 text-xs text-gray-400">Uppercase letters, numbers, and hyphens only.</p>
            <FieldError message={e.course_code?.message} />
          </div>

          <div>
            <Label htmlFor="description">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
            <textarea
              id="description"
              rows={3}
              placeholder="A brief overview of the course…"
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
              {...form.register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? 'Saving…' : 'Add Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
