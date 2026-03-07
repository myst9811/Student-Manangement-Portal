import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CourseFormModal } from '@/components/courses/CourseFormModal'
import { Toaster } from '@/components/Toaster'
import { useCoursesList, useCreateCourse } from '@/hooks/useCourses'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 20

function extractApiError(err) {
  const code = err?.response?.data?.error?.code
  if (code === 'COURSE_CODE_ALREADY_EXISTS') return 'That course code is already in use.'
  return err?.response?.data?.message ?? 'Something went wrong. Please try again.'
}

export default function CoursesListPage() {
  const navigate = useNavigate()
  const { toasts, toast, dismiss } = useToast()

  const [page, setPage]         = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [formError, setFormError]   = useState(null)

  const { data, isPending, isError } = useCoursesList({ page, page_size: PAGE_SIZE })
  const courses    = data?.data ?? []
  const meta       = data?.meta ?? {}
  const totalPages = meta.total ? Math.ceil(meta.total / PAGE_SIZE) : 1

  const createMutation = useCreateCourse()

  const handleCreate = async (payload) => {
    setFormError(null)
    try {
      await createMutation.mutateAsync(payload)
      setCreateOpen(false)
      toast({ message: 'Course added to the catalogue.' })
    } catch (err) {
      setFormError(extractApiError(err))
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => { setFormError(null); setCreateOpen(true) }}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex justify-center items-center py-20">
              <Spinner className="h-7 w-7" />
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-sm text-red-500">
              Failed to load courses. Please try again.
            </div>
          ) : courses.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm text-gray-400">No courses in the catalogue yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFormError(null); setCreateOpen(true) }}
              >
                Add your first course
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-6 py-3 text-left font-medium text-gray-500 w-12">#</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Course Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Description</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Added</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400">{c.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{c.course_name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="default" className="font-mono">{c.course_code}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs">
                        <span className="line-clamp-1">
                          {c.description || <span className="text-gray-300 italic">No description</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => navigate(`/courses/${c.id}`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isPending && meta.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, meta.total)} of {meta.total} courses
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <CourseFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
        apiError={formError}
      />

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
