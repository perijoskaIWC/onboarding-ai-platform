import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []
const processQueue = (error) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve())
  failedQueue = []
}

api.interceptors.response.use(
  r => r,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(() => api(orig)).catch(e => Promise.reject(e))
      }
      orig._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        localStorage.setItem('access_token', data.access_token)
        processQueue(null)
        return api(orig)
      } catch (e) {
        processQueue(e)
        localStorage.removeItem('access_token')
        window.location.href = '/v2/login'
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
