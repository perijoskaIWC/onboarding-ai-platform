import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { decodeToken, getStoredToken } from '../../services/auth'
import { listLearnerProjects } from '../../services/projects'

function useCountUp(target, duration = 800, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active || target === 0) { setCount(target); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setCount(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

function StatChip({ label, value, suffix = '', color, ready }) {
  const animated = useCountUp(value, 700, ready)
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${colors[color]} min-w-[88px]`}>
      <span className="text-2xl font-bold tabular-nums">{animated}{suffix}</span>
      <span className="text-xs font-medium mt-0.5 opacity-70">{label}</span>
    </div>
  )
}

export default function LearnerDashboard() {
  const token = getStoredToken()
  const email = decodeToken(token)?.sub ?? ''
  const name = email.split('@')[0]
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsReady, setStatsReady] = useState(false)

  useEffect(() => {
    listLearnerProjects()
      .then((data) => {
        setProjects(data)
        setTimeout(() => setStatsReady(true), 100)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalProjects = projects.length
  const avgReadiness = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.readiness_score ?? 0), 0) / projects.length * 100)
    : 0
  const activeCount = projects.filter((p) => (p.readiness_score ?? 0) > 0 && (p.readiness_score ?? 0) < 1).length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{name} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">Continue where you left off.</p>
      </div>

      {/* Stat chips */}
      {!loading && projects.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          <StatChip label="Projects" value={totalProjects} color="indigo" ready={statsReady} />
          <StatChip label="Avg. Readiness" value={avgReadiness} suffix="%" color="violet" ready={statsReady} />
          <StatChip label="In Progress" value={activeCount} color="emerald" ready={statsReady} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mx-auto flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800 text-base">No projects yet</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">You'll see your onboarding projects here once an admin assigns them to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => {
            const pct = Math.round((p.readiness_score ?? 0) * 100)
            return (
              <div key={p.id} className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <h3 className="font-semibold text-slate-800 truncate">{p.name}</h3>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-400">Readiness</span>
                    <span className="text-xs font-semibold text-slate-700">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

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
