import api from './api'

// Admin
export const listAdminProjects = () => api.get('/admin/projects').then((r) => r.data)
export const createProject = (data) => api.post('/admin/projects', data).then((r) => r.data)
export const getProject = (id) => api.get(`/admin/projects/${id}`).then((r) => r.data)
export const updateProject = (id, data) => api.patch(`/admin/projects/${id}`, data).then((r) => r.data)
export const deleteProject = (id) => api.delete(`/admin/projects/${id}`)
export const assignLearner = (projectId, learnerId) =>
  api.post(`/admin/projects/${projectId}/learners`, { learner_id: learnerId }).then((r) => r.data)
export const removeLearner = (projectId, learnerId) =>
  api.delete(`/admin/projects/${projectId}/learners/${learnerId}`)
export const getAvailableLearners = (projectId) =>
  api.get(`/admin/projects/${projectId}/learners/available`).then((r) => r.data)
export const bulkAssignLearners = (projectId, learnerIds) =>
  api.post(`/admin/projects/${projectId}/learners/bulk`, { learner_ids: learnerIds }).then((r) => r.data)

// Learner
export const listLearnerProjects = () => api.get('/user/projects').then((r) => r.data)
export const getLearnerProject = (id) => api.get(`/user/projects/${id}`).then((r) => r.data)
