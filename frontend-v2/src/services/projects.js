import api from './api'

export const listAdminProjects = () => api.get('/admin/projects').then(r => r.data)
export const createProject = (data) => api.post('/admin/projects', data).then(r => r.data)
export const getProject = (id) => api.get(`/admin/projects/${id}`).then(r => r.data)
export const updateProject = (id, data) => api.patch(`/admin/projects/${id}`, data).then(r => r.data)
export const deleteProject = (id) => api.delete(`/admin/projects/${id}`)

export const getAvailableLearners = (projectId, pathId = null) => {
  const params = pathId ? { path_id: pathId } : {}
  return api.get(`/admin/projects/${projectId}/learners/available`, { params }).then(r => r.data)
}
export const assignLearner = (projectId, learnerId, learningPathId = null) =>
  api.post(`/admin/projects/${projectId}/learners`, { learner_id: learnerId, learning_path_id: learningPathId }).then(r => r.data)
export const bulkAssignLearners = (projectId, learnerIds, learningPathId = null) =>
  api.post(`/admin/projects/${projectId}/learners/bulk`, { learner_ids: learnerIds, learning_path_id: learningPathId }).then(r => r.data)
export const removeLearner = (projectId, learnerId, pathId = null) => {
  const params = pathId ? { path_id: pathId } : {}
  return api.delete(`/admin/projects/${projectId}/learners/${learnerId}`, { params })
}

export const listLearnerProjects = () => api.get('/user/projects').then(r => r.data)
export const getLearnerProject = (id) => api.get(`/user/projects/${id}`).then(r => r.data)
