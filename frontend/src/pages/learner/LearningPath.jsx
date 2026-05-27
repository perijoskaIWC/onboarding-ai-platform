import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getLearningPath, completeModule } from '../../services/learningPath'
import ReadingMaterial from '../../components/ReadingMaterial'

function NodeIcon({ completed, active, index }) {
  if (completed) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (active) {
    return (
      <div className="w-9 h-9 rounded-full bg-indigo-600 border-2 border-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
        <span className="text-white text-xs font-bold">{index + 1}</span>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0">
      <span className="text-slate-400 text-xs font-semibold">{index + 1}</span>
    </div>
  )
}

function TimelineConnector({ completed }) {
  return (
    <div className="flex justify-center w-9 shrink-0">
      <div className={`w-0.5 h-8 ${completed ? 'bg-emerald-300' : 'bg-slate-200'}`} />
    </div>
  )
}

export default function LearningPath() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getLearningPath(projectId)
      setData(res.data)
    } catch {
      setError('Failed to load learning path.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [projectId])

  async function handleComplete(moduleId) {
    setCompleting(moduleId)
    try {
      await completeModule(projectId, moduleId)
      await load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading) return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-7 bg-slate-100 rounded-lg w-1/3" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
          <div className="flex-1 bg-white rounded-xl border border-slate-100 p-4 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-sm text-red-600">{error}</div>
    </div>
  )

  if (!data || data.status === 'not_published') return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-8 text-center">
        <p className="text-amber-800 font-semibold">No learning path available yet</p>
        <p className="text-amber-600 text-sm mt-1">Your admin hasn't published a learning path for this project.</p>
      </div>
    </div>
  )

  const modules = data.modules ?? []
  const completed = modules.filter((m) => m.completed).length
  const pct = modules.length ? Math.round((completed / modules.length) * 100) : 0
  const firstIncomplete = modules.findIndex((m) => !m.completed)

  // Group by week for the week-badge header
  const byWeek = {}
  for (const m of modules) {
    const w = m.week_number ?? 1
    if (!byWeek[w]) byWeek[w] = []
    byWeek[w].push(m)
  }
  const weekStarts = new Set(
    Object.values(byWeek).map((grp) => grp[0].id)
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Learning Path</h1>
        {data.overview && (
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{data.overview}</p>
        )}
      </div>

      {/* Progress summary */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-700">Progress</span>
          <span className="text-sm font-bold text-slate-900">{completed} / {modules.length} modules</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-400">
            {pct === 100 ? 'All done!' : pct === 0 ? 'Not started' : 'In progress'}
          </span>
          <span className="text-xs font-semibold text-slate-700">{pct}%</span>
        </div>
      </div>

      {/* Timeline with week separators */}
      {modules.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No modules yet.</div>
      ) : (
        <div>
          {modules.map((mod, i) => {
            const isCompleted = mod.completed
            const isActive = i === firstIncomplete
            const isLast = i === modules.length - 1
            const isWeekStart = weekStarts.has(mod.id)
            const weekNum = mod.week_number ?? 1

            return (
              <div key={mod.id}>
                {isWeekStart && (
                  <div className="flex items-center gap-3 mb-3 mt-2">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Week {weekNum}</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                )}
                <div className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <NodeIcon completed={isCompleted} active={isActive} index={i} />
                  </div>
                  <div className={`flex-1 mb-1 rounded-xl border transition-all duration-200 p-5 ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : isActive
                      ? 'bg-white border-indigo-200 shadow-sm shadow-indigo-50'
                      : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm leading-tight ${isCompleted ? 'text-emerald-800' : 'text-slate-800'}`}>
                          {mod.title}
                        </h3>
                        {mod.summary && (
                          <p className={`text-xs mt-1 leading-relaxed ${isCompleted ? 'text-emerald-700/70' : 'text-slate-500'}`}>
                            {mod.summary}
                          </p>
                        )}
                        {mod.key_concepts && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mod.key_concepts.split(',').slice(0, 4).map((c) => (
                              <span key={c} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {c.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <ReadingMaterial chunks={mod.chunks ?? []} />
                      </div>
                      {isCompleted ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </span>
                      ) : (
                        <button
                          onClick={() => handleComplete(mod.id)}
                          disabled={completing === mod.id}
                          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          } disabled:opacity-50`}
                        >
                          {completing === mod.id ? 'Saving…' : 'Mark done'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {!isLast && (
                  <div className="flex gap-4">
                    <TimelineConnector completed={isCompleted} />
                    <div className="flex-1" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
