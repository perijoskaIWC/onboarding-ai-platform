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
    <div>
      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Your Projects</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-36 bg-white rounded-lg shadow p-4 animate-pulse" />
              ))}
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18"/></svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">No projects assigned</h3>
            <p className="text-sm text-gray-500 mt-1">You will see projects here once an admin assigns them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                    <div className="mt-3 text-sm text-gray-600">
                      Readiness: <span className="font-medium">{Math.round((p.readiness_score ?? 0) * 100)}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t pt-3 flex gap-2">
                  <Link to={`/learner/projects/${p.id}/learning-path`} className="px-3 py-1.5 text-sm rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700">Learning Path</Link>
                  <Link to={`/learner/projects/${p.id}/chat`} className="px-3 py-1.5 text-sm rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700">AI Tutor</Link>
                  <Link to={`/learner/projects/${p.id}/quiz`} className="px-3 py-1.5 text-sm rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700">Quiz</Link>
                  <Link to={`/learner/projects/${p.id}/progress`} className="px-3 py-1.5 text-sm rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700">Progress</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
