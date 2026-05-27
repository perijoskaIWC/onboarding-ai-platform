import api from './api';

export const uploadDocument = (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/admin/projects/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listDocuments = (projectId) =>
  api.get(`/admin/projects/${projectId}/documents`);

export const deleteDocument = (projectId, docId) =>
  api.delete(`/admin/projects/${projectId}/documents/${docId}`);

export const reprocessDocument = (projectId, docId) =>
  api.post(`/admin/projects/${projectId}/documents/${docId}/reprocess`);
