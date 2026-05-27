import api from './api'

export const generateLearningPath = (projectId, instruction = '', durationWeeks = null) => {
  const params = { instruction }
  if (durationWeeks) params.duration_weeks = durationWeeks
  return api.post(`/admin/projects/${projectId}/learning-path`, null, { params }).then(r => r.data)
}
export const getAdminLearningPath = (projectId) =>
  api.get(`/admin/projects/${projectId}/learning-path`).then(r => r.data)
export const publishLearningPath = (projectId, pathId) =>
  api.patch(`/admin/projects/${projectId}/learning-path/${pathId}/publish`).then(r => r.data)
export const pathDesignerChat = (projectId, message, history = [], documentIds = []) =>
  api.post(`/admin/projects/${projectId}/path-chat`, { message, history, document_ids: documentIds }).then(r => r.data)

export const getLearnerLearningPath = (projectId) =>
  api.get(`/user/projects/${projectId}/learning-path`).then(r => r.data)
export const listLearnerPathNames = (projectId) =>
  api.get(`/user/projects/${projectId}/learning-path/names`).then(r => r.data)
export const completeModule = (projectId, moduleId) =>
  api.post(`/user/projects/${projectId}/learning-path/modules/${moduleId}/complete`).then(r => r.data)
