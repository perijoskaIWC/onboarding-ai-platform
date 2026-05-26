import api from './api';

export const getAnalytics = (projectId) =>
  api.get(`/admin/projects/${projectId}/analytics`);
