import api from './api'

// Admin
export const generateLearningPath = (projectId, instruction = '', durationWeeks = null, documentIds = [], pathName = '') => {
  const params = { instruction }
  if (durationWeeks) params.duration_weeks = durationWeeks
  if (pathName) params.path_name = pathName
  return api.post(`/admin/projects/${projectId}/learning-path`, { document_ids: documentIds }, { params }).then(r => r.data)
}
export const getAdminLearningPath = (projectId, pathId = null, pathName = null) => {
  const params = {}
  if (pathId) params.path_id = pathId
  if (pathName) params.path_name = pathName
  return api.get(`/admin/projects/${projectId}/learning-path`, { params }).then(r => r.data)
}
export const listAdminLearningPaths = (projectId) =>
  api.get(`/admin/projects/${projectId}/learning-paths`).then(r => r.data)
export const publishLearningPath = (projectId, pathId) =>
  api.patch(`/admin/projects/${projectId}/learning-path/${pathId}/publish`).then(r => r.data)
export const pathDesignerChat = (projectId, message, history = [], documentIds = [], pathName = null) => {
  const body = { message, history, document_ids: documentIds }
  if (pathName) body.path_name = pathName
  return api.post(`/admin/projects/${projectId}/path-chat`, body).then(r => r.data)
}
export const listAdminPathNames = (projectId) =>
  api.get(`/admin/projects/${projectId}/learning-path/names`).then(r => r.data)
export const updateModule = (projectId, moduleId, fields) =>
  api.patch(`/admin/projects/${projectId}/learning-path/modules/${moduleId}`, fields).then(r => r.data)
export const draftModuleContent = (projectId, moduleId) =>
  api.post(`/admin/projects/${projectId}/learning-path/modules/${moduleId}/draft-content`).then(r => r.data)

// Learner
export const getLearnerLearningPath = (projectId, pathId = null) => {
  const params = {}
  if (pathId) params.path_id = pathId
  return api.get(`/user/projects/${projectId}/learning-path`, { params }).then(r => r.data)
}
export const listLearnerPaths = (projectId) =>
  api.get(`/user/projects/${projectId}/paths`).then(r => r.data)
export const getLearnerPath = (projectId, pathId) =>
  api.get(`/user/projects/${projectId}/paths/${pathId}`).then(r => r.data)
export const listLearnerPathNames = (projectId) =>
  api.get(`/user/projects/${projectId}/learning-path/names`).then(r => r.data)
export const completeModule = (projectId, moduleId) =>
  api.post(`/user/projects/${projectId}/learning-path/modules/${moduleId}/complete`).then(r => r.data)
export const completePathModule = (projectId, pathId, moduleId) =>
  api.post(`/user/projects/${projectId}/paths/${pathId}/modules/${moduleId}/complete`).then(r => r.data)
