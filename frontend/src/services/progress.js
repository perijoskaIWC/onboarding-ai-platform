import api from './api';

export const getProgress = (projectId) =>
  api.get(`/user/projects/${projectId}/progress`);
