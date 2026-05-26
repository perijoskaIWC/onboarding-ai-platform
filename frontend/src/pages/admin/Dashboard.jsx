import { Link, useNavigate } from 'react-router-dom'
import { logout, decodeToken, getStoredToken } from '../../services/auth'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/admin/projects"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Manage onboarding projects and learners</p>
        </Link>
      </div>
    </div>
  )
}
