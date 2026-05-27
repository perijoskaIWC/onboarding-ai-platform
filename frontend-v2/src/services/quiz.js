import api from './api'

// Admin
export const generateQuestions = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions`).then(r => r.data)
export const listQuestions = (projectId) =>
  api.get(`/admin/projects/${projectId}/questions`).then(r => r.data)
export const publishAllQuestions = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions/publish-all`).then(r => r.data)
export const publishQuestion = (projectId, questionId, isPublished) =>
  api.patch(`/admin/projects/${projectId}/questions/${questionId}/publish`, { is_published: isPublished }).then(r => r.data)
export const updateQuestion = (projectId, questionId, data) =>
  api.put(`/admin/projects/${projectId}/questions/${questionId}`, data).then(r => r.data)
export const deleteQuestion = (projectId, questionId) =>
  api.delete(`/admin/projects/${projectId}/questions/${questionId}`)

// Learner
export const getQuiz = (projectId) =>
  api.get(`/user/projects/${projectId}/quiz`).then(r => r.data)
export const submitQuiz = (projectId, answers) =>
  api.post(`/user/projects/${projectId}/quiz/submit`, { answers }).then(r => r.data)
