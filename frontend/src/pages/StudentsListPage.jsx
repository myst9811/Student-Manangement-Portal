import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft, ChevronRight, Eye, Pencil, UserX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { StudentFormModal } from '@/components/students/StudentFormModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Toaster } from '@/components/Toaster'
import { useStudentsList, useCreateStudent, useUpdateStudent, useDeactivateStudent } from '@/hooks/useStudents'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 20

function extractApiError(err) {
  const code = err?.response?.data?.error?.code
  if (code === 'EMAIL_ALREADY_EXISTS') return 'That email is already registered.'
  return err?.response?.data?.message ?? 'Something went wrong. Please try again.'
}

export default function StudentsListPage() {
  const navigate = useNavigate()
  const { toasts, toast, dismiss } = useToast()

  const [page, setPage] = useState(1)
  const [includeInactive, setIncludeInactive] = useState(false)

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [formError, setFormError] = useState(null)

  const params = { page, page_size: PAGE_SIZE, ...(includeInactive && { include_inactive: true }) }
  const { data, isPending, isError } = useStudentsList(params)
  const students = data?.data ?? []
  const meta     = data?.meta ?? {}
  const totalPages = meta.total ? Math.ceil(meta.total / PAGE_SIZE) : 1

  const createMutation     = useCreateStudent()
  const updateMutation     = useUpdateStudent(editTarget?.id)
  const deactivateMutation = useDeactivateStudent()

  const handleCreate = async (payload) => {
    setFormError(null)
    try {
      await createMutation.mutateAsync(payload)
      setCreateOpen(false)
      toast({ message: 'Student added successfully.' })
    } catch (err) {
      setFormError(extractApiError(err))
    }
  }

  const handleEdit = async (payload) => {
    setFormError(null)
    try {
      await updateMutation.mutateAsync(payload)
      setEditTarget(null)
      toast({ message: 'Student updated successfully.' })
    } catch (err) {
      setFormError(extractApiError(err))
    }
  }

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(deactivateTarget.id)
      setDeactivateTarget(null)
      toast({ message: `${deactivateTarget.first_name} ${deactivateTarget.last_name} has been deactivated.` })
    } catch {
      toast({ message: 'Failed to deactivate student.', variant: 'error' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => { setIncludeInactive(e.target.checked); setPage(1) }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show inactive students
        </label>
        <Button
          onClick={() => { setFormError(null); setCreateOpen(true) }}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
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
              Failed to load students. Please try again.
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No students found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-6 py-3 text-left font-medium text-gray-500 w-12">#</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Enrolled</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400">{s.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{s.email}</td>
                      <td className="px-6 py-4 text-gray-600">{s.enrollment_date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={s.is_active ? 'success' : 'secondary'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/students/${s.id}`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setFormError(null); setEditTarget(s) }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {s.is_active && (
                            <button
                              onClick={() => setDeactivateTarget(s)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                              title="Deactivate"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
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
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, meta.total)} of {meta.total} students
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
      <StudentFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
        apiError={formError}
      />

      {/* Edit modal */}
      <StudentFormModal
        open={Boolean(editTarget)}
        onOpenChange={(v) => !v && setEditTarget(null)}
        onSubmit={handleEdit}
        defaultValues={editTarget}
        loading={updateMutation.isPending}
        apiError={formError}
      />

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(v) => !v && setDeactivateTarget(null)}
        title="Deactivate Student"
        description={
          deactivateTarget
            ? `Are you sure you want to deactivate ${deactivateTarget.first_name} ${deactivateTarget.last_name}? They will no longer appear in active records.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
      />

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
