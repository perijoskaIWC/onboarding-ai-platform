import api from './api';

export const adminListWeeklyPlans = (projectId) =>
  api.get(`/admin/projects/${projectId}/weekly-plans`);

export const adminCreateWeeklyPlan = (projectId, data) =>
  api.post(`/admin/projects/${projectId}/weekly-plans`, data);

export const adminUpdateWeeklyPlan = (projectId, planId, data) =>
  api.put(`/admin/projects/${projectId}/weekly-plans/${planId}`, data);

export const adminDeleteWeeklyPlan = (projectId, planId) =>
  api.delete(`/admin/projects/${projectId}/weekly-plans/${planId}`);

export const getWeeklyPlans = (projectId) =>
  api.get(`/user/projects/${projectId}/weekly-plans`);
