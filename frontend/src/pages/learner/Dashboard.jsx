import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { decodeToken, getStoredToken } from '../../services/auth'
import { listLearnerProjects } from '../../services/projects'

export default function LearnerDashboard() {
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''
  const name = email.split('@')[0]
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listLearnerProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Hero greeting */}
      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{name} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">Continue where you left off.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">No projects yet</h3>
          <p className="text-sm text-slate-500 mt-1">You'll see projects here once an admin assigns them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => {
            const pct = Math.round((p.readiness_score ?? 0) * 100)
            return (
              <div key={p.id} className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col">
                {/* Project name + description */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Readiness</span>
                    <span className="text-xs font-semibold text-slate-700">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <Link
                    to={`/learner/projects/${p.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Open project
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
