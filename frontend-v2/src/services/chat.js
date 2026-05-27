import api from './api'

export const sendMessage = (projectId, message) =>
  api.post(`/user/projects/${projectId}/chat`, { question: message }).then(r => r.data)
