import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout, decodeToken, getStoredToken } from '../../services/auth'
import { listLearnerProjects } from '../../services/projects'

export default function LearnerDashboard() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listLearnerProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Onboarding</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{email}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Projects</h2>
        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400">You have no assigned projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-800">{p.name}</h3>
                {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                <div className="mt-3 text-sm text-gray-600">
                  Readiness: <span className="font-medium">{Math.round((p.readiness_score ?? 0) * 100)}%</span>
                </div>
                <div className="flex gap-3 mt-3">
                  <Link to={`/learner/projects/${p.id}/learning-path`} className="text-blue-600 text-sm hover:underline">
                    Learning Path
                  </Link>
                  <Link to={`/learner/projects/${p.id}/chat`} className="text-blue-600 text-sm hover:underline">
                    AI Tutor
                  </Link>
                  <Link to={`/learner/projects/${p.id}/quiz`} className="text-blue-600 text-sm hover:underline">
                    Quiz
                  </Link>
                  <Link to={`/learner/projects/${p.id}/progress`} className="text-blue-600 text-sm hover:underline">
                    Progress
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
