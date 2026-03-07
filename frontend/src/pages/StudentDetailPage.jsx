import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, CalendarDays, BookOpen,
  UserX, Trash2, PlusCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Toaster } from '@/components/Toaster'
import { useStudent, useDeactivateStudent, useEnrollStudent, useUnenrollStudent } from '@/hooks/useStudents'
import { useCoursesList } from '@/hooks/useCourses'
import { useToast } from '@/hooks/useToast'

function EnrollModal({ open, onOpenChange, student, onEnroll, loading }) {
  const [selectedId, setSelectedId] = useState('')
  const { data } = useCoursesList({ page: 1, page_size: 100 })
  const allCourses = data?.data ?? []
  const enrolledIds = new Set((student?.courses ?? []).map((c) => String(c.id)))
  const available = allCourses.filter((c) => !enrolledIds.has(String(c.id)))

  const handleSubmit = () => {
    if (selectedId) onEnroll(Number(selectedId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll in Course</DialogTitle>
          <DialogDescription>
            Select a course to enroll {student?.first_name} {student?.last_name} in.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No available courses — this student is already enrolled in everything.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto py-1">
            {available.map((c) => (
              <label
                key={c.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedId === String(c.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="course"
                  value={c.id}
                  checked={selectedId === String(c.id)}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.course_name}</p>
                  <p className="text-xs text-gray-500">{c.course_code}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedId || loading}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {loading ? 'Enrolling…' : 'Enroll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toasts, toast, dismiss } = useToast()

  const [deactivateOpen, setDeactivateOpen]       = useState(false)
  const [enrollOpen, setEnrollOpen]               = useState(false)
  const [unenrollTarget, setUnenrollTarget]       = useState(null)

  const { data, isPending, isError } = useStudent(id)
  const student = data?.data

  const deactivateMutation = useDeactivateStudent()
  const enrollMutation     = useEnrollStudent()
  const unenrollMutation   = useUnenrollStudent()

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(id)
      setDeactivateOpen(false)
      toast({ message: 'Student deactivated successfully.' })
    } catch {
      toast({ message: 'Failed to deactivate student.', variant: 'error' })
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      await enrollMutation.mutateAsync({ studentId: id, courseId })
      setEnrollOpen(false)
      toast({ message: 'Student enrolled successfully.' })
    } catch (err) {
      const code = err?.response?.data?.error?.code
      toast({
        message: code === 'ALREADY_ENROLLED' ? 'Already enrolled in this course.' : 'Failed to enroll.',
        variant: 'error',
      })
    }
  }

  const handleUnenroll = async () => {
    try {
      await unenrollMutation.mutateAsync({ studentId: id, courseId: unenrollTarget.id })
      setUnenrollTarget(null)
      toast({ message: `Removed from ${unenrollTarget.course_name}.` })
    } catch {
      toast({ message: 'Failed to remove enrollment.', variant: 'error' })
    }
  }

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isError || !student) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 mb-4">Student not found.</p>
        <Button variant="outline" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Students
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {student.first_name[0]}{student.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {student.first_name} {student.last_name}
                  </h2>
                  <Badge variant={student.is_active ? 'success' : 'secondary'}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {student.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Enrolled {student.enrollment_date}
                  </span>
                </div>
              </div>
            </div>

            {student.is_active && (
              <Button
                variant="outline"
                onClick={() => setDeactivateOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2"
              >
                <UserX className="h-4 w-4" />
                Deactivate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enrolled courses */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-400" />
              Enrolled Courses
              <span className="text-sm font-normal text-gray-400">
                ({student.courses?.length ?? 0})
              </span>
            </CardTitle>
            {student.is_active && (
              <Button
                size="sm"
                onClick={() => setEnrollOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Enroll
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!student.courses?.length ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Not enrolled in any courses yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {student.courses.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.course_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.course_code} · enrolled {new Date(c.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  {student.is_active && (
                    <button
                      onClick={() => setUnenrollTarget(c)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove enrollment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate Student"
        description={`Are you sure you want to deactivate ${student.first_name} ${student.last_name}?`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
      />

      <EnrollModal
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        student={student}
        onEnroll={handleEnroll}
        loading={enrollMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(unenrollTarget)}
        onOpenChange={(v) => !v && setUnenrollTarget(null)}
        title="Remove Enrollment"
        description={`Remove ${student.first_name} from ${unenrollTarget?.course_name}?`}
        confirmLabel="Remove"
        onConfirm={handleUnenroll}
        loading={unenrollMutation.isPending}
      />

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
