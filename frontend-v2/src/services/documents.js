import api from './api'

export const listProjectDocuments = (projectId) =>
  api.get(`/admin/projects/${projectId}/documents`).then(r => r.data)
export const uploadDocument = (projectId, formData) =>
  api.post(`/admin/projects/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
export const reprocessDocument = (projectId, docId) =>
  api.post(`/admin/projects/${projectId}/documents/${docId}/reprocess`).then(r => r.data)
export const deleteDocument = (projectId, docId) =>
  api.delete(`/admin/projects/${projectId}/documents/${docId}`)
