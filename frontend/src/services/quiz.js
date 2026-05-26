import api from './api';

export const getQuiz = (projectId) =>
  api.get(`/user/projects/${projectId}/quiz`);

export const submitQuiz = (projectId, answers) =>
  api.post(`/user/projects/${projectId}/quiz/submit`, { answers });

export const adminGenerateQuestions = (projectId) =>
  api.post(`/admin/projects/${projectId}/questions`);

export const adminListQuestions = (projectId) =>
  api.get(`/admin/projects/${projectId}/questions`);
