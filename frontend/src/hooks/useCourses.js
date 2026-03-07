import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesApi } from '@/api/courses'

export const COURSES_KEY = 'courses'

export function useCoursesList(params) {
  return useQuery({
    queryKey: [COURSES_KEY, 'list', params],
    queryFn: () => coursesApi.list(params).then((r) => r.data),
  })
}

export function useCourse(id) {
  return useQuery({
    queryKey: [COURSES_KEY, id],
    queryFn: () => coursesApi.get(id).then((r) => r.data),
    enabled: Boolean(id),
  })
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => coursesApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COURSES_KEY] }),
  })
}
