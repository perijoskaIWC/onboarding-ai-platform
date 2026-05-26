import api from './api';

export const getLearningPath = (projectId) =>
  api.get(`/user/projects/${projectId}/learning-path`);

export const completeModule = (projectId, moduleId) =>
  api.post(`/user/projects/${projectId}/learning-path/modules/${moduleId}/complete`);

export const adminGetLearningPath = (projectId) =>
  api.get(`/admin/projects/${projectId}/learning-path`);

export const adminTriggerLearningPath = (projectId) =>
  api.post(`/admin/projects/${projectId}/learning-path`);
