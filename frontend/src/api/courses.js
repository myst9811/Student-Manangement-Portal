import client from './client'

export const coursesApi = {
  list: (params) => client.get('/courses', { params }),
  get: (id) => client.get(`/courses/${id}`),
  create: (data) => client.post('/courses', data),
}
