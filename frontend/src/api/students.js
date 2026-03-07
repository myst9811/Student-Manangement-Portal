import client from './client'

export const studentsApi = {
  list: (params) => client.get('/students', { params }),
  get: (id, params) => client.get(`/students/${id}`, { params }),
  create: (data) => client.post('/students', data),
  update: (id, data) => client.put(`/students/${id}`, data),
  deactivate: (id) => client.delete(`/students/${id}`),
  getCourses: (id) => client.get(`/students/${id}/courses`),
  enroll: (studentId, courseId) =>
    client.post(`/students/${studentId}/courses`, { course_id: courseId }),
  unenroll: (studentId, courseId) =>
    client.delete(`/students/${studentId}/courses/${courseId}`),
}
