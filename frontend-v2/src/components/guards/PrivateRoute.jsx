import { Navigate } from 'react-router-dom'
import { getRole } from '../../services/auth'

export default function PrivateRoute({ role, children }) {
  const userRole = getRole()
  if (!userRole) return <Navigate to="/v2/login" replace />
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'admin' ? '/v2/admin' : '/v2/learner'} replace />
  }
  return children
}
