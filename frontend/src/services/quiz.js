import api from './api';

export const getQuiz = (projectId, count = null) =>
  api.get(`/user/projects/${projectId}/quiz`, { params: count ? { count } : {} });

export const submitQuiz = (projectId, answers) =>
  api.post(`/user/projects/${projectId}/quiz/submit`, { answers });

export const adminGenerateQuestions = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions`);

export const adminListQuestions = (projectId) =>
  api.get(`/admin/projects/${projectId}/questions`);

export const adminPublishQuestion = (projectId, questionId, isPublished) =>
  api.patch(`/admin/projects/${projectId}/questions/${questionId}/publish`, { is_published: isPublished });

export const adminPublishAll = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions/publish-all`);

export const adminUpdateQuestion = (projectId, questionId, data) =>
  api.put(`/admin/projects/${projectId}/questions/${questionId}`, data);

export const adminDeleteQuestion = (projectId, questionId) =>
  api.delete(`/admin/projects/${projectId}/questions/${questionId}`);

export const getAdaptiveQuestions = (projectId) =>
  api.get(`/user/projects/${projectId}/quiz/adaptive`);
