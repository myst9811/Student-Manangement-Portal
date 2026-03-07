import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi } from '@/api/students'

export const STUDENTS_KEY = 'students'

export function useStudentsList(params) {
  return useQuery({
    queryKey: [STUDENTS_KEY, 'list', params],
    queryFn: () => studentsApi.list(params).then((r) => r.data),
  })
}

export function useStudent(id) {
  return useQuery({
    queryKey: [STUDENTS_KEY, id],
    queryFn: () => studentsApi.get(id).then((r) => r.data),
    enabled: Boolean(id),
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => studentsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  })
}

export function useUpdateStudent(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => studentsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  })
}

export function useDeactivateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => studentsApi.deactivate(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDENTS_KEY] }),
  })
}

export function useEnrollStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, courseId }) =>
      studentsApi.enroll(studentId, courseId).then((r) => r.data),
    onSuccess: (_data, { studentId }) => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY, studentId] })
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY, String(studentId)] })
    },
  })
}

export function useUnenrollStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, courseId }) =>
      studentsApi.unenroll(studentId, courseId).then((r) => r.data),
    onSuccess: (_data, { studentId }) => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY, studentId] })
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY, String(studentId)] })
    },
  })
}
