import { Navigate } from 'react-router-dom'
import { getRole, getStoredToken, decodeToken } from '../services/auth'

export default function PrivateRoute({ role: requiredRole, children }) {
  const token = getStoredToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const payload = decodeToken(token)
  const now = Math.floor(Date.now() / 1000)

  if (!payload || payload.exp < now) {
    localStorage.removeItem('access_token')
    return <Navigate to="/login" replace />
  }

  if (payload.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600 text-lg font-medium">
          403 — You do not have permission to access this page.
        </p>
      </div>
    )
  }

  return children
}
