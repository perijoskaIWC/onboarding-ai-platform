import api from './api'

export function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem('access_token')
}

export function getRole() {
  const token = getStoredToken()
  if (!token) return null
  return decodeToken(token)?.role ?? null
}

export function getUserId() {
  const token = getStoredToken()
  if (!token) return null
  return decodeToken(token)?.sub ?? null
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('access_token', data.access_token)
  return data
}

export async function register(email, password) {
  const { data } = await api.post('/auth/register', { email, password })
  localStorage.setItem('access_token', data.access_token)
  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem('access_token')
  }
}

export async function refreshToken() {
  const { data } = await api.post('/auth/refresh')
  localStorage.setItem('access_token', data.access_token)
  return data
}
