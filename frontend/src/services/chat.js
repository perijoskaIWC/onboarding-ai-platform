import api from './api';

export const sendMessage = (projectId, question) =>
  api.post(`/user/projects/${projectId}/chat`, { question });
