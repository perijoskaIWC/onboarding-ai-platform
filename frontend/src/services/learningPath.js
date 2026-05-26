import api from './api';

export const getLearningPath = (projectId, pathName = null) =>
  api.get(`/user/projects/${projectId}/learning-path`, {
    params: pathName ? { path_name: pathName } : {},
  });

export const listMyPathNames = (projectId) =>
  api.get(`/user/projects/${projectId}/learning-path/names`);

export const completeModule = (projectId, moduleId) =>
  api.post(`/user/projects/${projectId}/learning-path/modules/${moduleId}/complete`);

export const adminGetLearningPath = (projectId, pathName = null) =>
  api.get(`/admin/projects/${projectId}/learning-path`, {
    params: pathName ? { path_name: pathName } : {},
  });

export const adminTriggerLearningPath = (projectId, pathName = 'Standard') =>
  api.post(`/admin/projects/${projectId}/learning-path`, null, {
    params: { path_name: pathName },
  });

export const adminListPathNames = (projectId) =>
  api.get(`/admin/projects/${projectId}/learning-path/names`);
