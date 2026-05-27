import api from './api'

export const getProgress = (projectId) =>
  api.get(`/user/projects/${projectId}/progress`).then(r => r.data)

export const getAnalytics = (projectId) =>
  api.get(`/admin/projects/${projectId}/analytics`).then(r => r.data)
