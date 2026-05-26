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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/projects"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
            <p className="text-sm text-gray-500 mt-1">Manage onboarding projects and learners</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
