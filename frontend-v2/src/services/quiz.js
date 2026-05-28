import api from './api'

// Admin
export const generateQuestions = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions`).then(r => r.data)
export const listQuestions = (projectId, learningPathId = null) => {
  const params = {}
  if (learningPathId) params.learning_path_id = learningPathId
  return api.get(`/admin/projects/${projectId}/questions`, { params }).then(r => r.data)
}
export const publishAllQuestions = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions/publish-all`).then(r => r.data)
export const publishQuestion = (projectId, questionId, isPublished) =>
  api.patch(`/admin/projects/${projectId}/questions/${questionId}/publish`, { is_published: isPublished }).then(r => r.data)
export const updateQuestion = (projectId, questionId, data) =>
  api.put(`/admin/projects/${projectId}/questions/${questionId}`, data).then(r => r.data)
export const deleteQuestion = (projectId, questionId) =>
  api.delete(`/admin/projects/${projectId}/questions/${questionId}`)

// Learner — project-level (backward compat)
export const getQuiz = (projectId) =>
  api.get(`/user/projects/${projectId}/quiz`).then(r => r.data)
export const submitQuiz = (projectId, answers) =>
  api.post(`/user/projects/${projectId}/quiz/submit`, { answers }).then(r => r.data)

// Learner — path-scoped
export const getPathQuiz = (projectId, pathId, count = null) => {
  const params = {}
  if (count) params.count = count
  return api.get(`/user/projects/${projectId}/paths/${pathId}/quiz`, { params }).then(r => r.data)
}
export const submitPathQuiz = (projectId, pathId, answers) =>
  api.post(`/user/projects/${projectId}/paths/${pathId}/quiz/submit`, { answers }).then(r => r.data)
export const getPathAdaptiveQuestions = (projectId, pathId) =>
  api.get(`/user/projects/${projectId}/paths/${pathId}/quiz/adaptive`).then(r => r.data)
