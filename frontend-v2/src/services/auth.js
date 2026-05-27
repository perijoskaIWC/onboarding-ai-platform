import api from './api'

export function decodeToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}
export function getStoredToken() { return localStorage.getItem('access_token') }
export function getRole() {
  const t = getStoredToken()
  return t ? decodeToken(t)?.role ?? null : null
}
export function getUserEmail() {
  const t = getStoredToken()
  return t ? decodeToken(t)?.sub ?? null : null
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('access_token', data.access_token)
  return data
}
export async function logout() {
  try { await api.post('/auth/logout') } finally { localStorage.removeItem('access_token') }
}
