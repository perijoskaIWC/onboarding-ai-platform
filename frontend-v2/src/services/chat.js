import api from './api'

// Global tutor — answers across ALL of the learner's assigned projects/documents.
export const askTutor = (message) =>
  api.post(`/user/chat`, { question: message }).then(r => r.data)

// Per-project tutor (currently unused — kept for the path-scoped option we shelved).
export const sendMessage = (projectId, message) =>
  api.post(`/user/projects/${projectId}/chat`, { question: message }).then(r => r.data)
